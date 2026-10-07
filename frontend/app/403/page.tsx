"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin, clearTokens } from "@/api/client";

export default function ForbiddenPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSwitchAccount = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/csh/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } finally {
      clearTokens();
      redirectToLogin();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(135deg, rgba(224, 231, 255, 0.7) 0%, rgba(243, 232, 255, 0.7) 50%, rgba(254, 242, 242, 0.7) 100%)",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--background-main-element-c, #ffffff)",
          borderRadius: "28px",
          padding: "44px 36px 32px 36px",
          boxShadow:
            "0 14px 40px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--secondary-border-c, rgba(226, 232, 240, 0.8))",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* Логотип по центру */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/csh/logo_d.png"
            alt="Проверка остаточных знаний"
            className="navbar-title-logo"
            style={{
              height: "54px",
              width: "auto",
              objectFit: "contain",
              margin: 0,
            }}
          />
        </div>

        {/* Код ошибки */}
        <h1
          style={{
            fontSize: "60px",
            fontWeight: 800,
            color: "#f75560",
            margin: "0 0 4px 0",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          403
        </h1>

        {/* Текст FORBIDDEN */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "#f75560",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          FORBIDDEN
        </div>

        {/* Описание */}
        <p
          style={{
            fontSize: "15px",
            color: "var(--secondary-lock-font-c, #64748b)",
            lineHeight: "1.55",
            maxWidth: "340px",
            margin: "0 auto 32px auto",
          }}
        >
          Данный раздел сайта ограничен вашей текущей ролью в системе.
        </p>

        {/* Кнопки */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <button
            onClick={handleBack}
            className="hover-opacity"
            style={{
              background: "transparent",
              border: "none",
              color: "#5465ff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "10px 14px",
              borderRadius: "8px",
              transition: "opacity 0.2s ease, transform 0.1s ease",
            }}
          >
            ← Назад
          </button>

          <button
            onClick={handleSwitchAccount}
            disabled={isLoggingOut}
            style={{
              backgroundColor: "#5465ff",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isLoggingOut ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(84, 101, 255, 0.35)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
              opacity: isLoggingOut ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(84, 101, 255, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(84, 101, 255, 0.35)";
            }}
          >
            {isLoggingOut ? "Выход..." : "Сменить аккаунт"}
          </button>
        </div>

        {/* Разделитель */}
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "var(--secondary-border-c, #e2e8f0)",
            margin: "0 0 24px 0",
            opacity: 0.8,
          }}
        />

        {/* Подвал карточки */}
        <div
          style={{
            fontSize: "13px",
            color: "var(--secondary-lock-font-c, #94a3b8)",
            lineHeight: "1.5",
          }}
        >
          <div>Московский Политехнический Университет</div>
          <div>Система проверки остаточных знаний</div>
        </div>
      </div>
    </div>
  );
}
