export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const checkup = await prisma.checkup.findUnique({
    where: { id: parseInt(id) },
    include: {
      sac: true,
      checkupArticles: {
        include: { article: { include: { stock: true, compartiment: true } } },
      },
    },
  });
  if (!checkup) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(checkup);
}
