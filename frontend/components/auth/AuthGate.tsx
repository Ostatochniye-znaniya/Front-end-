"use client";

import React, { useEffect, useState } from "react";
import { redirectToLogin } from "@/api/client";
import { getUserData } from "@/services/getUserData";

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname;
    if (
      path.includes("/auth-redirect") ||
      path.includes("/login")
    ) {
      return true;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    // Белый список: на страницах авторизации проверка доступа не блокирует показ страницы
    if (
      path.includes("/auth-redirect") ||
      path.includes("/login")
    ) {
      return;
    }

    getUserData()
      .then((data) => {
        if (data) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          redirectToLogin();
        }
      })
      .catch((err) => {
        console.error("AuthGate: Ошибка проверки сессии:", err);
        setIsAuthenticated(false);
        redirectToLogin();
      });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "var(--background-c)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid rgba(0, 114, 206, 0.2)",
            borderTopColor: "var(--color-accent-blue-bg, #0072ce)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "16px",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-font, inherit)",
          }}
        >
          Проверка доступа...
        </h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "var(--background-c)",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "var(--background-main-element-c)",
            borderRadius: "20px",
            padding: "36px 24px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--secondary-border-c)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/csh/mpu_logo_l.png"
            alt="Московский Политех"
            className="theme-aware-logo"
            style={{ height: "56px", margin: "0 auto 20px" }}
          />
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Требуется авторизация
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--secondary-lock-font-c, #888)",
              marginBottom: "24px",
            }}
          >
            Для доступа к системе необходимо войти через Единую учетную запись Московского Политеха
          </p>
          <button
            onClick={() => redirectToLogin()}
            className="btn-blue"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
            }}
          >
            Войти через ЕУЗ
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
