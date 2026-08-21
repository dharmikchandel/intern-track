import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("Demo1234!");

  await prisma.user.upsert({
    where: { email: "demo@interntrack.dev" },
    update: {},
    create: {
      email: "demo@interntrack.dev",
      passwordHash,
    },
  });

  console.log("Seeded demo user: demo@interntrack.dev / Demo1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
