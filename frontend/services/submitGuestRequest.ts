import { NEXT_PUBLIC_MODE } from "@/config";

const mode = NEXT_PUBLIC_MODE;

// TODO: заменить на настоящую реализацию отправки заявки гостя, когда
// backend-команда согласует эндпоинт для приёма заявок на роль.
export async function submitGuestRequest(roleCode: string): Promise<void> {
    if (mode === "development") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
    }
    throw new Error(`Заменить на настоящую реализацию отправки заявки гостя (роль: ${roleCode})`);
}
