import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../prisma";
import { createToken, hashPassword, requireRole, verifyPassword } from "../auth.server";

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
      cnpj: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      adminName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Este e-mail já está cadastrado.");

    const clinic = await prisma.clinic.create({
      data: {
        name: data.clinicName,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        address: data.address || null,
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
