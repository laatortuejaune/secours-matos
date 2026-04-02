export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.protocoHygiene.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
