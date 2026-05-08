ALTER TABLE "RolePermission"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "RolePermission_isActive_idx" ON "RolePermission"("isActive");
