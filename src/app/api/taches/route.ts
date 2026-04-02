export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const taches = await prisma.tache.findMany({
    include: {
      vehicule: { select: { id: true, nom: true } },
      sac: { select: { id: true, nom: true } },
    },
    orderBy: [{ statut: "asc" }, { priorite: "desc" }, { dateCree: "desc" }],
  });
  return NextResponse.json(taches);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tache = await prisma.tache.create({
    data: {
      titre: body.titre,
      description: body.description || null,
      statut: body.statut || "en_cours",
      priorite: body.priorite || "normale",
      vehiculeId: body.vehiculeId ? parseInt(body.vehiculeId) : null,
      sacId: body.sacId ? parseInt(body.sacId) : null,
      assigneA: body.assigneA || null,
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
    },
    include: {
      vehicule: { select: { id: true, nom: true } },
      sac: { select: { id: true, nom: true } },
    },
  });
  return NextResponse.json(tache, { status: 201 });
}
