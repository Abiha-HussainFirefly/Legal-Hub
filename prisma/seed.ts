import { PrismaClient } from "@prisma/client";
import {
  LAWYER_PERMISSION_KEYS,
  PERMISSION_CATALOG,
  ROLE_CATALOG,
  ROLE_PERMISSION_ASSIGNMENTS,
} from "../lib/auth/permission-catalog";

const prisma = new PrismaClient();

type SystemRoleSeed = {
  name: string;
  description: string;
  isSystem: boolean;
};

const COMPATIBILITY_ROLE_CATALOG: readonly SystemRoleSeed[] = [
  { name: "super_admin", description: "Technical compatibility alias for SuperAdmin.", isSystem: true },
  { name: "superadmin", description: "Technical compatibility alias for SuperAdmin.", isSystem: true },
  { name: "lawyer_user", description: "Technical compatibility alias for LawyerUser.", isSystem: true },
  { name: "lawyeruser", description: "Technical compatibility alias for LawyerUser.", isSystem: true },
];

const SYSTEM_ROLE_CATALOG: readonly SystemRoleSeed[] = [...ROLE_CATALOG, ...COMPATIBILITY_ROLE_CATALOG];

const ADMIN_COMPATIBILITY_ROLE_NAMES = ["SuperAdmin", "admin", "super_admin", "superadmin"] as const;
const LAWYER_COMPATIBILITY_ROLE_NAMES = ["LawyerUser", "lawyer", "lawyer_user", "lawyeruser"] as const;

const ROLE_PERMISSION_SEED_ASSIGNMENTS: Record<string, readonly string[]> = {
  ...ROLE_PERMISSION_ASSIGNMENTS,
  super_admin: PERMISSION_CATALOG.map((permission) => permission.key),
  superadmin: PERMISSION_CATALOG.map((permission) => permission.key),
  lawyer_user: [...LAWYER_PERMISSION_KEYS],
  lawyeruser: [...LAWYER_PERMISSION_KEYS],
};

async function upsertSystemRoles() {
  const roles = new Map<string, { id: string; name: string }>();

  for (const role of SYSTEM_ROLE_CATALOG) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isActive: true,
        isSystem: role.isSystem,
      },
      create: {
        name: role.name,
        description: role.description,
        isActive: true,
        isSystem: role.isSystem,
      },
      select: {
        id: true,
        name: true,
      },
    });

    roles.set(record.name, record);
  }

  return roles;
}

async function upsertPermissions() {
  const permissionIds = new Map<string, string>();

  for (const permission of PERMISSION_CATALOG) {
    const record = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description,
        isActive: true,
      },
      create: {
        key: permission.key,
        description: permission.description,
        isActive: true,
      },
      select: {
        id: true,
        key: true,
      },
    });

    permissionIds.set(record.key, record.id);
  }

  return permissionIds;
}

async function bindRolePermissions(
  roles: Map<string, { id: string; name: string }>,
  permissionIds: Map<string, string>,
) {
  let bindingCount = 0;

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSION_SEED_ASSIGNMENTS)) {
    const role = roles.get(roleName);
    if (!role) {
      console.warn(`  [warn] Role "${roleName}" is missing; skipping bindings.`);
      continue;
    }

    for (const permissionKey of permissionKeys) {
      const permissionId = permissionIds.get(permissionKey);

      if (!permissionId) {
        console.warn(`  [warn] Permission "${permissionKey}" is missing; skipping binding.`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          roleId: role.id,
          permissionId,
          isActive: true,
        },
      });

      bindingCount += 1;
    }
  }

  return bindingCount;
}

async function printSeedSummary(roles: Map<string, { id: string; name: string }>) {
  const isRoleRecord = (role: { id: string; name: string } | undefined): role is { id: string; name: string } =>
    Boolean(role);
  const adminRoles = ADMIN_COMPATIBILITY_ROLE_NAMES.map((roleName) => roles.get(roleName)).filter(isRoleRecord);
  const lawyerRoles = LAWYER_COMPATIBILITY_ROLE_NAMES.map((roleName) => roles.get(roleName)).filter(isRoleRecord);

  console.log("Roles ready:");
  for (const role of [...adminRoles, ...lawyerRoles]) {
    console.log(`  - ${role.name} (${role.id})`);
  }
}

async function main() {
  console.log("Seeding roles, permissions, and bindings...");

  const roles = await upsertSystemRoles();
  await printSeedSummary(roles);

  const permissionIds = await upsertPermissions();
  console.log(`Permissions ready: ${permissionIds.size}`);

  const bindingCount = await bindRolePermissions(roles, permissionIds);
  console.log(`Role permissions active: ${bindingCount}`);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
