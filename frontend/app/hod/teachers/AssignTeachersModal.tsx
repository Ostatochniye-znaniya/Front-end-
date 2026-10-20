"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/modal/Modal";
import Button from "@/components/button/Button";
import CheckBox from "@/components/checkbox/CheckBox";
import {
    getAvailableTeachers,
    saveTeacherAssignments,
    type AvailableTeacher,
    type DepartmentTesting,
} from "@/services/teacherAssignments";

interface AssignTeachersModalProps {
    testing: DepartmentTesting;
    onClose: () => void;
    /** Вызывается после успешного сохранения (страница обновляет список). */
    onSaved: () => void;
}

const sameIds = (a: number[], b: number[]) =>
    a.length === b.length && [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();

/**
 * Модалка «Назначение преподавателей»: период проверки и преподаватели дисциплины.
 * Дату и пару внутри периода потом выбирает сам преподаватель.
 * Рендерится только пока открыта — состояние сбрасывается при каждом открытии.
 */
export default function AssignTeachersModal({ testing, onClose, onSaved }: AssignTeachersModalProps) {
    const initialIds = testing.teachers.map(t => t.teacherId);

    const [available, setAvailable] = useState<AvailableTeacher[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [periodStart, setPeriodStart] = useState(testing.periodStart ?? "");
    const [periodEnd, setPeriodEnd] = useState(testing.periodEnd ?? "");
    const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAvailableTeachers(testing.testingId)
            .then(list => {
                if (!cancelled) setAvailable(list);
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : "Не удалось загрузить преподавателей");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [testing.testingId]);

    const periodChanged =
        periodStart !== (testing.periodStart ?? "") || periodEnd !== (testing.periodEnd ?? "");
    const changed = periodChanged || !sameIds(selectedIds, initialIds);
    const periodInvalid = !!periodStart && !!periodEnd && periodEnd < periodStart;
    const canSave =
        changed && !!periodStart && !!periodEnd && !periodInvalid && selectedIds.length > 0 && !saving;

    const toggle = (id: number) => {
        setSaveError(null);
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            await saveTeacherAssignments(testing.testingId, periodStart, periodEnd, selectedIds);
            onSaved();
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Не удалось сохранить");
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={
                <>
                    Назначение преподавателей
                    <span className="modal-subtitle">
                        {testing.groupName} · {testing.disciplineName}
                    </span>
                </>
            }
            footer={
                <>
                    <button type="button" className="modal-cancel" onClick={onClose}>
                        Отмена
                    </button>
                    <Button
                        title={saving ? "Сохранение..." : "Сохранить"}
                        color="btn-blue"
                        disabled={!canSave}
                        onClick={handleSave}
                    />
                </>
            }
        >
            <p className="assign-section-title">Период проверки</p>
            <p className="assign-hint">Дату и пару внутри периода выберет преподаватель.</p>
            <div className="assign-period">
                <label className="assign-period-field">
                    <span>с</span>
                    <input
                        className="input-field"
                        type="date"
                        value={periodStart}
                        max={periodEnd || undefined}
                        onChange={e => {
                            setSaveError(null);
                            setPeriodStart(e.target.value);
                        }}
                    />
                </label>
                <label className="assign-period-field">
                    <span>по</span>
                    <input
                        className="input-field"
                        type="date"
                        value={periodEnd}
                        min={periodStart || undefined}
                        onChange={e => {
                            setSaveError(null);
                            setPeriodEnd(e.target.value);
                        }}
                    />
                </label>
            </div>
            {periodInvalid && <p className="modal-error">Конец периода раньше начала</p>}
            {periodChanged && testing.scheduledDate && (
                <p className="assign-warning">
                    При изменении периода выбранное преподавателем время сбросится, и его нужно будет выбрать заново.
                </p>
            )}

            <p className="assign-section-title">Преподаватели</p>
            {loadError && <p className="modal-error">{loadError}</p>}
            {!loadError && !available && <p className="assign-hint">Загрузка...</p>}
            {available && available.length === 0 && (
                <p className="assign-hint">К дисциплине не привязан ни один преподаватель.</p>
            )}
            {available && available.length > 0 && (
                <div className="assign-teachers">
                    {available.map(t => (
                        <CheckBox
                            key={t.teacherId}
                            text={t.teacherName ?? `Преподаватель #${t.teacherId}`}
                            type="blue"
                            state={selectedIds.includes(t.teacherId)}
                            onChange={() => toggle(t.teacherId)}
                        />
                    ))}
                </div>
            )}
            {selectedIds.length === 0 && available && available.length > 0 && (
                <p className="assign-hint">Отметьте хотя бы одного преподавателя.</p>
            )}

            {saveError && <p className="modal-error">{saveError}</p>}
        </Modal>
    );
}
