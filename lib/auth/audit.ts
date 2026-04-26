import { createHash } from "crypto";

export function hashAuditIp(ip?: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}
