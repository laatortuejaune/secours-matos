import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const article = await prisma.article.create({
    data: {
      nom: body.nom,
      photo: body.photo || null,
      codeBarre: body.codeBarre || null,
      quantiteRequise: body.quantiteRequise || 1,
      datePeremption: body.datePeremption ? new Date(body.datePeremption) : null,
      compartimentId: body.compartimentId,
      stockId: body.stockId || null,
    },
  });
  return NextResponse.json(article);
}
