
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: "admin", description: "System Administrator" },
    { name: "lawyer", description: "Verified Legal Professional" },
    { name: "member", description: "Default member role" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { 
        name: role.name, 
        description: role.description, 
        isSystem: true 
      },
    });
  }

  console.log("✓ Roles (admin, lawyer, member) seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());