import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roleId, permissionId } = body;

    if (!roleId || !permissionId) {
      return new NextResponse("roleId and permissionId are required", { status: 400 });
    }

    // Verify role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return new NextResponse(`Role not found`, { status: 404 });
    }
    if (!role.isActive) {
      return new NextResponse("Inactive roles cannot receive new permissions", { status: 400 });
    }

    // Verify permission exists
    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) {
      return new NextResponse(`Permission not found`, { status: 404 });
    }
    if (!permission.isActive) {
      return new NextResponse("Inactive permissions cannot be assigned to roles", { status: 400 });
    }

    // Check for duplicate binding
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (existing) {
      return new NextResponse("This role-permission binding already exists", { status: 409 });
    }

    const binding = await prisma.rolePermission.create({
      data: { roleId, permissionId, isActive: true },
      include: {
        role: true,
        permission: true,
      },
    });

    return NextResponse.json(binding, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/role-permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, roleId, permissionId, isActive } = body as {
      id?: string;
      roleId?: string;
      permissionId?: string;
      isActive?: boolean;
    };

    if (!id?.trim()) {
      return new NextResponse("Binding id is required", { status: 400 });
    }

    const existingBinding = await prisma.rolePermission.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        roleId: true,
        permissionId: true,
      },
    });

    if (!existingBinding) {
      return new NextResponse("Role-permission binding not found", { status: 404 });
    }

    const nextRoleId = typeof roleId === "string" && roleId.trim() ? roleId.trim() : existingBinding.roleId;
    const nextPermissionId =
      typeof permissionId === "string" && permissionId.trim() ? permissionId.trim() : existingBinding.permissionId;

    if (nextRoleId !== existingBinding.roleId || nextPermissionId !== existingBinding.permissionId) {
      const [role, permission, duplicate] = await Promise.all([
        prisma.role.findUnique({ where: { id: nextRoleId }, select: { id: true, isActive: true } }),
        prisma.permission.findUnique({ where: { id: nextPermissionId }, select: { id: true, isActive: true } }),
        prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: nextRoleId, permissionId: nextPermissionId } },
          select: { id: true },
        }),
      ]);

      if (!role) {
        return new NextResponse("Role not found", { status: 404 });
      }
      if (!role.isActive) {
        return new NextResponse("Inactive roles cannot receive permissions", { status: 400 });
      }

      if (!permission) {
        return new NextResponse("Permission not found", { status: 404 });
      }
      if (!permission.isActive) {
        return new NextResponse("Inactive permissions cannot be assigned to roles", { status: 400 });
      }

      if (duplicate && duplicate.id !== existingBinding.id) {
        return new NextResponse("This role-permission binding already exists", { status: 409 });
      }
    }

    const data: {
      roleId?: string;
      permissionId?: string;
      isActive?: boolean;
    } = {};

    if (nextRoleId !== existingBinding.roleId) {
      data.roleId = nextRoleId;
    }
    if (nextPermissionId !== existingBinding.permissionId) {
      data.permissionId = nextPermissionId;
    }
    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return new NextResponse("No binding changes were provided", { status: 400 });
    }

    const binding = await prisma.rolePermission.update({
      where: { id: existingBinding.id },
      data,
      include: {
        role: true,
        permission: true,
      },
    });

    return NextResponse.json(binding);
  } catch (error: any) {
    console.error("[PATCH /api/admin/role-permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return new NextResponse("Binding id is required", { status: 400 });
    }

    const existingBinding = await prisma.rolePermission.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingBinding) {
      return new NextResponse("Role-permission binding not found", { status: 404 });
    }

    await prisma.rolePermission.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[DELETE /api/admin/role-permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function GET() {
  try {
    const bindings = await prisma.rolePermission.findMany({
      orderBy: [{ isActive: "desc" }, { grantedAt: "desc" }],
      include: {
        role: true,
        permission: true,
      },
    });
    return NextResponse.json(bindings);
  } catch (error: any) {
    console.error("[GET /api/admin/role-permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}
