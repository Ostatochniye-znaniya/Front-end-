import { api } from "@/api/client";
import { RoleDto } from "@/api/types";
import { NEXT_PUBLIC_MODE } from "@/config";

const mode = NEXT_PUBLIC_MODE;

export interface RoleOption {
    value: string;
    label: string;
}

const GUEST_ROLE_MARKERS = ["guest", "гость"];

const isGuestRole = (role: RoleDto): boolean => {
    const marker = (role.code || role.name || "").toString().trim().toLowerCase();
    return GUEST_ROLE_MARKERS.includes(marker);
};

const mapRoles = (roles: RoleDto[]): RoleOption[] =>
    roles
        .filter((role) => !isGuestRole(role))
        .map((role) => ({
            value: String(role.code ?? role.id ?? role.name),
            label: role.name ?? role.code ?? String(role.id),
        }));

const mockRoles: RoleDto[] = [
    { id: 1, code: "student", name: "Студент" },
    { id: 2, code: "teacher", name: "Преподаватель" },
    { id: 3, code: "hod", name: "Заведующий кафедрой" },
    { id: 4, code: "lpr", name: "Лицо, принимающее решения" },
    { id: 5, code: "guest", name: "Гость" },
];

// Список ролей приходит с ручки /Role/GetRoles. Роль "Гость" исключается из
// вариантов выбора — гость подаёт заявку на другую роль, а не на свою текущую.
export async function getRoles(): Promise<RoleOption[]> {
    if (mode === "development") {
        return Promise.resolve(mapRoles(mockRoles));
    }
    const roles = await api.get<RoleDto[]>("/Role/GetRoles");
    return mapRoles(roles);
}
