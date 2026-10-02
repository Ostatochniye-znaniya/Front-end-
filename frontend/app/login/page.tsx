"use client";

import { useEffect } from "react";
import { redirectToLogin } from "@/api/client";

export default function LoginPage() {
    useEffect(() => {
        redirectToLogin();
    }, []);

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