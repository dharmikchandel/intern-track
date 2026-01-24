import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: "demo@interntrack.dev",
      passwordHash: "hashed_password_here"
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
