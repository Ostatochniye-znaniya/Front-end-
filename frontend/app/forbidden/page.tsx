"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/button/Button";

export default function ForbiddenPage() {
    const router = useRouter();
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setFadeIn(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className="bg-container"
            style={{
                minHeight: "100vh",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div className="bg-gradient" />

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px",
                    overflowY: "auto",
                }}
            >
                <div
                    style={{
                        maxWidth: "480px",
                        width: "100%",
                        backgroundColor: "var(--background-main-element-c)",
                        borderRadius: "24px",
                        padding: "40px 32px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        border: "1px solid var(--secondary-border-c)",
                        opacity: fadeIn ? 1 : 0,
                        transform: fadeIn ? "translateY(0)" : "translateY(20px)",
                        transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            marginBottom: "32px",
                        }}
                    >
                        <img className="navbar-title-logo" alt="Проверка остаточных знаний" />
                    </div>

                    <p
                        style={{
                            fontSize: "52px",
                            fontWeight: 800,
                            color: "var(--accent-red-c)",
                            margin: 0,
                            lineHeight: 1,
                        }}
                    >
                        403
                    </p>
                    <p
                        style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "var(--accent-red-c)",
                            margin: "6px 0 20px",
                            letterSpacing: "3px",
                            textTransform: "uppercase",
                        }}
                    >
                        Forbidden
                    </p>

                    <p
                        className="text-blind"
                        style={{
                            fontSize: "14px",
                            lineHeight: 1.6,
                            marginBottom: "32px",
                        }}
                    >
                        Данный раздел сайта ограничен вашей текущей ролью в системе.
                    </p>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={() => router.back()}
                            className="text"
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--secondary-link-c)",
                                fontSize: "14px",
                                padding: "12px 8px",
                                transition: "opacity 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "0.7";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                            }}
                        >
                            ← Назад
                        </button>

                        <Button
                            title="Сменить аккаунт"
                            color="btn-blue"
                            onClick={() => router.push("/login")}
                            style={{ padding: "12px 24px" }}
                        />
                    </div>

                    <div
                        style={{
                            marginTop: "32px",
                            paddingTop: "24px",
                            borderTop: "1px solid var(--secondary-border-c)",
                            textAlign: "center",
                        }}
                    >
                        <p className="text-blind" style={{ fontSize: "12px" }}>
                            Московский Политехнический Университет
                            <br />
                            Система проверки остаточных знаний
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
