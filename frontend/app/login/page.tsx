"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/button/Button";
import Input from "@/components/input/Input";
import MiniAlert from "@/components/alert/MiniAlert";

import {
    verifyCredentials,
    verifyCode,
    sendVerificationCode,
    setUserData,
    getUserData,
} from "@/api/auth";

import {
    redirectAfterLogin
} from "@/api/client";

type AuthStep = "credentials" | "code";

export default function LoginPage() {
    const router = useRouter();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [step, setStep] = useState<AuthStep>("credentials");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        setFadeIn(true);
    }, []);

    const startCountdown = (seconds: number) => {
        setCountdown(seconds);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleCredentialsSubmit = async () => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (!login.trim()) {
                throw new Error("Введите логин");
            }

            if (!password.trim()) {
                throw new Error("Введите пароль");
            }

            const user = await verifyCredentials({ login, password });

            if (user) {
                setUserData(login, user);
                await sendVerificationCode(login);
                startCountdown(60);
                setSuccessMessage("Код подтверждения отправлен на вашу почту");
                setStep("code");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка при входе");
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async () => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (!verificationCode.trim()) {
                throw new Error("Введите код подтверждения");
            }

            if (verificationCode.length !== 6) {
                throw new Error("Код должен состоять из 6 цифр");
            }

            const tokens = await verifyCode({
                login,
                code: verificationCode,
            });

            if (tokens) {
                setSuccessMessage("Вход выполнен успешно!");

                setTimeout(() => {
                    const userData = getUserData();
                    const getDefaultPathByRole = () => {
                        if (userData?.role === 'teacher') {
                            return "/csh/teacher/main";
                        } else if (userData?.role === 'student') {
                            return "/csh/student/main";
                        } else if (userData?.role === 'admin') {
                            return "/csh/admin/main";
                        }
                        return "/";
                    };
                    redirectAfterLogin(router, getDefaultPathByRole());
                }, 1000);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Неверный код подтверждения"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            await sendVerificationCode(login);
            startCountdown(60);
            setSuccessMessage("Код отправлен повторно");
        } catch {
            setError("Не удалось отправить код. Попробуйте позже");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setStep("credentials");
        setError(null);
        setSuccessMessage(null);
        setVerificationCode("");
        setCountdown(0);
        setPassword("");
    };

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
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "32px",
                        }}
                    >
                        <img
                            src="/csh/mpu_logo_l.png"
                            alt="Московский Политех"
                            className="theme-aware-logo"
                            style={{ height: "70px", width: "auto" }}
                        />
                    </div>

                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: "28px",
                        }}
                    >
                        <p
                            className="title"
                            style={{
                                fontSize: "24px",
                                marginBottom: "8px",
                                fontWeight: 700,
                            }}
                        >
                            {step === "credentials"
                                ? "Вход в систему"
                                : "Подтверждение входа"}
                        </p>

                        <p
                            className="text-blind"
                            style={{ fontSize: "14px" }}
                        >
                            {step === "credentials"
                                ? "Введите свои учетные данные"
                                : `Код отправлен на почту ${login}`}
                        </p>
                    </div>

                    {(error || successMessage) && (
                        <div style={{ marginBottom: "18px" }}>
                            {error && (
                                <MiniAlert type="error" text={error} />
                            )}

                            {successMessage && (
                                <MiniAlert
                                    type="success"
                                    text={successMessage}
                                />
                            )}
                        </div>
                    )}

                    {step === "credentials" && (
                        <>
                            <div style={{ marginBottom: "20px" }}>
                                <label
                                    className="text-bold"
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "14px",
                                    }}
                                >
                                    Логин
                                </label>

                                <Input
                                    hint="Введите ваш логин"
                                    value={login}
                                    onChange={setLogin}
                                    autoComplete="username"
                                />
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <label
                                    className="text-bold"
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "14px",
                                    }}
                                >
                                    Пароль
                                </label>

                                <Input
                                    hint="Введите пароль"
                                    value={password}
                                    onChange={setPassword}
                                    type="password"
                                    autoComplete="current-password"
                                />
                            </div>

                            <Button
                                title={loading ? "Проверка..." : "Войти"}
                                color="btn-blue"
                                onClick={handleCredentialsSubmit}
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    fontSize: "16px",
                                }}
                            />
                        </>
                    )}

                    {step === "code" && (
                        <>
                            <div style={{ marginBottom: "24px" }}>
                                <label
                                    className="text-bold"
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "14px",
                                    }}
                                >
                                    Код подтверждения
                                </label>

                                <Input
                                    hint="Введите 6-значный код"
                                    value={verificationCode}
                                    onChange={setVerificationCode}
                                />

                                <p
                                    className="text-blind"
                                    style={{
                                        fontSize: "12px",
                                        marginTop: "8px",
                                        textAlign: "center",
                                    }}
                                >
                                    Введите код из письма, отправленного на вашу
                                    почту
                                </p>
                            </div>

                            <Button
                                title={
                                    loading
                                        ? "Проверка кода..."
                                        : "Подтвердить"
                                }
                                color="btn-blue"
                                onClick={handleCodeSubmit}
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    fontSize: "16px",
                                    marginBottom: "16px",
                                }}
                            />

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "16px",
                                }}
                            >
                                <button
                                    onClick={handleBackToCredentials}
                                    className="text"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--secondary-link-c)",
                                        fontSize: "14px",
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

                                <button
                                    onClick={handleResendCode}
                                    disabled={countdown > 0}
                                    className="text"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor:
                                            countdown > 0
                                                ? "not-allowed"
                                                : "pointer",
                                        color:
                                            countdown > 0
                                                ? "var(--secondary-lock-font-c)"
                                                : "var(--secondary-link-c)",
                                        fontSize: "14px",
                                        transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (countdown === 0) {
                                            e.currentTarget.style.opacity = "0.7";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = "1";
                                    }}
                                >
                                    {countdown > 0
                                        ? `Отправить повторно через ${countdown}с`
                                        : "Отправить код повторно"}
                                </button>
                            </div>
                        </>
                    )}

                    <div
                        style={{
                            marginTop: "32px",
                            paddingTop: "24px",
                            borderTop:
                                "1px solid var(--secondary-border-c)",
                            textAlign: "center",
                        }}
                    >
                        <p
                            className="text-blind"
                            style={{ fontSize: "12px" }}
                        >
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