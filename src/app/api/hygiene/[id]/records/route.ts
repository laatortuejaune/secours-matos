export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const protocolId = parseInt(params.id);
  const records = await prisma.hygieneRecord.findMany({
    where: { protocolId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const protocolId = parseInt(params.id);
  const body = await request.json();
  const record = await prisma.hygieneRecord.create({
    data: {
      protocolId,
      agent: body.agent,
      notes: body.notes || null,
      conforme: body.conforme !== false,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return NextResponse.json(record, { status: 201 });
}
