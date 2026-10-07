"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setTokens, redirectToLogin, clearTokens } from "@/api/client";
import { getUserData } from "@/services/getUserData";
import { getUserStatus } from "@/services/getUserStatus";

export default function AuthRedirectPage() {
  const router = useRouter();
  const hasCalled = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Завершение входа...");

  useEffect(() => {
    if (hasCalled.current) return;

    const fullUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!fullUrl) return;

    // Функция-помощник для поиска параметров через регулярные выражения
    const getParam = (name: string, url: string): string | null => {
      const match = url.match(new RegExp("[?&]" + name + "=([^&]+)"));
      return match ? match[1] : null;
    };

    // 1. Извлекаем токены и целевой URL
    const access = getParam("access", fullUrl);
    const refresh = getParam("refresh", fullUrl);
    const savedRedirect = typeof window !== "undefined" ? localStorage.getItem("auth_redirect_url") : null;
    if (savedRedirect && typeof window !== "undefined") {
      localStorage.removeItem("auth_redirect_url");
    }
    const returnToRaw =
      getParam("return_url", fullUrl) ||
      getParam("return_to", fullUrl) ||
      savedRedirect ||
      "/csh";

    if (!access || !refresh) {
      console.error("AuthRedirect: Токены не найдены в строке:", fullUrl);
      const timer = setTimeout(() => {
        setError("Токены авторизации не получены. Перенаправление на страницу входа...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }, 0);
      return () => clearTimeout(timer);
    }

    hasCalled.current = true;
    console.log("AuthRedirect: Токены успешно извлечены!");

    const decodedAccess = decodeURIComponent(access);
    const decodedRefresh = decodeURIComponent(refresh);

    // 2. Отправляем токены на бэкенд для создания сессии
    (async () => {
      try {
        setStatusMessage("Синхронизация учетной записи...");

        const response = await fetch("/csh/api/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            access: decodedAccess,
            refresh: decodedRefresh,
          }),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
          throw new Error(errData.detail || errData.message || `Ошибка сервера (${response.status})`);
        }

        // 3. Сохраняем сессию в куки
        setTokens(decodedAccess, decodedRefresh);

        setStatusMessage("Получение данных профиля...");

        // 4. Подтягиваем профиль пользователя и роль
        let role = "teacher";
        try {
          const userData = await getUserData({ forceRefresh: true });
          const userStatus = await getUserStatus();
          if (userStatus?.status) {
            role = userStatus.status;
          }
        } catch (e) {
          console.warn("AuthRedirect: Не удалось загрузить профиль сразу, используем переход по умолчанию", e);
        }

        setStatusMessage("Перенаправление...");

        // 5. Очищаем целевой путь от лишних параметров авторизации
        let targetPath = decodeURIComponent(returnToRaw).split("?")[0];

        // Проверяем, не ведет ли targetPath на страницу логина/редиректа
        const isAuthLoop =
          targetPath.includes("/login") ||
          targetPath.includes("/auth-redirect");

        if (isAuthLoop || targetPath === "/" || targetPath === "/csh" || targetPath === "/csh/") {
          // Выбираем путь по роли
          if (role === "teacher") {
            targetPath = "/csh/teacher/main";
          } else if (role === "hod") {
            targetPath = "/csh/hod/statistics";
          } else if (role === "lpr") {
            targetPath = "/csh/lpr/statistics";
          } else if (role === "guest") {
            targetPath = "/csh/guest";
          } else {
            targetPath = "/csh";
          }
        }

        if (!targetPath.startsWith("http")) {
          if (!targetPath.startsWith("/csh") && !targetPath.startsWith("/")) {
            targetPath = "/csh/" + targetPath;
          } else if (targetPath.startsWith("/") && !targetPath.startsWith("/csh")) {
            targetPath = "/csh" + targetPath;
          }
          targetPath = window.location.origin + targetPath;
        }

        console.log("AuthRedirect: Сессия создана, перенаправляем на:", targetPath);
        window.location.replace(targetPath);
      } catch (err: unknown) {
        console.error("AuthRedirect: Ошибка при обработке авторизации:", err);
        const errorMsg = err instanceof Error ? err.message : "Произошла ошибка при завершении входа.";
        setError(errorMsg);
        hasCalled.current = false;
      }
    })();
  }, [router]);

  return (
    <div
      className="bg-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        position: "relative",
      }}
    >
      <div className="bg-gradient" />

      <div
        style={{
          maxWidth: "460px",
          width: "100%",
          backgroundColor: "var(--background-main-element-c)",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          border: "1px solid var(--secondary-border-c)",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/csh/mpu_logo_l.png"
            alt="Московский Политех"
            className="theme-aware-logo"
            style={{ height: "64px", width: "auto" }}
          />
        </div>

        {error ? (
          <div>
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "24px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: "4px" }}>Ошибка входа</p>
              <p>{error}</p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setError(null);
                  hasCalled.current = false;
                  redirectToLogin();
                }}
                className="btn-blue"
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                }}
              >
                Повторить попытку
              </button>

              <button
                onClick={() => {
                  clearTokens();
                  router.push("/login");
                }}
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  color: "var(--secondary-link-c)",
                  border: "1px solid var(--secondary-border-c)",
                }}
              >
                На страницу входа
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "inline-block",
                width: "48px",
                height: "48px",
                border: "4px solid rgba(0, 114, 206, 0.2)",
                borderTopColor: "var(--color-accent-blue-bg, #0072ce)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "20px",
              }}
            />
            <style jsx>{`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>

            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "var(--color-font, inherit)",
              }}
            >
              {statusMessage}
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: "var(--secondary-lock-font-c, #888)",
              }}
            >
              Пожалуйста, не закрывайте вкладку браузера
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
