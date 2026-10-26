"use client";

import Button from "@/components/button/Button";
import MiniAlert from "@/components/alert/MiniAlert";
import CreateOrderModal from "@/components/orders/CreateOrderModal";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import Search from "@/components/search/Search";
import Table, { type Column } from "@/components/table/Table";
import SegmentedToggle from "@/components/toggle/SegmentedToggle";
import {
  createOrder, formatOrderAcademicYear, formatOrderDate, formatOrderSemester, getOrders,
  type OrderEssentials, type OrderStatus,
} from "@/services/orders";
import { matchesOrderNumber } from "@/services/orderForm";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

const ORDER_TABS = [
  { value: "orders", label: "Приказы" },
  { value: "drafts", label: "Черновики" },
];

const orderColumns: Column<OrderEssentials>[] = [
  { header: "№", accessor: (order) => order.number ?? "Без номера" },
  { header: "Название", accessor: "name" },
  { header: "Учебный год", accessor: (order) => formatOrderAcademicYear(order.semester) },
  { header: "Семестр", accessor: (order) => formatOrderSemester(order.semester) },
  { header: "Начало тестирования", accessor: (order) => formatOrderDate(order.testingStartDate) },
  { header: "Окончание тестирования", accessor: (order) => formatOrderDate(order.testingEndDate) },
];

export default function LprOrderPage() {
  const [searchValue, setSearchValue] = useState("");
  const [showOrders, setShowOrders] = useState(true);
  const activeStatus: OrderStatus = showOrders ? "issued" : "draft";
  const [selectedOrder, setSelectedOrder] = useState<OrderEssentials | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orders, setOrders] = useState<OrderEssentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const closeOrderDetails = useCallback(() => setSelectedOrder(null), []);
  const closeCreateModal = useCallback(() => setIsCreateOpen(false), []);

  useEffect(() => {
    const controller = new AbortController();
    void getOrders(controller.signal, activeStatus).then((result) => {
      if (!controller.signal.aborted) setOrders(result);
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Не удалось загрузить приказы");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reloadVersion, activeStatus]);

  const refreshOrders = () => {
    setLoading(true);
    setError(null);
    setReloadVersion((version) => version + 1);
  };

  const handleCreated = (status: OrderStatus) => {
    setIsCreateOpen(false);
    setShowOrders(status === "issued");
    setSearchValue("");
    setNotice(status === "draft" ? "Черновик успешно сформирован" : "Приказ успешно сформирован");
    // Создание уже завершилось. Ошибка последующего GET не должна предлагать создать дубликат.
    refreshOrders();
  };

  const changeTab = (value: string) => {
    const nextShowOrders = value === "orders";
    if (nextShowOrders === showOrders) return;
    setShowOrders(nextShowOrders);
    setLoading(true);
    setError(null);
    setNotice(null);
  };

  const filteredOrders = useMemo(
    () => orders.filter((order) => order.status === activeStatus && matchesOrderNumber(order.number, searchValue)),
    [orders, searchValue, activeStatus],
  );

  return (
    <div className="main-container">
      {selectedOrder && <OrderDetailsModal key={selectedOrder.id} order={selectedOrder} onClose={closeOrderDetails}
        onSigned={(issued) => {
          setSelectedOrder(issued); setShowOrders(true); setSearchValue("");
          setNotice(`Приказ № ${issued.number} подписан`); refreshOrders();
        }} />}
      {isCreateOpen && <CreateOrderModal onClose={closeCreateModal} onSubmit={createOrder} onCreated={handleCreated} />}
      <div className={`p-block-header ${styles.header}`}>
        <h1 className="text-bold">{showOrders ? "Приказы" : "Черновики"}</h1>
        <Button title={loading ? "Загрузка..." : "Обновить список"} color="btn-blue"
          disabled={loading} onClick={refreshOrders} />
        <Button
          title="Сформировать новый приказ"
          color="btn-blue"
          onClick={() => setIsCreateOpen(true)}
        />
      </div>

      {notice && <div className="p-block-with-padding" role="status">
        <MiniAlert type="success" text={notice} />
      </div>}
      {error && <div className="p-block-with-padding" role="alert">
        <MiniAlert type="error" text={error} />
      </div>}

      <div className={`p-block-with-padding ${styles.tabs}`}>
        <SegmentedToggle
          options={ORDER_TABS}
          value={showOrders ? "orders" : "drafts"}
          onChange={changeTab}
        />
      </div>

      <div className="p-block-with-padding">
        <Search
          hint="Поиск по номеру приказа"
          label="Поиск по номеру приказа"
          value={searchValue}
          onChange={setSearchValue}
          size="large"
        />
      </div>

      {loading ? (
        <div className="p-block-with-padding text" role="status">Загрузка документов...</div>
      ) : error && orders.length === 0 ? null : filteredOrders.length === 0 ? (
        <div className="p-block-with-padding text">
          {searchValue.trim()
            ? "По вашему запросу ничего не найдено"
            : showOrders ? "Приказов пока нет" : "Черновиков пока нет"}
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
