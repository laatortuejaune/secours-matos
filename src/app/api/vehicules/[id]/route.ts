export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const vehicule = await prisma.vehicule.findUnique({
    where: { id },
    include: {
      sacs: {
        include: {
          compartiments: { include: { articles: { select: { datePeremption: true } } } },
          checkups: { orderBy: { date: "desc" }, take: 1 },
          scelles: { where: { actif: true }, take: 1, orderBy: { date: "desc" } },
        },
      },
      taches: { orderBy: { dateCree: "desc" } },
      hygiene: { include: { records: { orderBy: { date: "desc" }, take: 1 } } },
      carnetEntries: { orderBy: { date: "desc" }, take: 20 },
    },
  });
  if (!vehicule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sacsAvecStatut = vehicule.sacs.map((sac) => {
    const articles = sac.compartiments.flatMap((c) => c.articles);
    const lastCheckup = sac.checkups[0]?.date ?? null;
    const hasExpired = articles.some((a) => a.datePeremption && new Date(a.datePeremption) < now);
    const daysSince = lastCheckup ? (now.getTime() - new Date(lastCheckup).getTime()) / 86400000 : null;
    let statut = "inconnu";
    if (articles.length > 0) {
      if (hasExpired || (daysSince !== null && daysSince > 30)) statut = "critique";
      else if (articles.some((a) => a.datePeremption && new Date(a.datePeremption) <= in30Days) || daysSince === null || daysSince > 15) statut = "attention";
      else statut = "ok";
    }
    return {
      id: sac.id,
      nom: sac.nom,
      localisation: sac.localisation,
      statut,
      dernierCheckup: lastCheckup,
      scelle: sac.scelles[0] ?? null,
    };
  });

  return NextResponse.json({ ...vehicule, sacsAvecStatut });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await request.json();
  const vehicule = await prisma.vehicule.update({
    where: { id },
    data: {
      nom: body.nom,
      immatriculation: body.immatriculation ?? null,
      type: body.type,
      statut: body.statut,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(vehicule);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.vehicule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
