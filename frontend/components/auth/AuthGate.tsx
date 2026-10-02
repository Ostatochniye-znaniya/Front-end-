"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveRedirectUrl, setGlobalRouter, redirectToLoginPage } from "@/api/client";

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
    cleanPath.startsWith("/auth-redirect/")
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

  const [hasToken, setHasToken] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (publicRoute) return true;
    return !!(
      localStorage.getItem("access_token") ||
      localStorage.getItem("isAuthenticated")
    );
  });

  useLayoutEffect(() => {
    if (publicRoute) {
      setHasToken(true);
      return;
    }

    const tokenExists = !!(
      localStorage.getItem("access_token") ||
      localStorage.getItem("isAuthenticated")
    );

    setHasToken(tokenExists);

    if (!tokenExists) {
      saveRedirectUrl();
      redirectToLoginPage(router);
    }
  }, [pathname, publicRoute, router]);

  if (publicRoute) {
    return <>{children}</>;
  }

  if (!hasToken) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGate;
