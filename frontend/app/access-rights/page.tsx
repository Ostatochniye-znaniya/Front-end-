"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Table, { Column } from "@/components/table/Table";
import Search from "@/components/search/Search";
import Dropdown from "@/components/dropdown/Dropdown";
import Pagination from "@/components/pagination/Pagination";
import Alert from "@/components/alert/Alert";
import { EmployeeCardModal } from "@/components/access-rights/EmployeeCardModal";
import { RoleEditModal } from "@/components/access-rights/RoleEditModal";
import { PrintedFormsModal } from "@/components/access-rights/PrintedFormsModal";
import {
  fetchRoles,
  fetchUsersAccessList,
  RoleItem,
  UserAccessItem,
} from "@/services/accessRights";
import { Loader2 } from "lucide-react";

export default function AccessRightsPage() {
  const [users, setUsers] = useState<UserAccessItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Поиск и фильтрация
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("-1");

  // Пагинация (1-индексированная)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Уведомления
  const [notification, setNotification] = useState<{
    id: number;
    type: "success" | "error" | "info" | "warning";
    title: string;
    text: string;
  } | null>(null);

  const showNotification = useCallback(
    (title: string, text: string, type: "success" | "error" | "info" | "warning" = "info") => {
      setNotification({
        id: Date.now(),
        type,
        title,
        text,
      });
    },
    []
  );

  // Автозакрытие уведомления
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Загрузка начальных данных
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([
        fetchRoles(),
        fetchUsersAccessList(),
      ]);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (err: any) {
      console.error("Ошибка загрузки данных:", err);
      showNotification("Ошибка", "Не удалось загрузить данные пользователей", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Сброс на 1 страницу при изменении поиска или фильтра
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedRoleId]);

  // Опции для селекта ролей
  const roleDropdownOptions = useMemo(() => {
    const defaultOption = [{ value: "-1", label: "Все роли" }];
    const dynamicOptions = roles.map((r) => ({
      value: String(r.id),
      label: r.roleName,
    }));
    return [...defaultOption, ...dynamicOptions];
  }, [roles]);

  // Фильтрация списка пользователей
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Поиск по ФИО или Email
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.facultyName && u.facultyName.toLowerCase().includes(q))
      );
    }

    // Фильтрация по роли
    const roleIdNum = Number(selectedRoleId);
    if (roleIdNum !== -1) {
      result = result.filter((u) =>
        u.roles.some((r) => r.roleId === roleIdNum)
      );
    }

    return result;
  }, [users, searchValue, selectedRoleId]);

  // Пагинация
  const totalPages = Math.max(1, Math.ceil(processedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedUsers.slice(start, start + pageSize);
  }, [processedUsers, currentPage, pageSize]);

  // Обработчик обновления ролей пользователя
  const handleUserRolesUpdated = (userId: number, updatedRoleIds: number[]) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === userId) {
          const updatedRoles = updatedRoleIds
            .map((rId) => {
              const foundRole = roles.find((r) => r.id === rId);
              return foundRole
                ? { roleId: foundRole.id, roleName: foundRole.roleName }
                : null;
            })
            .filter(Boolean) as { roleId: number; roleName: string }[];

          return {
            ...u,
            roles: updatedRoles,
          };
        }
        return u;
      })
    );
  };

  // Колонки таблицы
  const tableColumns: Column<UserAccessItem>[] = useMemo(
    () => [
      {
        header: "ФИО",
        accessor: (u: UserAccessItem) => (
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--secondary-font-c)" }}>
            {u.name}
          </span>
        ),
        sortFn: (a: UserAccessItem, b: UserAccessItem) => a.name.localeCompare(b.name, "ru"),
        style: { textAlign: "left", width: "26%", minWidth: "220px" },
      },
      {
        header: "Должность / Подразделение",
        accessor: (u: UserAccessItem) => (
          <span style={{ fontSize: "13px", color: "var(--secondary-font-c)", opacity: 0.85 }}>
            {u.facultyName || u.position || "Московский Политех"}
          </span>
        ),
        style: { textAlign: "left", width: "22%", minWidth: "180px" },
      },
      {
        header: "Email",
        accessor: (u: UserAccessItem) => (
          <span style={{ fontSize: "13px", color: "var(--secondary-font-c)", opacity: 0.9 }}>
            {u.email || "—"}
          </span>
        ),
        style: { textAlign: "left", width: "20%", minWidth: "180px" },
      },
      {
        header: "Роль в системе",
        accessor: (u: UserAccessItem) => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            {u.roles && u.roles.length > 0 ? (
              u.roles.map((r) => (
                <span
                  key={r.roleId}
                  style={{
                    backgroundColor: "var(--tag-bg-default-c)",
                    color: "var(--secondary-font-c)",
                    border: "1px solid var(--accent-blue-c)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-blue-c)",
                    }}
                  />
                  {r.roleName}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "13px", opacity: 0.5, fontStyle: "italic" }}>—</span>
            )}
          </div>
        ),
        style: { textAlign: "left", width: "24%", minWidth: "230px" },
      },
      {
        header: "Действия",
        accessor: (u: UserAccessItem) => (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <EmployeeCardModal user={u} />
            <RoleEditModal
              user={u}
              allRoles={roles}
              onRolesUpdated={handleUserRolesUpdated}
              onNotification={(msg, type) =>
                showNotification(
                  type === "success" ? "Успешно" : "Ошибка",
                  msg,
                  type
                )
              }
            />
          </div>
        ),
        style: { textAlign: "center", width: "8%", minWidth: "90px" },
      },
    ],
    [roles, showNotification]
  );

  return (
    <div className="main-container">
      {/* Toast Alert */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "32px",
            zIndex: 10000,
            transition: "all 0.3s ease",
          }}
        >
          <Alert
            key={notification.id}
            type={notification.type}
            title={notification.title}
            text={notification.text}
          />
        </div>
      )}

      {/* Header Block */}
      <div
        className="p-block-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 className="text-bold" style={{ fontSize: "24px", margin: 0 }}>
            Справочник прав доступа
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "13px",
              color: "var(--secondary-lock-font-c)",
            }}
          >
            Управление ролями и правами пользователей образовательного портала
          </p>
        </div>
        <div>
          <PrintedFormsModal
            users={processedUsers}
            onNotification={(msg, type) =>
              showNotification(
                type === "success" ? "Успешно" : "Ошибка",
                msg,
                type
              )
            }
          />
        </div>
      </div>

      {/* Controls Block: Search & Filter */}
      <div
        className="p-block-with-padding"
        style={{
          padding: "8px 0 20px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 340px", minWidth: "260px" }}>
            <Search
              hint="Поиск по ФИО или Email..."
              value={searchValue}
              onChange={setSearchValue}
              size="large"
            />
          </div>

          <div style={{ width: "300px", flexShrink: 0 }}>
            <Dropdown
              options={roleDropdownOptions}
              value={selectedRoleId}
              onChange={(val) => {
                setSelectedRoleId(val);
                const roleObj = roleDropdownOptions.find((o) => o.value === val);
                if (roleObj) {
                  showNotification("Фильтр ролей", `Выбрано: ${roleObj.label}`, "info");
                }
              }}
              placeholder="Все роли"
              label="Фильтр по роли"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ position: "relative", minHeight: "360px" }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(2px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Loader2 size={32} className="animate-spin text-[var(--accent-blue-c)]" />
              <span style={{ fontSize: "14px", fontWeight: 600, opacity: 0.85 }}>
                Загрузка данных сотрудников...
              </span>
            </div>
          </div>
        )}

        {paginatedUsers.length === 0 && !isLoading ? (
          <div
            className="table-wrapper"
            style={{
              padding: "48px 16px",
              textAlign: "center",
              opacity: 0.65,
              fontSize: "14px",
            }}
          >
            {searchValue || selectedRoleId !== "-1"
              ? "По вашему запросу ничего не найдено"
              : "Нет данных для отображения"}
          </div>
        ) : (
          <Table<UserAccessItem>
            columns={tableColumns}
            data={paginatedUsers}
          />
        )}
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "13px", opacity: 0.65 }}>
          Показано {paginatedUsers.length} из {processedUsers.length} сотрудников
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
