import { PrismaClient } from "@prisma/client";
import bcrypt           from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL        = "abeehahussain572@gmail.com"; 
const ADMIN_PASSWORD     = "Admin@12";         
const ADMIN_DISPLAY_NAME = "Admin";

async function seedRoles() {
  const roles = [
    { name: "admin",  description: "System Administrator"       },
    { name: "lawyer", description: "Verified Legal Professional" },
    { name: "member", description: "Default member role"         },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where:  { name: role.name },
      update: {},
      create: { name: role.name, description: role.description, isSystem: true },
    });
  }

  console.log("✓ Roles seeded (admin, lawyer, member)");
}

async function seedAdminAccount() {
  const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();

  // Check if email already exists
  const existing = await prisma.userIdentifier.findUnique({
    where: { type_value: { type: "EMAIL", value: normalizedEmail } },
    select: { userId: true },
  });

  if (existing) {
    console.log(`⚠  Account already exists for ${normalizedEmail} — skipping.`);
    console.log(`   If this was a Google account, delete it first then re-run.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (!adminRole) throw new Error("Role 'admin' not found — seedRoles() must run first.");

  await prisma.$transaction(async (tx) => {
    // INSERT User
    const user = await tx.user.create({
      data: {
        userType:    "EXTERNAL",
        status:      "ACTIVE",
        displayName: ADMIN_DISPLAY_NAME,
      },
    });

    // INSERT UserIdentifier (EMAIL, pre-verified)
    await tx.userIdentifier.create({
      data: {
        userId:     user.id,
        type:       "EMAIL",
        value:      normalizedEmail,
        isPrimary:  true,
        verifiedAt: new Date(),
      },
    });

    // INSERT Credential (bcrypt)
    await tx.credential.create({
      data: {
        userId:        user.id,
        passwordHash,
        passwordAlgo:  "bcrypt",
        passwordSetAt: new Date(),
        mustRotate:    false,
      },
    });

    // INSERT UserRole (admin)
    await tx.userRole.create({
      data: {
        userId:     user.id,
        roleId:     adminRole.id,
        assignedBy: null,
      },
    });

    // INSERT AuditLog USER_CREATED
    await tx.auditLog.create({
      data: {
        action:       "USER_CREATED",
        actorId:      null,
        targetUserId: user.id,
        meta: {
          registrationMethod: "seed",
          email:              normalizedEmail,
          role:               "admin",
        },
      },
    });

    // INSERT AuditLog ROLE_ASSIGNED
    await tx.auditLog.create({
      data: {
        action:       "ROLE_ASSIGNED",
        actorId:      null,
        targetUserId: user.id,
        meta: { role: "admin", assignedBy: "seed" },
      },
    });

    console.log(`✓ Admin account created`);
    console.log(`  email:  ${normalizedEmail}`);
    console.log(`  userId: ${user.id}`);
  });
}

async function main() {
  console.log("\n── Seeding database ──────────────────────────\n");
  await seedRoles();
  await seedAdminAccount();
  console.log("\n── Done ───────────────────────────────────────");
  console.log("  Log in at /adminlogin with your seed credentials\n");
}

main()
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
