export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.secret !== "secours-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statements = [
    // Phase 1 - already done
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
    // Phase 2 - véhicules, tâches, hygiène, scellés, carnet
    `CREATE TABLE IF NOT EXISTS "Vehicule" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nom" TEXT NOT NULL,
      "immatriculation" TEXT,
      "type" TEXT NOT NULL DEFAULT 'autre',
      "statut" TEXT NOT NULL DEFAULT 'operationnel',
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE "Sac" ADD COLUMN "vehiculeId" INTEGER REFERENCES "Vehicule"("id") ON DELETE SET NULL`,
    `ALTER TABLE "Checkup" ADD COLUMN "scelle" TEXT`,
    `CREATE TABLE IF NOT EXISTS "Tache" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "titre" TEXT NOT NULL,
      "description" TEXT,
      "statut" TEXT NOT NULL DEFAULT 'en_cours',
      "priorite" TEXT NOT NULL DEFAULT 'normale',
      "vehiculeId" INTEGER REFERENCES "Vehicule"("id") ON DELETE SET NULL,
      "sacId" INTEGER REFERENCES "Sac"("id") ON DELETE SET NULL,
      "assigneA" TEXT,
      "dateEcheance" DATETIME,
      "dateCree" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "ProtocoHygiene" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nom" TEXT NOT NULL,
      "description" TEXT,
      "frequenceDays" INTEGER NOT NULL DEFAULT 7,
      "vehiculeId" INTEGER REFERENCES "Vehicule"("id") ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "HygieneRecord" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "protocolId" INTEGER NOT NULL,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "agent" TEXT NOT NULL,
      "notes" TEXT,
      "conforme" INTEGER NOT NULL DEFAULT 1,
      CONSTRAINT "HygieneRecord_protocolId_fkey" FOREIGN KEY ("protocolId")
        REFERENCES "ProtocoHygiene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Scelle" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "sacId" INTEGER NOT NULL,
      "numero" TEXT NOT NULL,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "posePar" TEXT,
      "actif" INTEGER NOT NULL DEFAULT 1,
      "notes" TEXT,
      CONSTRAINT "Scelle_sacId_fkey" FOREIGN KEY ("sacId")
        REFERENCES "Sac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "CarnetBord" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "vehiculeId" INTEGER NOT NULL,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "type" TEXT NOT NULL,
      "valeur" REAL,
      "description" TEXT,
      "agent" TEXT,
      CONSTRAINT "CarnetBord_vehiculeId_fkey" FOREIGN KEY ("vehiculeId")
        REFERENCES "Vehicule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
