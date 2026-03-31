export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const stock = await prisma.stock.update({
    where: { id: parseInt(id) },
    data: {
      nom: body.nom,
      photo: body.photo,
      codeBarre: body.codeBarre || null,
      quantiteDisponible: body.quantiteDisponible,
      datePeremption: body.datePeremption ? new Date(body.datePeremption) : null,
      seuilAlerte: body.seuilAlerte,
    },
  });
  return NextResponse.json(stock);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.stock.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
