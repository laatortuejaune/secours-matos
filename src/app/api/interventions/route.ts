export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const interventions = await prisma.intervention.findMany({
    include: { sac: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(interventions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const intervention = await prisma.intervention.create({
    data: {
      lieu: body.lieu,
      description: body.description || null,
      responsable: body.responsable || null,
      sacId: body.sacId,
      date: body.date ? new Date(body.date) : new Date(),
    },
    include: { sac: true },
  });
  return NextResponse.json(intervention);
}
