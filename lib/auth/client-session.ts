export function clearClientAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("isLoggedIn");
    window.sessionStorage.removeItem("user");
    window.sessionStorage.removeItem("isLoggedIn");
  } catch {
    // Ignore storage access errors during logout cleanup.
  }
}

export async function logoutClientSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
    });
  } catch {
    // Continue with local cleanup even if the network request fails.
  } finally {
    clearClientAuthState();
  }
}
