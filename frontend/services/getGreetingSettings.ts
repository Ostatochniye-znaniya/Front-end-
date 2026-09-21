import { NEXT_PUBLIC_MODE } from "@/config";

const mode = NEXT_PUBLIC_MODE;

export interface GreetingSettings {
    welcomeText: string;
    contactEmail: string;
}

// Текст приветствия и почта администрации настраиваются в админке.
// TODO: заменить на настоящую реализацию запроса к API админки, когда
// разработчики админки согласуют эндпоинт для этих настроек.
export async function getGreetingSettings(): Promise<GreetingSettings> {
    if (mode === "development") {
        return Promise.resolve({
            welcomeText:
                "Добро пожаловать в систему проверки остаточных знаний Московского Политеха!\n\n" +
                "Здесь вы можете подать заявку на получение доступа к сервису в качестве студента, " +
                "преподавателя или представителя администрации. Выберите нужную роль внизу страницы " +
                "и отправьте заявку — после проверки администрацией вам откроют доступ к личному кабинету.",
            contactEmail: "kd-support@mospolytech.ru",
        });
    }
    throw new Error("Заменить на настоящую реализацию получения настроек приветствия");
}
