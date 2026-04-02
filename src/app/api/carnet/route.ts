export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehiculeId = searchParams.get("vehiculeId");
  const entries = await prisma.carnetBord.findMany({
    where: vehiculeId ? { vehiculeId: parseInt(vehiculeId) } : {},
    include: { vehicule: { select: { id: true, nom: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entry = await prisma.carnetBord.create({
    data: {
      vehiculeId: parseInt(body.vehiculeId),
      type: body.type,
      valeur: body.valeur ? parseFloat(body.valeur) : null,
      description: body.description || null,
      agent: body.agent || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
