"use client";

import { useEffect } from "react";

export default function ProfileViewTracker({
  profileUserId,
}: {
  profileUserId: string;
}) {
  useEffect(() => {
    fetch("/api/profile/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUserId }),
    }).catch(() => {});
  }, [profileUserId]);

  return null;
}
