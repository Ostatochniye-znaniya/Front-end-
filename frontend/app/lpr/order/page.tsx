"use client";

import Button from "@/components/button/Button";
import CreateOrderModal from "@/components/orders/CreateOrderModal";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import Search from "@/components/search/Search";
import Table, { type Column } from "@/components/table/Table";
import type { OrderEssentials } from "@/services/orders";
import { matchesOrderNumber } from "@/services/orderForm";
import { useCallback, useMemo, useState } from "react";
import styles from "./page.module.css";

// Только статические строки для просмотра вёрстки; эти ID не используются в API.
const STATIC_ORDERS: OrderEssentials[] = [
  {
    id: "visual-order-1", number: "142-У",
    name: "О проведении анкетирования и проверки остаточных знаний",
    academicYear: 2026, semester: 2,
  },
  {
    id: "visual-order-2", number: "68-У",
    name: "О проведении проверки остаточных знаний студентов",
    academicYear: 2026, semester: 1,
  },
  {
    id: "visual-order-3", number: "131-У",
    name: "О проведении анкетирования студентов",
    academicYear: 2025, semester: 2,
  },
];

const orderColumns: Column<OrderEssentials>[] = [
  { header: "№", accessor: "number" },
  { header: "Название", accessor: "name" },
  { header: "Учебный год", accessor: "academicYear" },
  { header: "Семестр", accessor: "semester" },
];

export default function LprOrderPage() {
  const [searchValue, setSearchValue] = useState("");
  const [showOrders, setShowOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderEssentials | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const closeOrderDetails = useCallback(() => setSelectedOrder(null), []);
  const closeCreateModal = useCallback(() => setIsCreateOpen(false), []);

  const filteredOrders = useMemo(
    () => STATIC_ORDERS.filter((order) => matchesOrderNumber(order.number, searchValue)),
    [searchValue],
  );

  return (
    <div className="main-container">
      {selectedOrder && <OrderDetailsModal key={selectedOrder.id} order={selectedOrder} onClose={closeOrderDetails} />}
      {isCreateOpen && <CreateOrderModal onClose={closeCreateModal} />}
      <div className={`p-block-header ${styles.header}`}>
        <h1 className="text-bold">{showOrders ? "Приказы" : "Черновики"}</h1>
        <Button
          title="Сформировать новый приказ"
          color="btn-blue"
          onClick={() => setIsCreateOpen(true)}
        />
        <Button
          title={showOrders ? "Черновики" : "Приказы"}
          color="btn-purple"
          onClick={() => setShowOrders((current) => !current)}
        />
      </div>

      {showOrders && <div className="p-block-with-padding">
        <Search
          hint="Поиск по номеру приказа"
          label="Поиск по номеру приказа"
          value={searchValue}
          onChange={setSearchValue}
          size="large"
        />
      </div>}

      {!showOrders ? (
        <div className="p-block-with-padding text">
          Работа с черновиками пока не подключена к API.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-block-with-padding text">
          {searchValue.trim()
            ? "По вашему запросу ничего не найдено"
            : "Приказов пока нет"}
        </div>
      ) : (
        <div className="table-wrapper">
          <Table<OrderEssentials>
            columns={orderColumns}
            data={filteredOrders}
            onRowClick={setSelectedOrder}
          />
        </div>
      )}
    </div>
  );
}
