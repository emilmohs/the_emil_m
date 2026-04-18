import prisma from '../src/lib/prisma';


async function main() {
  const classes = ["3a", "3b", "4a", "4b", "DAZ"];
  for (const id of classes) {
    await prisma.schoolClass.upsert({
      where: { id },
      update: {},
      create: { id },
    });
  }
  console.log("Klassen initialisiert:", classes);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
