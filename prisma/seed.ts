import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean
  await prisma.checkupArticle.deleteMany();
  await prisma.checkup.deleteMany();
  await prisma.article.deleteMany();
  await prisma.compartiment.deleteMany();
  await prisma.sac.deleteMany();
  await prisma.stock.deleteMany();

  // Stock central
  const compresses = await prisma.stock.create({
    data: {
      nom: "Compresses stériles 10x10",
      quantiteDisponible: 50,
      seuilAlerte: 10,
      datePeremption: new Date("2026-12-31"),
    },
  });

  const bandes = await prisma.stock.create({
    data: {
      nom: "Bandes de crêpe 10cm",
      quantiteDisponible: 30,
      seuilAlerte: 5,
    },
  });

  const gants = await prisma.stock.create({
    data: {
      nom: "Gants nitrile (paire)",
      quantiteDisponible: 3,
      seuilAlerte: 10,
      datePeremption: new Date("2026-06-15"),
    },
  });

  const couvertures = await prisma.stock.create({
    data: {
      nom: "Couverture de survie",
      quantiteDisponible: 15,
      seuilAlerte: 5,
    },
  });

  const ciseaux = await prisma.stock.create({
    data: {
      nom: "Ciseaux Jesco",
      quantiteDisponible: 8,
      seuilAlerte: 2,
    },
  });

  // Sac PSE 1
  const sac1 = await prisma.sac.create({
    data: {
      nom: "Sac PSE 1",
    },
  });

  const pocheAvant = await prisma.compartiment.create({
    data: {
      nom: "Poche avant",
      sacId: sac1.id,
      ordre: 1,
    },
  });

  const compPrincipal = await prisma.compartiment.create({
    data: {
      nom: "Compartiment principal",
      sacId: sac1.id,
      ordre: 2,
    },
  });

  await prisma.article.createMany({
    data: [
      {
        nom: "Compresses stériles 10x10",
        quantiteRequise: 10,
        compartimentId: pocheAvant.id,
        stockId: compresses.id,
        datePeremption: new Date("2026-08-15"),
      },
      {
        nom: "Gants nitrile",
        quantiteRequise: 4,
        compartimentId: pocheAvant.id,
        stockId: gants.id,
      },
      {
        nom: "Ciseaux Jesco",
        quantiteRequise: 1,
        compartimentId: pocheAvant.id,
        stockId: ciseaux.id,
      },
    ],
  });

  await prisma.article.createMany({
    data: [
      {
        nom: "Bandes de crêpe 10cm",
        quantiteRequise: 5,
        compartimentId: compPrincipal.id,
        stockId: bandes.id,
      },
      {
        nom: "Couverture de survie",
        quantiteRequise: 2,
        compartimentId: compPrincipal.id,
        stockId: couvertures.id,
      },
      {
        nom: "Sucres en morceaux",
        quantiteRequise: 6,
        compartimentId: compPrincipal.id,
        datePeremption: new Date("2026-04-10"),
      },
    ],
  });

  console.log("Seed terminé !");
  console.log("- 5 produits en stock (dont 1 en alerte stock bas : Gants nitrile)");
  console.log("- 1 sac (PSE 1) avec 2 compartiments et 6 articles");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
