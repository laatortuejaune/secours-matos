import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sacs = await prisma.sac.findMany({
    include: { _count: { select: { compartiments: true, checkups: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sacs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const sac = await prisma.sac.create({
    data: { nom: body.nom, photo: body.photo || null },
  });
  return NextResponse.json(sac);
}
