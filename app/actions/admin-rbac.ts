"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission, normalizeRoleName } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { AuditCategory, ContentTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

const PROTECTED_PERMISSION_KEYS = new Set<string>(Object.values(ADMIN_PERMISSION_KEYS));

export type RbacActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePermissionKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function getAuditReason(reason: string, fallback: string) {
  return reason || fallback;
}

async function requireAdminActor(permissionKey: string) {
  const session = await auth();
  const actorId = session?.user?.id ?? null;
  const actorRoles = ((session?.user as { roles?: string[] } | undefined)?.roles ?? []).map((role) => role.toLowerCase());
  const actorPermissions = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];

  if (!actorId || !canAccessAdminPermission(actorRoles, actorPermissions, permissionKey)) {
    throw new Error("Unauthorized");
  }

  return { actorId };
}

function revalidateRbacSurfaces(userIds: string[] = []) {
  revalidatePath("/roles");
  revalidatePath("/permissions");
  revalidatePath("/user");

  for (const userId of userIds) {
    revalidatePath(`/user/${userId}`);
  }
}

export async function adminUserRoleAssignmentAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.ROLES_MANAGE);
  const userId = normalizeText(formData.get("userId"));
  const roleId = normalizeText(formData.get("roleId"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!userId || !roleId || !intent) {
    throw new Error("Missing role assignment input");
  }

  if (!reason) {
    throw new Error("A reason is required for role changes");
  }

  if (userId === actorId) {
    throw new Error("You cannot change your own role assignments from the admin portal");
  }

  const [targetUser, role] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        roles: {
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        isSystem: true,
      },
    }),
  ]);

  if (!targetUser) throw new Error("Target user not found");
  if (!role) throw new Error("Role not found");

  const existingAssignment = targetUser.roles.find((assignment) => assignment.role.id === role.id);
  const normalizedRoleName = normalizeRoleName(role.name);

  if (intent === "assign") {
    if (existingAssignment) {
      throw new Error("This role is already assigned to the target user");
    }
  } else if (intent === "remove") {
    if (!existingAssignment) {
      throw new Error("This role is not currently assigned to the target user");
    }

    if (normalizedRoleName === "super_admin") {
      const superAdminCount = await prisma.userRole.count({
        where: {
          roleId: role.id,
        },
      });

      if (superAdminCount <= 1) {
        throw new Error("The last super admin role assignment cannot be removed");
      }
    }
  } else {
    throw new Error("Unsupported role assignment action");
  }

  await prisma.$transaction(async (tx) => {
    if (intent === "assign") {
      await tx.userRole.create({
        data: {
          userId,
          roleId,
          assignedById: actorId,
        },
      });
    } else if (existingAssignment) {
      await tx.userRole.delete({
        where: {
          id: existingAssignment.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SECURITY,
        action: intent === "assign" ? "ADMIN_ROLE_ASSIGNED" : "ADMIN_ROLE_REMOVED",
        actorId,
        targetUserId: userId,
        targetType: ContentTargetType.USER,
        targetId: userId,
        meta: {
          roleId: role.id,
          roleName: role.name,
          reason,
          targetDisplayName: targetUser.displayName,
        },
      },
    });
  });

  revalidateRbacSurfaces([userId]);
}

export async function adminRoleAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.ROLES_MANAGE);
  const intent = normalizeText(formData.get("intent"));
  const roleId = normalizeText(formData.get("roleId"));
  const nameInput = normalizeText(formData.get("name"));
  const description = normalizeText(formData.get("description"));
  const reason = normalizeText(formData.get("reason"));

  if (!intent) {
    throw new Error("Missing role action");
  }

  if (intent === "create_role") {
    const normalizedName = normalizeRoleName(nameInput).replace(/\s+/g, "_");
    const auditReason = getAuditReason(reason, "Role created from the admin roles form");

    if (!normalizedName) {
      throw new Error("A role name is required");
    }

    const existingRole = await prisma.role.findUnique({
      where: { name: normalizedName },
      select: { id: true },
    });

    if (existingRole) {
      throw new Error("A role with this name already exists");
    }

    await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: normalizedName,
          description: description || null,
          isSystem: false,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SECURITY,
          action: "ADMIN_ROLE_CREATED",
          actorId,
          targetId: role.id,
          meta: {
            roleName: role.name,
            description: role.description,
            reason: auditReason,
          },
        },
      });

    });

    revalidateRbacSurfaces();
    return;
  }

  if (intent === "delete_role") {
    const auditReason = getAuditReason(reason, "Role deleted from the admin roles form");

    if (!roleId) {
      throw new Error("Role selection is required");
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        users: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem) {
      throw new Error("System roles cannot be deleted");
    }

    await prisma.$transaction(async (tx) => {
      await tx.role.delete({
        where: { id: role.id },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SECURITY,
          action: "ADMIN_ROLE_DELETED",
          actorId,
          targetId: role.id,
          meta: {
            roleName: role.name,
            description: role.description,
            impactedUserCount: role._count.users,
            impactedPermissionCount: role._count.permissions,
            reason: auditReason,
          },
        },
      });
    });

    revalidateRbacSurfaces(role.users.map((assignment) => assignment.userId));
    return;
  }

  if (intent !== "update_role") {
    throw new Error("Unsupported role catalog action");
  }

  if (!roleId) {
    throw new Error("Role selection is required");
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  const nextName = normalizeRoleName(nameInput).replace(/\s+/g, "_");
  const auditReason = getAuditReason(reason, "Role updated from the admin roles form");

  if (!nextName) {
    throw new Error("A role name is required");
  }

  if (role.isSystem && nextName !== role.name) {
    throw new Error("System role names cannot be changed");
  }

  if (nextName !== role.name) {
    const existingRole = await prisma.role.findUnique({
      where: { name: nextName },
      select: { id: true },
    });

    if (existingRole && existingRole.id !== role.id) {
      throw new Error("A role with this name already exists");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: role.id },
      data: {
        name: nextName,
        description: description || null,
      },
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SECURITY,
        action: "ADMIN_ROLE_UPDATED",
        actorId,
        targetId: role.id,
        meta: {
          roleName: role.name,
          previousName: role.name,
          nextName,
          previousDescription: role.description,
          nextDescription: description || null,
          reason: auditReason,
        },
      },
    });
  });

  revalidateRbacSurfaces();
}

export async function adminPermissionAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.PERMISSIONS_MANAGE);
  const intent = normalizeText(formData.get("intent"));
  const permissionId = normalizeText(formData.get("permissionId"));
  const keyInput = normalizeText(formData.get("key"));
  const description = normalizeText(formData.get("description"));
  const reason = normalizeText(formData.get("reason"));

  if (!intent) {
    throw new Error("Missing permission action");
  }

  if (intent === "create_permission") {
    const normalizedKey = normalizePermissionKey(keyInput);
    const auditReason = getAuditReason(reason, "Permission created from the admin permissions form");

    if (!normalizedKey) {
      throw new Error("A permission key is required");
    }

    if (!/^[a-z0-9._-]+$/.test(normalizedKey)) {
      throw new Error("Permission keys may only use lowercase letters, numbers, dots, dashes, and underscores");
    }

    const existingPermission = await prisma.permission.findUnique({
      where: { key: normalizedKey },
      select: { id: true },
    });

    if (existingPermission) {
      throw new Error("A permission with this key already exists");
    }

    await prisma.$transaction(async (tx) => {
      const permission = await tx.permission.create({
        data: {
          key: normalizedKey,
          description: description || null,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SECURITY,
          action: "ADMIN_PERMISSION_CREATED",
          actorId,
          targetId: permission.id,
          meta: {
            permissionKey: permission.key,
            description: permission.description,
            reason: auditReason,
          },
        },
      });
    });

    revalidateRbacSurfaces();
    return;
  }

  if (intent === "update_permission") {
    const normalizedKey = normalizePermissionKey(keyInput);
    const auditReason = getAuditReason(reason, "Permission updated from the admin permissions form");

    if (!permissionId) {
      throw new Error("Permission selection is required");
    }

    if (!normalizedKey) {
      throw new Error("A permission key is required");
    }

    if (!/^[a-z0-9._-]+$/.test(normalizedKey)) {
      throw new Error("Permission keys may only use lowercase letters, numbers, dots, dashes, and underscores");
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      select: {
        id: true,
        key: true,
        description: true,
      },
    });

    if (!permission) {
      throw new Error("Permission not found");
    }

    if (PROTECTED_PERMISSION_KEYS.has(permission.key) && normalizedKey !== permission.key) {
      throw new Error("Protected admin permissions cannot be renamed");
    }

    if (normalizedKey !== permission.key) {
      const existingPermission = await prisma.permission.findUnique({
        where: { key: normalizedKey },
        select: { id: true },
      });

      if (existingPermission && existingPermission.id !== permission.id) {
        throw new Error("A permission with this key already exists");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.permission.update({
        where: { id: permission.id },
        data: {
          key: normalizedKey,
          description: description || null,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SECURITY,
          action: "ADMIN_PERMISSION_UPDATED",
          actorId,
          targetId: permission.id,
          meta: {
            previousKey: permission.key,
            nextKey: normalizedKey,
            previousDescription: permission.description,
            nextDescription: description || null,
            reason: auditReason,
          },
        },
      });
    });

    revalidateRbacSurfaces();
    return;
  }

  if (intent !== "delete_permission") {
    throw new Error("Unsupported permission catalog action");
  }

  const auditReason = getAuditReason(reason, "Permission deleted from the admin permissions form");

  if (!permissionId) {
    throw new Error("Permission selection is required");
  }

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
    select: {
      id: true,
      key: true,
      description: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              users: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  if (PROTECTED_PERMISSION_KEYS.has(permission.key)) {
    throw new Error("Protected admin permissions cannot be deleted");
  }

  const impactedUserIds = Array.from(
    new Set(
      permission.roles.flatMap((binding) => binding.role.users.map((assignment) => assignment.userId)),
    ),
  );

  await prisma.$transaction(async (tx) => {
    await tx.permission.delete({
      where: { id: permission.id },
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SECURITY,
        action: "ADMIN_PERMISSION_DELETED",
        actorId,
        targetId: permission.id,
        meta: {
          permissionKey: permission.key,
          description: permission.description,
          impactedRoleCount: permission.roles.length,
          reason: auditReason,
        },
      },
    });
  });

  revalidateRbacSurfaces(impactedUserIds);
}

export async function adminRolePermissionAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.PERMISSIONS_MANAGE);
  const roleId = normalizeText(formData.get("roleId"));
  const permissionId = normalizeText(formData.get("permissionId"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!roleId || !permissionId || !intent) {
    throw new Error("Missing permission binding input");
  }

  const auditReason = getAuditReason(reason, "Role permission updated from the admin permissions form");

  const [role, permission] = await Promise.all([
    prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        users: {
          select: {
            userId: true,
          },
        },
      },
    }),
    prisma.permission.findUnique({
      where: { id: permissionId },
      select: {
        id: true,
        key: true,
      },
    }),
  ]);

  if (!role) throw new Error("Role not found");
  if (!permission) throw new Error("Permission not found");

  const existingBinding = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
    select: { id: true },
  });

  if (intent === "bind") {
    if (existingBinding) {
      throw new Error("This permission is already bound to the role");
    }
  } else if (intent === "unbind") {
    if (!existingBinding) {
      throw new Error("This permission is not bound to the role");
    }
  } else {
    throw new Error("Unsupported permission action");
  }

  await prisma.$transaction(async (tx) => {
    if (intent === "bind") {
      await tx.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      });
    } else if (existingBinding) {
      await tx.rolePermission.delete({
        where: {
          id: existingBinding.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SECURITY,
        action: intent === "bind" ? "ADMIN_ROLE_PERMISSION_BOUND" : "ADMIN_ROLE_PERMISSION_UNBOUND",
        actorId,
        targetId: role.id,
        meta: {
          roleId: role.id,
          roleName: role.name,
          permissionId: permission.id,
          permissionKey: permission.key,
          reason: auditReason,
        },
      },
    });
  });

  revalidateRbacSurfaces(role.users.map((assignment) => assignment.userId));
}

export async function adminRoleCatalogFormAction(
  _previousState: RbacActionState,
  formData: FormData,
): Promise<RbacActionState> {
  const intent = normalizeText(formData.get("intent"));

  try {
    await adminRoleAction(formData);

    return {
      status: "success",
      message: intent === "delete_role" ? "Role deleted successfully." : "Role saved successfully.",
    };
  } catch (error: unknown) {
    return {
      status: "error",
      message: getErrorMessage(error, "Unable to update the role catalog."),
    };
  }
}

export async function adminPermissionCatalogFormAction(
  _previousState: RbacActionState,
  formData: FormData,
): Promise<RbacActionState> {
  const intent = normalizeText(formData.get("intent"));

  try {
    await adminPermissionAction(formData);

    return {
      status: "success",
      message:
        intent === "delete_permission"
          ? "Permission deleted successfully."
          : intent === "update_permission"
            ? "Permission updated successfully."
            : "Permission saved successfully.",
    };
  } catch (error: unknown) {
    return {
      status: "error",
      message: getErrorMessage(error, "Unable to update the permission catalog."),
    };
  }
}

export async function adminRolePermissionFormAction(
  _previousState: RbacActionState,
  formData: FormData,
): Promise<RbacActionState> {
  const intent = normalizeText(formData.get("intent"));

  try {
    await adminRolePermissionAction(formData);

    return {
      status: "success",
      message: intent === "unbind" ? "Permission removed from role." : "Permission assigned to role.",
    };
  } catch (error: unknown) {
    return {
      status: "error",
      message: getErrorMessage(error, "Unable to update the role permission binding."),
    };
  }
}
