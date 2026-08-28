import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../prisma";

export const getPatientsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const patients = await prisma.patient.findMany({
      orderBy: { arrivedAt: "asc" },
    });
    return patients;
  }
);

export const createPatientFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string(),
      age: z.number(),
      document: z.string(),
      symptoms: z.string(),
      painLevel: z.number(),
      hasFever: z.boolean(),
      hasBreathingIssue: z.boolean(),
      hasChestPain: z.boolean(),
      priority: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Pegar o número do último ticket
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { arrivedAt: "desc" },
    });
    
    let nextNum = 1;
    if (lastPatient && lastPatient.ticket.startsWith("T")) {
      const numPart = parseInt(lastPatient.ticket.substring(1), 10);
      if (!isNaN(numPart)) nextNum = numPart + 1;
    }
    const ticket = `T${String(nextNum).padStart(3, "0")}`;

    const newPatient = await prisma.patient.create({
      data: {
        ...data,
        ticket,
        status: "waiting",
      },
    });

    return newPatient;
  });

export const updatePatientStatusFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      status: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const updateData: any = { status: data.status };
    if (data.status === "in_service") updateData.calledAt = new Date();
    if (data.status === "done") updateData.finishedAt = new Date();

    return await prisma.patient.update({
      where: { id: data.id },
      data: updateData,
    });
  });

export const removePatientFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return await prisma.patient.delete({
      where: { id: data.id },
    });
  });

export const clearAllFn = createServerFn({ method: "POST" }).handler(
  async () => {
    return await prisma.patient.deleteMany();
  }
);
