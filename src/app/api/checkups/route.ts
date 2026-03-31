import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checkups = await prisma.checkup.findMany({
    include: {
      sac: true,
      checkupArticles: { include: { article: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(checkups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sacId, note, articles } = body as {
    sacId: number;
    note?: string;
    articles: { articleId: number; quantiteTrouvee: number }[];
  };

  // Get all articles with their stock info
  const articleIds = articles.map((a) => a.articleId);
  const dbArticles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    include: { stock: true },
  });

  const articleMap = new Map(dbArticles.map((a) => [a.id, a]));
  const prelevements: { stockId: number; stockNom: string; quantite: number; disponible: number }[] = [];

  // Create checkup
  const checkup = await prisma.checkup.create({
    data: {
      sacId,
      note: note || null,
      checkupArticles: {
        create: articles.map((a) => {
          const dbArticle = articleMap.get(a.articleId);
          const quantiteManquante = Math.max(
            0,
            (dbArticle?.quantiteRequise || 0) - a.quantiteTrouvee
          );
          return {
            articleId: a.articleId,
            quantiteTrouvee: a.quantiteTrouvee,
            quantiteManquante,
            quantitePrelevee: 0, // will be updated below
          };
        }),
      },
    },
    include: { checkupArticles: true },
  });

  // Debit stock for missing items
  for (const ca of checkup.checkupArticles) {
    const dbArticle = articleMap.get(ca.articleId);
    if (ca.quantiteManquante > 0 && dbArticle?.stockId && dbArticle.stock) {
      const toDebit = Math.min(ca.quantiteManquante, dbArticle.stock.quantiteDisponible);
      if (toDebit > 0) {
        await prisma.stock.update({
          where: { id: dbArticle.stockId },
          data: { quantiteDisponible: { decrement: toDebit } },
        });
        await prisma.checkupArticle.update({
          where: { id: ca.id },
          data: { quantitePrelevee: toDebit },
        });
        prelevements.push({
          stockId: dbArticle.stockId,
          stockNom: dbArticle.stock.nom,
          quantite: toDebit,
          disponible: dbArticle.stock.quantiteDisponible - toDebit,
        });
      }
    }
  }

  // Refetch the complete checkup
  const result = await prisma.checkup.findUnique({
    where: { id: checkup.id },
    include: {
      sac: true,
      checkupArticles: { include: { article: { include: { stock: true } } } },
    },
  });

  return NextResponse.json({ checkup: result, prelevements });
}
