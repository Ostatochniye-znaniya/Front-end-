"use client";

import { CheckCircle, AlertCircle, Info } from "lucide-react";

type MiniAlertType = "success" | "error" | "info";

interface MiniAlertProps {
    type?: MiniAlertType;
    text: string;
}

const styles = {
    success: {
        background: "#ecfdf3",
        color: "#067647",
        border: "#a6f4c5",
        icon: <CheckCircle size={16} />,
    },
    error: {
        background: "#fef3f2",
        color: "#b42318",
        border: "#fecdca",
        icon: <AlertCircle size={16} />,
    },
    info: {
        background: "#eff8ff",
        color: "#175cd3",
        border: "#b2ddff",
        icon: <Info size={16} />,
    },
};

export default function MiniAlert({
    type = "info",
    text,
}: MiniAlertProps) {
    const current = styles[type];

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "12px",
                background: current.background,
                color: current.color,
                border: `1px solid ${current.border}`,
                fontSize: "13px",
                fontWeight: 500,
                animation: "slideDown 0.25s ease",
            }}
        >
            {current.icon}
            <span>{text}</span>
        </div>
    );
}