export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await request.json();
  const tache = await prisma.tache.update({
    where: { id },
    data: {
      titre: body.titre,
      description: body.description ?? null,
      statut: body.statut,
      priorite: body.priorite,
      vehiculeId: body.vehiculeId ? parseInt(body.vehiculeId) : null,
      sacId: body.sacId ? parseInt(body.sacId) : null,
      assigneA: body.assigneA ?? null,
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
    },
  });
  return NextResponse.json(tache);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.tache.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
