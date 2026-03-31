export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const article = await prisma.article.update({
    where: { id: parseInt(id) },
    data: {
      nom: body.nom,
      photo: body.photo,
      codeBarre: body.codeBarre || null,
      quantiteRequise: body.quantiteRequise,
      datePeremption: body.datePeremption ? new Date(body.datePeremption) : null,
      stockId: body.stockId || null,
    },
  });
  return NextResponse.json(article);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.article.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
