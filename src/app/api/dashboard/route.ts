export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalSacs,
    articlesPeremption,
    derniersCheckups,
  ] = await Promise.all([
    prisma.sac.count(),
    prisma.article.findMany({
      where: {
        datePeremption: { not: null, lte: in30Days },
      },
      include: { compartiment: { include: { sac: true } } },
    }),
    prisma.checkup.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { sac: true },
    }),
  ]);

  // For stocks bas, we need a raw approach since Prisma can't compare two columns directly
  const allStocks = await prisma.stock.findMany();
  const stocksBasFiltered = allStocks.filter(
    (s) => s.quantiteDisponible < s.seuilAlerte
  );

  const stocksPeremption = allStocks.filter(
    (s) => s.datePeremption && new Date(s.datePeremption) <= in30Days
  );

  return NextResponse.json({
    totalSacs,
    articlesPeremption,
    stocksBas: stocksBasFiltered,
    stocksPeremption,
    derniersCheckups,
  });
}
