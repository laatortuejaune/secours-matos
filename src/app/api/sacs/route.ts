export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function computeStatut(sac: {
  compartiments: Array<{ articles: Array<{ datePeremption: Date | null }> }>;
  checkups: Array<{ date: Date }>;
}) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const articles = sac.compartiments.flatMap((c) => c.articles);
  const lastCheckup = sac.checkups[0];

  if (articles.length === 0) return "inconnu";

  const hasExpired = articles.some(
    (a) => a.datePeremption && new Date(a.datePeremption) < now
  );
  if (hasExpired) return "critique";

  const daysSinceCheckup = lastCheckup
    ? (now.getTime() - new Date(lastCheckup.date).getTime()) / (1000 * 60 * 60 * 24)
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
  const sacs = await prisma.sac.findMany({
    include: {
      _count: { select: { compartiments: true, checkups: true } },
      compartiments: { include: { articles: { select: { datePeremption: true } } } },
      checkups: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
      vehicule: { select: { id: true, nom: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sacsWithStatut = sacs.map((sac) => ({
    ...sac,
    statut: computeStatut(sac),
    dernierCheckup: sac.checkups[0]?.date ?? null,
  }));

  return NextResponse.json(sacsWithStatut);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const sac = await prisma.sac.create({
    data: {
      nom: body.nom,
      photo: body.photo || null,
      localisation: body.localisation || null,
      description: body.description || null,
      vehiculeId: body.vehiculeId ? parseInt(body.vehiculeId) : null,
    },
  });
  return NextResponse.json(sac);
}
