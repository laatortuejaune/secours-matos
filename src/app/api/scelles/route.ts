export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sacId = searchParams.get("sacId");
  const scelles = await prisma.scelle.findMany({
    where: sacId ? { sacId: parseInt(sacId) } : {},
    include: { sac: { select: { id: true, nom: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(scelles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Désactiver l'ancien scellé actif pour ce sac
  await prisma.scelle.updateMany({
    where: { sacId: parseInt(body.sacId), actif: true },
    data: { actif: false },
  });
  const scelle = await prisma.scelle.create({
    data: {
      sacId: parseInt(body.sacId),
      numero: body.numero,
      posePar: body.posePar || null,
      notes: body.notes || null,
      actif: true,
    },
  });
  return NextResponse.json(scelle, { status: 201 });
}
