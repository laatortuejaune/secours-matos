export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const compartiment = await prisma.compartiment.findUnique({
    where: { id: parseInt(id) },
    include: {
      sac: true,
      articles: { include: { stock: true } },
    },
  });
  if (!compartiment) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(compartiment);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const compartiment = await prisma.compartiment.update({
    where: { id: parseInt(id) },
    data: { nom: body.nom, photo: body.photo, ordre: body.ordre },
  });
  return NextResponse.json(compartiment);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.compartiment.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
