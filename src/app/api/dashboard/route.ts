export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function computeStatut(
  articles: Array<{ datePeremption: Date | null }>,
  lastCheckup: Date | null
) {
  if (articles.length === 0) return "inconnu";
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (articles.some((a) => a.datePeremption && new Date(a.datePeremption) < now)) return "critique";
  const daysSince = lastCheckup
    ? (now.getTime() - new Date(lastCheckup).getTime()) / 86400000
    : null;
  if (daysSince !== null && daysSince > 30) return "critique";
  if (articles.some((a) => a.datePeremption && new Date(a.datePeremption) <= in30Days) || daysSince === null || daysSince > 15)
    return "attention";
  return "ok";
}

export async function GET() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [sacs, articlesPeremption, derniersCheckups, dernieresInterventions, allStocks, vehicules, tachesOuvertes, hygieneEnRetard] =
    await Promise.all([
      prisma.sac.findMany({
        include: {
          vehicule: { select: { id: true, nom: true } },
          compartiments: { include: { articles: { select: { datePeremption: true } } } },
          checkups: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          scelles: { where: { actif: true }, take: 1, orderBy: { date: "desc" } },
        },
      }),
      prisma.article.findMany({
        where: { datePeremption: { not: null, lte: in30Days } },
        include: { compartiment: { include: { sac: true } } },
        orderBy: { datePeremption: "asc" },
      }),
      prisma.checkup.findMany({
        take: 5, orderBy: { date: "desc" },
        include: { sac: { select: { nom: true } } },
      }),
      prisma.intervention.findMany({
        take: 5, orderBy: { date: "desc" },
        include: { sac: { select: { nom: true } } },
      }),
      prisma.stock.findMany(),
      prisma.vehicule.findMany({
        include: {
          sacs: {
            include: {
              compartiments: { include: { articles: { select: { datePeremption: true } } } },
              checkups: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
            },
          },
          taches: { where: { statut: { not: "terminee" } } },
        },
        orderBy: { nom: "asc" },
      }),
      prisma.tache.findMany({ where: { statut: "en_cours" }, include: { vehicule: { select: { nom: true } }, sac: { select: { nom: true } } }, orderBy: { priorite: "desc" }, take: 10 }),
      prisma.protocoHygiene.findMany({ include: { records: { orderBy: { date: "desc" }, take: 1 } } }),
    ]);

  const stocksBas = allStocks.filter((s) => s.quantiteDisponible < s.seuilAlerte);
  const stocksPeremption = allStocks.filter((s) => s.datePeremption && new Date(s.datePeremption) <= in30Days);

  const sacsAvecStatut = sacs.map((sac) => {
    const articles = sac.compartiments.flatMap((c) => c.articles);
    const lastCheckup = sac.checkups[0]?.date ?? null;
    return {
      id: sac.id,
      nom: sac.nom,
      localisation: sac.localisation,
      vehicule: sac.vehicule,
      statut: computeStatut(articles, lastCheckup),
      dernierCheckup: lastCheckup,
      scelle: sac.scelles[0] ?? null,
    };
  });

  // Véhicules avec statut LED
  const vehiculesAvecStatut = vehicules.map((v) => {
    const sacsStatuts = v.sacs.map((sac) => {
      const articles = sac.compartiments.flatMap((c) => c.articles);
      const lastCheckup = sac.checkups[0]?.date ?? null;
      return computeStatut(articles, lastCheckup);
    });
    let statut = "inconnu";
    if (sacsStatuts.some((s) => s === "critique") || v.taches.some((t) => t.priorite === "urgente")) statut = "critique";
    else if (sacsStatuts.some((s) => s === "attention") || v.taches.some((t) => t.priorite === "haute")) statut = "attention";
    else if (sacsStatuts.length > 0) statut = "ok";
    return { id: v.id, nom: v.nom, immatriculation: v.immatriculation, type: v.type, statut, nbSacs: v.sacs.length, nbTaches: v.taches.length };
  });

  // Hygiène en retard
  const hygieneRetard = hygieneEnRetard.filter((p) => {
    const dernier = p.records[0];
    const jours = dernier ? Math.floor((now.getTime() - new Date(dernier.date).getTime()) / 86400000) : null;
    return jours === null || jours >= p.frequenceDays;
  });

  const sacsCritiques = sacsAvecStatut.filter((s) => s.statut === "critique").length;
  const sacsAttention = sacsAvecStatut.filter((s) => s.statut === "attention").length;

  return NextResponse.json({
    totalSacs: sacs.length,
    sacsCritiques,
    sacsAttention,
    sacsAvecStatut,
    articlesPeremption,
    stocksBas,
    stocksPeremption,
    derniersCheckups,
    dernieresInterventions,
    vehiculesAvecStatut,
    tachesOuvertes,
    nbHygieneRetard: hygieneRetard.length,
  });
}
