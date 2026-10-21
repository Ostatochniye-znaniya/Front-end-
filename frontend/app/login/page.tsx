"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin, getAndClearRedirectUrl } from "@/api/client";
import { setSessionCookie, setUserCookie, formatUserCookieData } from "@/services/userCookie";

interface MockRoleItem {
  id: number;
  role: string;
  role_slug: string;
  system_role_name?: string;
  name?: string;
  email?: string;
  description?: string;
}

const DEFAULT_MOCK_ROLES: MockRoleItem[] = [
  { id: 1, role: "Администратор", role_slug: "admin", name: "Алексеев Алексей Алексеевич", description: "Полный доступ к системе и правам" },
  { id: 2, role: "Лицо, принимающее решения (ЛПР)", role_slug: "lpr", name: "Дмитриев Дмитрий Дмитриевич", description: "Статистика, приказы и списки групп" },
  { id: 3, role: "Заведующий кафедрой", role_slug: "hod", name: "Сергеев Сергей Сергеевич", description: "Управление кафедрой и отчетами" },
  { id: 4, role: "Преподаватель", role_slug: "teacher", name: "Иванов Иван Иванович", description: "Сдача отчетов и проведение тестирований" },
  { id: 5, role: "Руководитель факультета / института", role_slug: "rod", name: "Михайлов Михаил Михайлович", description: "Контроль успеваемости по институту" },
  { id: 6, role: "Ответственный за подразделение", role_slug: "department_responsible", name: "Федоров Федор Федорович", description: "Организация тестирований на кафедре" },
  { id: 7, role: "Студент", role_slug: "student", name: "Сидоров Сидор Сидорович", description: "Прохождение тестирований" },
  { id: 8, role: "Гость", role_slug: "guest", name: "Гостевой Пользователь", description: "Ограниченный гостевой доступ" },
];

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isMockEnabled, setIsMockEnabled] = useState(false);
  const [roles, setRoles] = useState<MockRoleItem[]>([]);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function checkBackendMockStatus() {
      try {
        const response = await fetch("/csh/api/auth/mock/status", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.enabled) {
            if (!isCancelled) {
              setIsMockEnabled(true);
              setRoles(data.available_roles && data.available_roles.length > 0 ? data.available_roles : DEFAULT_MOCK_ROLES);
              setChecking(false);
            }
            return;
          }
        }
      } catch (err) {
        console.warn("MOCK статус бэкенда недоступен, выполняем стандартный вход:", err);
      }

      // Если MOCK выключен на бэкенде — оставляем поведение без изменений
      if (!isCancelled) {
        setChecking(false);
        redirectToLogin();
      }
    }

    checkBackendMockStatus();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSelectRole = async (roleSlug: string) => {
    setLoadingRole(roleSlug);
    try {
      const response = await fetch(`/csh/api/auth/mock/switch?role=${encodeURIComponent(roleSlug)}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSessionCookie();
        if (data?.user) {
          setUserCookie(formatUserCookieData(data.user));
        }

        const savedUrl = getAndClearRedirectUrl();
        let target = savedUrl;
        if (!target || target.includes("/login") || target.includes("/auth-redirect")) {
          if (roleSlug === "admin") target = "/access-rights";
          else if (roleSlug === "teacher") target = "/teacher/main";
          else if (roleSlug === "hod") target = "/hod/statistics";
          else if (roleSlug === "lpr") target = "/lpr/statistics";
          else if (roleSlug === "rod") target = "/rod/schedule";
          else if (roleSlug === "department_responsible") target = "/hod/statistics";
          else if (roleSlug === "guest") target = "/guest";
          else target = "/teacher/main";
        }

        // Извлекаем относительный путь, если target был абсолютным URL
        if (target.startsWith("http")) {
          try {
            const urlObj = new URL(target);
            target = urlObj.pathname + urlObj.search;
          } catch {
            target = "/";
          }
        }

        // Next.js basePath: '/csh' автоматически добавляет префикс /csh при вызове router.push().
        // Поэтому обязательно очищаем префикс /csh, чтобы не было дублирования /csh/csh/...
        if (target.startsWith("/csh")) {
          target = target.replace(/^\/csh/, "") || "/";
        }

        router.push(target);
      } else {
        alert("Не удалось авторизоваться под выбранной ролью");
      }
    } catch (e) {
      console.error("Ошибка авторизации под mock-ролью:", e);
      alert("Произошла ошибка при переключении роли");
    } finally {
      setLoadingRole(null);
    }
  };

  // Экран проверки или стандартного перенаправления
  if (checking || !isMockEnabled) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          textAlign: "center",
          backgroundColor: "var(--background-c, #f8f9fa)",
          fontFamily: "var(--font-roboto, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            backgroundColor: "var(--background-main-element-c, #ffffff)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--secondary-border-c, #e5e7eb)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/csh/mpu_logo_l.png"
            alt="Московский Политех"
            className="theme-aware-logo"
            style={{ height: "64px", width: "auto", marginBottom: "24px" }}
          />

          <div
            style={{
              width: "44px",
              height: "44px",
              border: "3px solid rgba(0, 102, 204, 0.15)",
              borderTopColor: "var(--brand-main-c, #0066cc)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          />

          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "10px",
              color: "var(--main-font-c, #111)",
            }}
          >
            Перенаправление на ЕУЗ...
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "var(--secondary-lock-font-c, #666)",
              lineHeight: "1.5",
              marginBottom: "24px",
            }}
          >
            Выполняется переход на страницу единой учётной записи Московского Политеха
          </p>

          <button
            onClick={() => redirectToLogin()}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "var(--brand-main-c, #0066cc)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
          >
            Нажмите, если переход не произошёл автоматически
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Экран выбора доступных MOCK ролей в виде кнопок
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        backgroundColor: "var(--background-c, #f8f9fa)",
        fontFamily: "var(--font-roboto, sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          width: "100%",
          backgroundColor: "var(--background-main-element-c, #ffffff)",
          borderRadius: "24px",
          padding: "36px 32px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
          border: "1px solid var(--secondary-border-c, #e5e7eb)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/csh/mpu_logo_l.png"
            alt="Московский Политех"
            className="theme-aware-logo"
            style={{ height: "48px", width: "auto" }}
          />
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--main-font-c, #111)" }}>
              Авторизация в системе
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--brand-main-c, #0066cc)", fontWeight: 600 }}>
              Включен режим MOCK-авторизации на бэкенде
            </p>
          </div>
        </div>

        <p style={{ fontSize: "14px", color: "var(--secondary-lock-font-c, #666)", marginBottom: "24px", lineHeight: "1.5" }}>
          Выберите роль для входа в приложение в качестве тестового пользователя:
        </p>

        {/* Список ролей в виде кнопок */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          {roles.map((item) => {
            const isLoading = loadingRole === item.role_slug;

            return (
              <button
                key={item.role_slug}
                onClick={() => !isLoading && handleSelectRole(item.role_slug)}
                disabled={Boolean(loadingRole)}
                style={{
                  textAlign: "left",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--secondary-border-c, #e2e8f0)",
                  backgroundColor: "var(--background-secondary-c, #f8fafc)",
                  cursor: isLoading ? "wait" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  opacity: loadingRole && !isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loadingRole) {
                    e.currentTarget.style.borderColor = "var(--brand-main-c, #0066cc)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingRole) {
                    e.currentTarget.style.borderColor = "var(--secondary-border-c, #e2e8f0)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--main-font-c, #0f172a)" }}>
                    {item.role}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: "rgba(0, 102, 204, 0.1)",
                      color: "var(--brand-main-c, #0066cc)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {item.role_slug}
                  </span>
                </div>

                {item.name && (
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--brand-main-c, #0066cc)" }}>
                    {item.name}
                  </div>
                )}

                {item.description && (
                  <div style={{ fontSize: "12px", color: "var(--secondary-lock-font-c, #64748b)", lineHeight: "1.4" }}>
                    {item.description}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--brand-main-c, #0066cc)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {isLoading ? "Авторизация..." : "Войти как этот пользователь →"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Альтернативный вход через ЕУЗ */}
        <div
          style={{
            paddingTop: "20px",
            borderTop: "1px solid var(--secondary-border-c, #e5e7eb)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "13px", color: "var(--secondary-lock-font-c, #64748b)" }}>
            Для выключения MOCK-режима установите <code>MOCK_AUTH_ENABLED=false</code> на бэкенде
          </span>

          <button
            onClick={() => redirectToLogin()}
            style={{
              background: "transparent",
              border: "1px solid var(--secondary-border-c, #cbd5e1)",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              color: "var(--main-font-c, #334155)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Войти через ЕУЗ Политеха →
          </button>
        </div>
      </div>
    </div>
  );
}