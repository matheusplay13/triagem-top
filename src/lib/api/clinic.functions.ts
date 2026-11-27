import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../prisma";
import { createToken, hashPassword, requireRole, verifyPassword } from "../auth.server";
import { PLAN_IDS, canAddDoctor, getPlan, isPlanId, type PlanId } from "../plans";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  specialty: true,
  crm: true,
  active: true,
  createdAt: true,
  clinicId: true,
} as const;

// ---------- Cadastro de clínica (cria a clínica + conta do gestor) ----------
export const registerClinicFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clinicName: z.string().min(2),
      cnpj: z.string().max(25).optional(),
      phone: z.string().max(25).optional(),
      address: z.string().optional(),
      adminName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      // Sem plano não há cadastro
      plan: z.enum(PLAN_IDS, {
        errorMap: () => ({ message: "Escolha um plano para cadastrar a clínica." }),
      }),
      termsAccepted: z.literal(true, {
        errorMap: () => ({
          message: "É obrigatório aceitar os Termos de Uso e a Política de Proteção de Dados (LGPD).",
        }),
      }),
      exclusiveUseAccepted: z.literal(true, {
        errorMap: () => ({
          message: "É obrigatório confirmar o uso exclusivo do sistema Sem Espera na unidade.",
        }),
      }),
    }),
  )
  .handler(async ({ data }) => {
    if (!isPlanId(data.plan)) throw new Error("Escolha um plano para cadastrar a clínica.");

    const email = data.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Este e-mail já está cadastrado.");

    const clinic = await prisma.clinic.create({
      data: {
        name: data.clinicName,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        address: data.address || null,
        plan: data.plan,
        termsAccepted: true,
        exclusiveUseAccepted: true,
        termsAcceptedAt: new Date(),
        users: {
          create: {
            name: data.adminName,
            email,
            password: hashPassword(data.password),
            role: "admin",
          },
        },
      },
      include: { users: { select: publicUser } },
    });

    const admin = clinic.users[0];
    return {
      token: createToken({ userId: admin.id, clinicId: clinic.id, role: "admin" }),
      user: { ...admin, clinicName: clinic.name },
    };
  });

// ---------- Login (gestor ou médico) ----------
export const loginFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
      include: { clinic: true },
    });
    if (!user || !user.clinicId || !verifyPassword(data.password, user.password)) {
      throw new Error("E-mail ou senha incorretos.");
    }
    if (!user.active) throw new Error("Seu acesso foi desativado pela clínica.");
    if (user.role !== "admin" && user.role !== "doctor") throw new Error("Acesso negado.");
    // O gestor pode entrar para escolher um plano; médicos só entram se a clínica tiver plano ativo
    if (user.role === "doctor" && !getPlan(user.clinic?.plan)) {
      throw new Error("Sua clínica não possui um plano ativo. Fale com o gestor.");
    }

    return {
      token: createToken({ userId: user.id, clinicId: user.clinicId, role: user.role }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "admin" | "doctor",
        clinicId: user.clinicId,
        clinicName: user.clinic?.name ?? "",
      },
    };
  });

// ---------- Gerenciamento (somente gestor da clínica) ----------
export const getClinicFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin"]);
    const clinic = await prisma.clinic.findUnique({ where: { id: session.clinicId } });
    if (!clinic) throw new Error("Clínica não encontrada.");
    const staff = await prisma.user.findMany({
      where: { clinicId: session.clinicId },
      select: publicUser,
      orderBy: { createdAt: "asc" },
    });
    return { clinic, staff };
  });

// ---------- Plano da clínica (gestor e médicos) ----------
export const getMyPlanFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin", "doctor"]);
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.clinicId },
      select: { plan: true },
    });
    if (!clinic) throw new Error("Clínica não encontrada.");
    const doctors = await prisma.user.count({ where: { clinicId: session.clinicId, role: "doctor" } });
    return { plan: (isPlanId(clinic.plan) ? clinic.plan : null) as PlanId | null, doctors };
  });

// ---------- Troca de plano (pagamento simulado) ----------
export const changePlanFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), plan: z.enum(PLAN_IDS) }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin"]);
    const target = getPlan(data.plan);
    if (!target) throw new Error("Plano inválido.");

    const doctors = await prisma.user.count({ where: { clinicId: session.clinicId, role: "doctor" } });
    if (target.maxDoctors !== null && doctors > target.maxDoctors) {
      throw new Error(
        `O plano ${target.name} permite até ${target.maxDoctors} médicos e sua clínica tem ${doctors}. Remova médicos antes de mudar.`,
      );
    }

    const clinic = await prisma.clinic.update({
      where: { id: session.clinicId },
      data: { plan: target.id },
    });
    return { plan: clinic.plan as PlanId };
  });

export const createDoctorFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      specialty: z.string().optional(),
      crm: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin"]);

    // Limite de médicos conforme o plano da clínica
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.clinicId },
      select: { plan: true },
    });
    const plan = getPlan(clinic?.plan);
    if (!plan) throw new Error("Sua clínica não possui um plano ativo. Escolha um plano para cadastrar médicos.");
    const doctorCount = await prisma.user.count({ where: { clinicId: session.clinicId, role: "doctor" } });
    if (!canAddDoctor(plan, doctorCount)) {
      throw new Error(
        `Seu plano ${plan.name} permite até ${plan.maxDoctors} médicos. Faça upgrade para cadastrar mais.`,
      );
    }

    const email = data.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Já existe um usuário com este e-mail.");

    return prisma.user.create({
      data: {
        name: data.name,
        email,
        password: hashPassword(data.password),
        role: "doctor",
        specialty: data.specialty || null,
        crm: data.crm || null,
        clinicId: session.clinicId,
      },
      select: publicUser,
    });
  });

async function getOwnDoctor(clinicId: string, doctorId: string) {
  const doctor = await prisma.user.findFirst({
    where: { id: doctorId, clinicId, role: "doctor" },
  });
  if (!doctor) throw new Error("Médico não encontrado nesta clínica.");
  return doctor;
}

export const removeDoctorFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), doctorId: z.string() }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin"]);
    await getOwnDoctor(session.clinicId, data.doctorId);
    await prisma.user.delete({ where: { id: data.doctorId } });
    return { ok: true };
  });

export const toggleDoctorFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), doctorId: z.string() }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin"]);
    const doctor = await getOwnDoctor(session.clinicId, data.doctorId);
    return prisma.user.update({
      where: { id: doctor.id },
      data: { active: !doctor.active },
      select: publicUser,
    });
  });

export const resetDoctorPasswordFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), doctorId: z.string(), password: z.string().min(6) }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin"]);
    await getOwnDoctor(session.clinicId, data.doctorId);
    await prisma.user.update({
      where: { id: data.doctorId },
      data: { password: hashPassword(data.password) },
    });
    return { ok: true };
  });
