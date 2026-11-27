import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireRole } from "../auth.server";

const clinicSummarySelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
} as const;

export const getPublicClinicsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const clinics = await prisma.clinic.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        exclusiveUseAccepted: true,
        _count: {
          select: {
            patients: {
              where: { status: "waiting" },
            },
          },
        },
      },
    });
    return clinics.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      phone: c.phone,
      exclusiveUseAccepted: c.exclusiveUseAccepted,
      waitingCount: c._count.patients,
    }));
  },
);

export const getPatientsFn = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        clinicId: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const clinicId = data?.clinicId?.trim() || undefined;
    const patients = await prisma.patient.findMany({
      where: clinicId ? { clinicId } : undefined,
      orderBy: { arrivedAt: "asc" },
      include: {
        clinic: { select: clinicSummarySelect },
        transfers: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            fromClinic: { select: clinicSummarySelect },
            toClinic: { select: clinicSummarySelect },
          },
        },
      },
    });
    return patients;
  });

export const createPatientFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2),
      age: z.number().int().min(0).max(130),
      document: z.string(),
      symptoms: z.string().min(3),
      painLevel: z.number().int().min(0).max(10),
      hasFever: z.boolean(),
      hasBreathingIssue: z.boolean(),
      hasChestPain: z.boolean(),
      priority: z.enum(["high", "medium", "low"]),
      clinicId: z.string().min(1, "Selecione o hospital ou clínica para onde você está indo."),
      lgpdConsent: z.literal(true, {
        errorMap: () => ({
          message: "É obrigatório aceitar a Política de Proteção de Dados (LGPD) e Termos de Uso.",
        }),
      }),
      truthfulnessConsent: z.literal(true, {
        errorMap: () => ({
          message: "É obrigatório confirmar a declaração de veracidade dos sintomas.",
        }),
      }),
      exclusiveSystemConsent: z.literal(true, {
        errorMap: () => ({
          message: "É obrigatório confirmar o uso exclusivo do sistema Sem Espera.",
        }),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const targetClinic = await prisma.clinic.findUnique({
      where: { id: data.clinicId },
      select: clinicSummarySelect,
    });
    if (!targetClinic) {
      throw new Error("O hospital ou clínica selecionado não foi encontrado.");
    }

    // Gera senha sequencial global para evitar colisões em transferências entre hospitais
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { arrivedAt: "desc" },
      select: { ticket: true },
    });

    let nextNum = 1;
    if (lastPatient && lastPatient.ticket.startsWith("T")) {
      const numPart = parseInt(lastPatient.ticket.substring(1), 10);
      if (!isNaN(numPart)) nextNum = numPart + 1;
    }
    const ticket = `T${String(nextNum).padStart(3, "0")}`;

    const newPatient = await prisma.patient.create({
      data: {
        name: data.name,
        age: data.age,
        document: data.document,
        symptoms: data.symptoms,
        painLevel: data.painLevel,
        hasFever: data.hasFever,
        hasBreathingIssue: data.hasBreathingIssue,
        hasChestPain: data.hasChestPain,
        priority: data.priority,
        clinicId: targetClinic.id,
        lgpdConsent: true,
        truthfulnessConsent: true,
        exclusiveSystemConsent: true,
        termsAcceptedAt: new Date(),
        ticket,
        status: "waiting",
      },
      include: {
        clinic: { select: clinicSummarySelect },
        transfers: {
          orderBy: { createdAt: "desc" },
          include: {
            fromClinic: { select: clinicSummarySelect },
            toClinic: { select: clinicSummarySelect },
          },
        },
      },
    });

    return newPatient;
  });

export const updatePatientStatusFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      status: z.enum(["waiting", "in_service", "done", "transferred"]),
    }),
  )
  .handler(async ({ data }) => {
    const updateData: { status: string; calledAt?: Date; finishedAt?: Date } = {
      status: data.status,
    };
    if (data.status === "in_service") updateData.calledAt = new Date();
    if (data.status === "done" || data.status === "transferred") {
      updateData.finishedAt = new Date();
    }

    return await prisma.patient.update({
      where: { id: data.id },
      data: updateData,
    });
  });

export const transferPatientFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      patientId: z.string().min(1),
      destinationUsesSystem: z.boolean(),
      toClinicId: z.string().optional(),
      externalHospitalName: z.string().optional(),
      externalHospitalAddress: z.string().optional(),
      externalHospitalPhone: z.string().optional(),
      reason: z.string().min(3, "Informe o motivo da transferência."),
      clinicalNotes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin", "doctor"]);

    const [patient, staffUser] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: data.patientId },
        include: { clinic: { select: clinicSummarySelect } },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, role: true },
      }),
    ]);

    if (!patient) throw new Error("Paciente não encontrado.");
    if (patient.clinicId && patient.clinicId !== session.clinicId) {
      throw new Error("Este paciente pertence a outra unidade de saúde.");
    }

    const fromClinicId = patient.clinicId ?? session.clinicId;

    if (data.destinationUsesSystem) {
      if (!data.toClinicId) {
        throw new Error("Selecione o hospital parceiro de destino.");
      }
      if (data.toClinicId === fromClinicId) {
        throw new Error("Selecione um hospital diferente da unidade atual.");
      }
      const targetClinic = await prisma.clinic.findUnique({
        where: { id: data.toClinicId },
        select: { id: true },
      });
      if (!targetClinic) {
        throw new Error("Hospital de destino não encontrado no sistema.");
      }
    } else {
      if (!data.externalHospitalName || data.externalHospitalName.trim().length < 2) {
        throw new Error("Informe o nome do hospital externo de destino.");
      }
    }

    const transferCount = await prisma.patientTransfer.count();
    const randomSuffix = Math.floor(10 + Math.random() * 89);
    const protocol = `TRF-${String(transferCount + 1).padStart(4, "0")}-${randomSuffix}`;

    const transfer = await prisma.$transaction(async (tx) => {
      const created = await tx.patientTransfer.create({
        data: {
          protocol,
          patientId: patient.id,
          fromClinicId,
          toClinicId: data.destinationUsesSystem ? data.toClinicId! : null,
          destinationUsesSystem: data.destinationUsesSystem,
          externalHospitalName: data.destinationUsesSystem
            ? null
            : data.externalHospitalName!.trim(),
          externalHospitalAddress: data.destinationUsesSystem
            ? null
            : data.externalHospitalAddress?.trim() || null,
          externalHospitalPhone: data.destinationUsesSystem
            ? null
            : data.externalHospitalPhone?.trim() || null,
          reason: data.reason.trim(),
          clinicalNotes: data.clinicalNotes?.trim() || null,
          transferredBy: staffUser?.name ?? "Equipe médica",
          status: data.destinationUsesSystem ? "received" : "completed",
        },
        include: {
          patient: true,
          fromClinic: { select: clinicSummarySelect },
          toClinic: { select: clinicSummarySelect },
        },
      });

      if (data.destinationUsesSystem) {
        await tx.patient.update({
          where: { id: patient.id },
          data: {
            clinicId: data.toClinicId!,
            status: "waiting",
            calledAt: null,
            finishedAt: null,
          },
        });
      } else {
        await tx.patient.update({
          where: { id: patient.id },
          data: {
            status: "transferred",
            finishedAt: new Date(),
          },
        });
      }

      return created;
    });

    return transfer;
  });

export const getTransfersFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const session = requireRole(data.token, ["admin", "doctor"]);
    const transfers = await prisma.patientTransfer.findMany({
      where: {
        OR: [{ fromClinicId: session.clinicId }, { toClinicId: session.clinicId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: {
            id: true,
            ticket: true,
            name: true,
            age: true,
            document: true,
            symptoms: true,
            painLevel: true,
            hasFever: true,
            hasBreathingIssue: true,
            hasChestPain: true,
            priority: true,
            status: true,
          },
        },
        fromClinic: { select: clinicSummarySelect },
        toClinic: { select: clinicSummarySelect },
      },
    });
    return transfers;
  });

export const removePatientFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return await prisma.patient.delete({
      where: { id: data.id },
    });
  });

export const clearAllFn = createServerFn({ method: "POST" })
  .validator(z.object({ clinicId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const clinicId = data?.clinicId?.trim() || undefined;
    return await prisma.patient.deleteMany({
      where: clinicId ? { clinicId } : undefined,
    });
  });
