import { api } from "@/api/client";
import { NEXT_PUBLIC_MODE } from "@/config";

const mode = NEXT_PUBLIC_MODE;

// Ручка /GetAdminEmail возвращает почту администрации простой строкой.
// На бэке ещё не реализована (согласовано только название и тип
// ответа) — вызов в проде будет падать, пока её не добавят; в dev
// используется заглушка, чтобы страницу можно было смотреть локально.
export async function getAdminEmail(): Promise<string> {
    if (mode === "development") {
        return Promise.resolve("kd-support@mospolytech.ru");
    }
    return api.get<string>("/GetAdminEmail");
}
