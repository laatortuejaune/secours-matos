export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function computeStatutVehicule(sacs: Array<{ statut: string }>, taches: Array<{ statut: string; priorite: string }>) {
  const sacsCritiques = sacs.some((s) => s.statut === "critique");
  const sacsAttention = sacs.some((s) => s.statut === "attention");
  const tachesUrgentes = taches.some((t) => t.statut === "en_cours" && t.priorite === "urgente");
  const tachesHautes = taches.some((t) => t.statut === "en_cours" && t.priorite === "haute");
  if (sacsCritiques || tachesUrgentes) return "critique";
  if (sacsAttention || tachesHautes) return "attention";
  if (sacs.length === 0) return "inconnu";
  return "ok";
}

export async function GET() {
  const vehicules = await prisma.vehicule.findMany({
    include: {
      sacs: {
        include: {
          compartiments: { include: { articles: { select: { datePeremption: true } } } },
          checkups: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
        },
      },
      taches: { where: { statut: { not: "terminee" } }, select: { statut: true, priorite: true } },
      _count: { select: { carnetEntries: true, hygiene: true } },
    },
    orderBy: { nom: "asc" },
  });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const result = vehicules.map((v) => {
    const sacsAvecStatut = v.sacs.map((sac) => {
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
      return { ...sac, statut };
    });

    return {
      id: v.id,
      nom: v.nom,
      immatriculation: v.immatriculation,
      type: v.type,
      statut: computeStatutVehicule(sacsAvecStatut, v.taches),
      statutOperationnel: v.statut,
      notes: v.notes,
      createdAt: v.createdAt,
      nbSacs: v.sacs.length,
      nbTachesOuvertes: v.taches.length,
      nbEntreesCarnet: v._count.carnetEntries,
      nbProtocoles: v._count.hygiene,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const vehicule = await prisma.vehicule.create({
    data: {
      nom: body.nom,
      immatriculation: body.immatriculation || null,
      type: body.type || "autre",
      statut: body.statut || "operationnel",
      notes: body.notes || null,
    },
  });
  return NextResponse.json(vehicule, { status: 201 });
}
