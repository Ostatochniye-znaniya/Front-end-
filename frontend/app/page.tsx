"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserStatus } from "@/services/getUserStatus";
import { redirectToLoginPage, isAuthenticated } from "@/api/client";

export default function LprList() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const hasSession = typeof window !== 'undefined' && isAuthenticated();

        if (!hasSession) {
            redirectToLoginPage(router);
            return;
        }

        const fetchUserRole = async () => {
            try {
                const status = await getUserStatus();

                if (status.status === 'teacher') {
                    router.push('/teacher/main');
                } else if (status.status === 'hod') {
                    router.push('/hod/statistics');
                } else if (status.status === 'lpr') {
                    router.push('/lpr/statistics');
                } else if (status.status === 'guest') {
                    router.push('/guest');
                } else {
                    router.push('/teacher/main');
                }
            } catch (error) {
                console.warn("Ошибка проверки статуса пользователя, перенаправление на страницу входа:", error);
                redirectToLoginPage(router);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRole();
    }, [router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div>Загрузка...</div>
            </div>
        );
    }

    return null;
}