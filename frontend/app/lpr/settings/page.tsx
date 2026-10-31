"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LprSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/access-rights");
  }, [router]);

  return (
    <div className="main-container p-6 text-center">
      <p className="text-sm opacity-60">Перенаправление в Справочник прав доступа...</p>
    </div>
  );
}