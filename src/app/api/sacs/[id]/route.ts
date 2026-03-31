export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sac = await prisma.sac.findUnique({
    where: { id: parseInt(id) },
    include: {
      compartiments: {
        orderBy: { ordre: "asc" },
        include: { _count: { select: { articles: true } } },
      },
    },
  });
  if (!sac) return NextResponse.json({ error: "Sac non trouvé" }, { status: 404 });
  return NextResponse.json(sac);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const sac = await prisma.sac.update({
    where: { id: parseInt(id) },
    data: { nom: body.nom, photo: body.photo },
  });
  return NextResponse.json(sac);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.sac.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
