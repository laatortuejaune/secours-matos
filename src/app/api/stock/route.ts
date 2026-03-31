export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stocks = await prisma.stock.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return NextResponse.json(stocks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const stock = await prisma.stock.create({
    data: {
      nom: body.nom,
      photo: body.photo || null,
      codeBarre: body.codeBarre || null,
      quantiteDisponible: body.quantiteDisponible || 0,
      datePeremption: body.datePeremption ? new Date(body.datePeremption) : null,
      seuilAlerte: body.seuilAlerte || 5,
    },
  });
  return NextResponse.json(stock);
}
