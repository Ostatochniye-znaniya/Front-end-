"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/modal/Modal";
import Button from "@/components/button/Button";
import {
    getAvailableDisciplines,
    saveGroupDisciplines,
    type Discipline,
    type DisciplineGroupRow,
} from "@/services/disciplines";

interface EditDisciplinesModalProps {
    group: DisciplineGroupRow;
    onClose: () => void;
    /** Вызывается после успешного сохранения (страница обновляет список). */
    onSaved: () => void;
}

const sameSelection = (a: number[], b: number[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * Модалка «Редактирование списка дисциплин» для одной группы.
 * Рендерится только пока открыта — состояние сбрасывается при каждом открытии.
 */
export default function EditDisciplinesModal({ group, onClose, onSaved }: EditDisciplinesModalProps) {
    const initialIds = group.disciplines.map(d => d.id);

    const [available, setAvailable] = useState<Discipline[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAvailableDisciplines(group.id)
            .then(list => {
                if (!cancelled) setAvailable(list);
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : "Не удалось загрузить список дисциплин");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [group.id]);

    const maxDisciplines = group.maxDisciplines;
    const limitReached = selectedIds.length >= maxDisciplines;
    const changed = !sameSelection(selectedIds, initialIds);

    const toggle = (id: number) => {
        setSaveError(null);
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= maxDisciplines) return prev;
            return [...prev, id];
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            await saveGroupDisciplines(group.id, selectedIds);
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
                    Редактирование списка дисциплин
                    <span className="modal-subtitle">Группа {group.group}</span>
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
                        disabled={saving || !changed}
                        onClick={handleSave}
                    />
                </>
            }
        >
            <p className="discipline-counter">
                Выбрано {selectedIds.length} из {maxDisciplines}
            </p>

            {loadError && <p className="modal-error">{loadError}</p>}
            {!loadError && !available && <p className="discipline-counter">Загрузка...</p>}

            {available && (
                <div className="discipline-options-wrapper">
                    <table className="table-container discipline-options">
                        <thead>
                            <tr>
                                <th>Дисциплина</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {available.map(d => {
                                const selected = selectedIds.includes(d.id);
                                return (
                                    <tr key={d.id} className={selected ? "discipline-row-selected" : undefined}>
                                        <td>{d.name}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className={`discipline-action${selected ? " discipline-action-remove" : ""}`}
                                                disabled={!selected && limitReached}
                                                onClick={() => toggle(d.id)}
                                            >
                                                {selected ? "Убрать" : "Добавить"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {saveError && <p className="modal-error">{saveError}</p>}
        </Modal>
    );
}
