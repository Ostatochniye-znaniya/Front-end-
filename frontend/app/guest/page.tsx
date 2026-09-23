"use client";

import { useEffect, useState } from "react";
import { Handshake, Mail, Send } from "lucide-react";

import Dropdown from "@/components/dropdown/Dropdown";
import Button from "@/components/button/Button";
import Capsule from "@/components/capsule/Capsule";
import MiniAlert from "@/components/alert/MiniAlert";

import { getWelcomeText } from "@/services/getWelcomeText";
import { getAdminEmail } from "@/services/getAdminEmail";
import { getRoles, RoleOption } from "@/services/getRoles";
import { submitGuestRequest } from "@/services/submitGuestRequest";

type AlertState = { type: "success" | "error"; text: string };

export default function GuestGreetingPage() {
    const [welcomeText, setWelcomeText] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
    const [selectedRole, setSelectedRole] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<AlertState | null>(null);

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const [text, roles] = await Promise.all([
                    getWelcomeText(),
                    getRoles(),
                ]);
                if (!mounted) return;
                setWelcomeText(text);
                setRoleOptions(roles);
            } catch (err) {
                if (!mounted) return;
                setAlert({
                    type: "error",
                    text: err instanceof Error ? err.message : "Не удалось загрузить данные страницы",
                });
            } finally {
                if (mounted) setLoading(false);
            }
        }

        // Почта администрации — ручка ещё не реализована на бэке (см.
        // getAdminEmail.ts), поэтому грузится отдельно от остального: её
        // отсутствие не должно блокировать загрузку страницы или показывать
        // общий алерт об ошибке.
        getAdminEmail()
            .then((email) => {
                if (mounted) setContactEmail(email);
            })
            .catch(() => {});

        load();
        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async () => {
        if (!selectedRole) {
            setAlert({ type: "error", text: "Выберите роль перед отправкой заявки" });
            return;
        }
        setSubmitting(true);
        setAlert(null);
        try {
            await submitGuestRequest(selectedRole);
            setAlert({
                type: "success",
                text: "Заявка отправлена. Администрация свяжется с вами по указанной почте.",
            });
        } catch (err) {
            setAlert({
                type: "error",
                text: err instanceof Error ? err.message : "Не удалось отправить заявку",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="main-container">
            <div className="p-block-header">
                <h1 className="text-bold">Приветствие</h1>
            </div>

            <div className="guest-greeting-card">
                <div className="guest-greeting-icon">
                    <Handshake size={28} />
                </div>
                <p className="guest-greeting-text">
                    {loading ? "Загрузка..." : welcomeText}
                </p>
            </div>

            <div className="guest-contact-block">
                <p className="text">Вы можете связаться с администрацией по почте:</p>
                {contactEmail && (
                    <a href={`mailto:${contactEmail}`} className="guest-contact-link">
                        <Capsule variant="info" icon={<Mail size={14} />}>
                            {contactEmail}
                        </Capsule>
                    </a>
                )}
            </div>

            {alert && (
                <div className="guest-alert-wrap">
                    <MiniAlert type={alert.type} text={alert.text} />
                </div>
            )}

            <div className="guest-submit-row">
                <div className="guest-role-dropdown">
                    <Dropdown
                        options={roleOptions}
                        value={selectedRole}
                        onChange={setSelectedRole}
                        placeholder="Выберите роль"
                        label="Роль"
                        openUpward
                    />
                </div>
                <Button
                    color="btn-blue"
                    onClick={handleSubmit}
                    disabled={submitting || loading}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                    <Send size={16} />
                    <span>{submitting ? "Отправка..." : "Отправить заявку"}</span>
                </Button>
            </div>
        </div>
    );
}
