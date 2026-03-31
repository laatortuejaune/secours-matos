export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const compartiment = await prisma.compartiment.create({
    data: {
      nom: body.nom,
      photo: body.photo || null,
      ordre: body.ordre || 0,
      sacId: body.sacId,
    },
  });
  return NextResponse.json(compartiment);
}
