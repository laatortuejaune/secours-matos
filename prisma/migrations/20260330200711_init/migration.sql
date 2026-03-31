-- CreateTable
CREATE TABLE "Sac" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "photo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Compartiment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "photo" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "sacId" INTEGER NOT NULL,
    CONSTRAINT "Compartiment_sacId_fkey" FOREIGN KEY ("sacId") REFERENCES "Sac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "photo" TEXT,
    "codeBarre" TEXT,
    "quantiteRequise" INTEGER NOT NULL DEFAULT 1,
    "datePeremption" DATETIME,
    "compartimentId" INTEGER NOT NULL,
    "stockId" INTEGER,
    CONSTRAINT "Article_compartimentId_fkey" FOREIGN KEY ("compartimentId") REFERENCES "Compartiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Article_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "photo" TEXT,
    "codeBarre" TEXT,
    "quantiteDisponible" INTEGER NOT NULL DEFAULT 0,
    "datePeremption" DATETIME,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 5
);

-- CreateTable
CREATE TABLE "Checkup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sacId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "Checkup_sacId_fkey" FOREIGN KEY ("sacId") REFERENCES "Sac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckupArticle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checkupId" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,
    "quantiteTrouvee" INTEGER NOT NULL DEFAULT 0,
    "quantiteManquante" INTEGER NOT NULL DEFAULT 0,
    "quantitePrelevee" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CheckupArticle_checkupId_fkey" FOREIGN KEY ("checkupId") REFERENCES "Checkup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckupArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
