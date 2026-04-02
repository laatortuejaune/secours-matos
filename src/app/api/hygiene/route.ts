export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const protocoles = await prisma.protocoHygiene.findMany({
    include: {
      vehicule: { select: { id: true, nom: true } },
      records: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { nom: "asc" },
  });

  const now = new Date();
  const result = protocoles.map((p) => {
    const dernier = p.records[0];
    const joursDepuis = dernier
      ? Math.floor((now.getTime() - new Date(dernier.date).getTime()) / 86400000)
      : null;
    const enRetard = joursDepuis === null || joursDepuis >= p.frequenceDays;
    return { ...p, dernierRecord: dernier ?? null, joursDepuis, enRetard };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const protocole = await prisma.protocoHygiene.create({
    data: {
      nom: body.nom,
      description: body.description || null,
      frequenceDays: parseInt(body.frequenceDays) || 7,
      vehiculeId: body.vehiculeId ? parseInt(body.vehiculeId) : null,
    },
    include: { vehicule: { select: { id: true, nom: true } } },
  });
  return NextResponse.json(protocole, { status: 201 });
}
