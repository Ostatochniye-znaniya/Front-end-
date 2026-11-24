"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveRedirectUrl, setGlobalRouter, redirectToLoginPage, isAuthenticated } from "@/api/client";

interface AuthGateProps {
  children: React.ReactNode;
}

const isPublicPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  const cleanPath = pathname.replace(/^\/csh/, "") || "/";
  return (
    cleanPath === "/login" ||
    cleanPath.startsWith("/login/") ||
    cleanPath === "/auth-redirect" ||
    cleanPath.startsWith("/auth-redirect/") ||
    cleanPath === "/403" ||
    cleanPath.startsWith("/403/")
  );
};

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setGlobalRouter(router);
    return () => setGlobalRouter(null);
  }, [router]);

  const publicRoute = isPublicPath(pathname);

  const [hasSession, setHasSession] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (publicRoute) return true;
    return isAuthenticated();
  });

  useLayoutEffect(() => {
    if (publicRoute) {
      setHasSession(true);
      return;
    }

    const sessionExists = isAuthenticated();
    setHasSession(sessionExists);

    if (!sessionExists) {
      saveRedirectUrl();
      redirectToLoginPage(router);
    }
  }, [pathname, publicRoute, router]);

  if (publicRoute) {
    return <>{children}</>;
  }

  if (!hasSession) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGate;
