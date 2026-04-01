export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.secret !== "secours-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statements = [
    `ALTER TABLE "Sac" ADD COLUMN "localisation" TEXT`,
    `ALTER TABLE "Sac" ADD COLUMN "description" TEXT`,
    `ALTER TABLE "CheckupArticle" ADD COLUMN "statut" TEXT NOT NULL DEFAULT 'ok'`,
    `ALTER TABLE "CheckupArticle" ADD COLUMN "notes" TEXT`,
    `CREATE TABLE IF NOT EXISTS "Intervention" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lieu" TEXT NOT NULL,
      "description" TEXT,
      "responsable" TEXT,
      "sacId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Intervention_sacId_fkey" FOREIGN KEY ("sacId")
        REFERENCES "Sac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
  ];

  const results: string[] = [];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      results.push(`OK: ${stmt.substring(0, 60)}`);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || String(e);
      if (
        msg.includes("duplicate column") ||
        msg.includes("already exists") ||
        msg.includes("UNIQUE constraint")
      ) {
        results.push(`SKIP (already exists): ${stmt.substring(0, 60)}`);
      } else {
        results.push(`ERROR: ${msg}`);
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
