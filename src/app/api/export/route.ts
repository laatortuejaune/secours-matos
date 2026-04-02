export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "checkups";

  if (type === "checkups") {
    const checkups = await prisma.checkup.findMany({
      include: {
        sac: true,
        checkupArticles: {
          include: { article: { include: { compartiment: true } } },
        },
      },
      orderBy: { date: "desc" },
    });

    const rows: string[] = [
      "Date;Sac;Article;Compartiment;Quantite requise;Quantite trouvee;Manquant;Statut;Notes;Scelle",
    ];
    for (const c of checkups) {
      for (const ca of c.checkupArticles) {
        rows.push(
          [
            new Date(c.date).toLocaleDateString("fr-FR"),
            c.sac.nom,
            ca.article.nom,
            ca.article.compartiment.nom,
            ca.article.quantiteRequise,
            ca.quantiteTrouvee,
            ca.quantiteManquante,
            ca.statut,
            ca.notes || "",
            c.scelle || "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(";")
        );
      }
    }
    const csv = rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="checkups_${Date.now()}.csv"`,
      },
    });
  }

  if (type === "stock") {
    const stocks = await prisma.stock.findMany({ orderBy: { nom: "asc" } });
    const rows = [
      "Nom;Quantite;Seuil alerte;Date peremption;Code barre",
      ...stocks.map((s) =>
        [
          s.nom,
          s.quantiteDisponible,
          s.seuilAlerte,
          s.datePeremption ? new Date(s.datePeremption).toLocaleDateString("fr-FR") : "",
          s.codeBarre || "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";")
      ),
    ];
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stock_${Date.now()}.csv"`,
      },
    });
  }

  if (type === "peremptions") {
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const articles = await prisma.article.findMany({
      where: { datePeremption: { not: null, lte: in90Days } },
      include: { compartiment: { include: { sac: true } } },
      orderBy: { datePeremption: "asc" },
    });
    const rows = [
      "Sac;Compartiment;Article;Date peremption;Jours restants",
      ...articles.map((a) => {
        const jours = a.datePeremption
          ? Math.ceil((new Date(a.datePeremption).getTime() - now.getTime()) / 86400000)
          : "";
        return [
          a.compartiment.sac.nom,
          a.compartiment.nom,
          a.nom,
          a.datePeremption ? new Date(a.datePeremption).toLocaleDateString("fr-FR") : "",
          jours,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";");
      }),
    ];
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="peremptions_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "type invalide" }, { status: 400 });
}
