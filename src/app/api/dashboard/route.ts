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

  const hasExpired = articles.some(
    (a) => a.datePeremption && new Date(a.datePeremption) < now
  );
  if (hasExpired) return "critique";

  const daysSinceCheckup = lastCheckup
    ? (now.getTime() - new Date(lastCheckup).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  if (daysSinceCheckup !== null && daysSinceCheckup > 30) return "critique";

  const hasSoonExpiring = articles.some(
    (a) => a.datePeremption && new Date(a.datePeremption) <= in30Days
  );
  if (hasSoonExpiring || daysSinceCheckup === null || daysSinceCheckup > 15)
    return "attention";

  return "ok";
}

export async function GET() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [sacs, articlesPeremption, derniersCheckups, dernieresInterventions] =
    await Promise.all([
      prisma.sac.findMany({
        include: {
          compartiments: { include: { articles: { select: { datePeremption: true } } } },
          checkups: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
        },
      }),
      prisma.article.findMany({
        where: { datePeremption: { not: null, lte: in30Days } },
        include: { compartiment: { include: { sac: true } } },
      }),
      prisma.checkup.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { sac: true },
      }),
      prisma.intervention.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { sac: true },
      }),
    ]);

  const allStocks = await prisma.stock.findMany();
  const stocksBas = allStocks.filter((s) => s.quantiteDisponible < s.seuilAlerte);
  const stocksPeremption = allStocks.filter(
    (s) => s.datePeremption && new Date(s.datePeremption) <= in30Days
  );

  const sacsAvecStatut = sacs.map((sac) => {
    const articles = sac.compartiments.flatMap((c) => c.articles);
    const lastCheckup = sac.checkups[0]?.date ?? null;
    return {
      id: sac.id,
      nom: sac.nom,
      localisation: sac.localisation,
      statut: computeStatut(articles, lastCheckup),
      dernierCheckup: lastCheckup,
    };
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
  });
}
