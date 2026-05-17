"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserStatus, UserStatusResponse } from "@/services/getUserStatus";

export default function LprList() {
    const [userStatus, setUserStatus] = useState<UserStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const status = await getUserStatus();
                setUserStatus(status);
                    
                if (status.status === 'teacher') {
                    router.push('/teacher/main');
                } else if (status.status === 'hod') {
                    router.push('/hod/statistics');
                } else if (status.status === 'lpr') {
                    router.push('/lpr/statistics');
                } else {
                    return <></>
                }
            } catch (error) {
                router.push('/csh/login');
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
}