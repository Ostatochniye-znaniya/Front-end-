"use client";

import React, { useState, useMemo } from 'react';
import Dropdown from '@/components/dropdown/Dropdown';
import Button from '@/components/button/Button';
import Capsule from '@/components/capsule/Capsule';
import Alert from '@/components/alert/Alert';
import {
  FacultyStat,
  DepartmentStat,
  initialFacultiesData,
  semesterOptions,
  calculateGroupNorm,
  initialTransitionCandidates,
  TransitionGroupCandidate
} from '@/components/statistics/statisticsData';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Building2,
  GitBranch
} from 'lucide-react';

export default function LprStatisticsPage() {
  const [selectedSemester, setSelectedSemester] = useState<string>('spring2025');
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({
    fit: true // по умолчанию ФИТ раскрыт для наглядности
  });

  // Состояние модального окна автоматического подбора групп для ЛПР
  const [isAutoPickOpen, setIsAutoPickOpen] = useState(false);
  const [candidates, setCandidates] = useState<TransitionGroupCandidate[]>(initialTransitionCandidates);
  const [autoPickAlert, setAutoPickAlert] = useState<string | null>(null);

  const currentSemesterObj = useMemo(() => {
    return semesterOptions.find(s => s.value === selectedSemester) || semesterOptions[1];
  }, [selectedSemester]);

  const isSpring = currentSemesterObj.isSpring;

  const toggleFaculty = (facultyId: string) => {
    setExpandedFaculties(prev => ({
      ...prev,
      [facultyId]: !prev[facultyId]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    initialFacultiesData.forEach(f => {
      all[f.id] = true;
    });
    setExpandedFaculties(all);
  };

  const collapseAll = () => {
    setExpandedFaculties({});
  };

  // Вычисляем показатели для конкретного факультета
  const getFacultyTotals = (faculty: FacultyStat) => {
    let profiles = 0;
    let groupNorm = 0;
    let groupFact = 0;
    let classNorm = 0;
    let classFact = 0;
    let eReportDone = 0;
    let eReportRemarks = 0;
    let pReportDone = 0;
    let pReportRemarks = 0;

    faculty.departments.forEach(dept => {
      profiles += dept.profilesCount;
      const deptNorm = calculateGroupNorm(dept.profilesCount, dept.coursesCount, isSpring, dept.magistracyCount);
      groupNorm += deptNorm;
      groupFact += dept.groupFact;
      classNorm += dept.classNorm;
      classFact += dept.classFact;
      eReportDone += dept.eReportDone;
      eReportRemarks += dept.eReportRemarks;
      pReportDone += dept.pReportDone;
      pReportRemarks += dept.pReportRemarks;
    });

    const diff = groupFact - groupNorm;
    const allPassed = diff >= 0 && eReportRemarks === 0 && pReportRemarks === 0;

    return {
      profiles,
      groupNorm,
      groupFact,
      diff,
      classNorm,
      classFact,
      eReportDone,
      eReportRemarks,
      pReportDone,
      pReportRemarks,
      allPassed
    };
  };

  // Суммарные показатели по всему университету
  const universityTotals = useMemo(() => {
    let profiles = 0;
    let groupNorm = 0;
    let groupFact = 0;
    let classNorm = 0;
    let classFact = 0;
    let eReportDone = 0;
    let eReportRemarks = 0;
    let pReportDone = 0;
    let pReportRemarks = 0;

    initialFacultiesData.forEach(f => {
      const totals = getFacultyTotals(f);
      profiles += totals.profiles;
      groupNorm += totals.groupNorm;
      groupFact += totals.groupFact;
      classNorm += totals.classNorm;
      classFact += totals.classFact;
      eReportDone += totals.eReportDone;
      eReportRemarks += totals.eReportRemarks;
      pReportDone += totals.pReportDone;
      pReportRemarks += totals.pReportRemarks;
    });

    const diff = groupFact - groupNorm;

    return {
      profiles,
      groupNorm,
      groupFact,
      diff,
      classNorm,
      classFact,
      eReportDone,
      eReportRemarks,
      pReportDone,
      pReportRemarks,
      allPassed: diff >= 0
    };
  }, [isSpring]);

  // Обработка выбора группы в мастере автоподбора
  const handleSelectGroup = (candidateId: string, group: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return { ...c, selectedGroup: group };
      }
      return c;
    }));
  };

  const handleApplyAutoPick = () => {
    const unselected = candidates.filter(c => c.needsManualSelection && !c.selectedGroup);
    if (unselected.length > 0) {
      alert(`Пожалуйста, выберите конкретную группу для профиля: ${unselected[0].profileName}`);
      return;
    }
    setAutoPickAlert(`Список групп на ${currentSemesterObj.label} успешно сформирован и передан в график тестирования!`);
    setIsAutoPickOpen(false);
  };

  return (
    <div className="main-container">
      {/* Шапка страницы ЛПР */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
              Статистика проверки остаточных знаний (ЛПР)
            </h1>
            <Capsule variant="info">Зона видимости: Университет / Факультеты</Capsule>
          </div>
          <p className="text text-blind" style={{ margin: 0 }}>
            Сводная картина по факультетам с возможностью детализации по подразделениям (кафедрам) и автоматическим подбором групп
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button
            title="Автоподбор групп на тестирование"
            color="btn-blue"
            onClick={() => setIsAutoPickOpen(true)}
          />
        </div>
      </div>

      {autoPickAlert && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="success" title="Группы подобраны" text={autoPickAlert} />
        </div>
      )}

      {/* Информационная плашка формулы расчета норматива */}
      <div
        style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="var(--accent-blue-c)" />
          <span className="text text-bold">Формула норматива групп:</span>
          <code
            style={{
              backgroundColor: 'var(--background-inner-main-element-c)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: 'var(--secondary-font-c)'
            }}
          >
            Норматив = Профили × 2 × Курсы {isSpring ? '(+1 для 1-го курса весной)' : ''} + Магистратура 2-й курс
          </code>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="text text-blind">Текущий семестр:</span>
            <Capsule variant={isSpring ? 'warning' : 'default'}>
              {currentSemesterObj.label}
            </Capsule>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="text text-blind">Всего по университету:</span>
            <span className="text text-bold">План: {universityTotals.groupNorm} гр.</span>
            <span className="text text-blind">|</span>
            <span className="text text-bold">Факт: {universityTotals.groupFact} гр.</span>
            <span className="text text-blind">|</span>
            <span className="text text-blind">Разница:</span>
            <Capsule variant={universityTotals.diff >= 0 ? 'success' : 'danger'}>
              {universityTotals.diff >= 0 ? `+${universityTotals.diff}` : universityTotals.diff}
            </Capsule>
          </div>
        </div>
      </div>

      {/* Панель фильтров и управления детализацией */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ width: '320px' }}>
          <Dropdown
            label="Период / Семестр"
            options={semesterOptions}
            value={selectedSemester}
            onChange={setSelectedSemester}
            placeholder="Выберите семестр"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            title="Раскрыть все кафедры"
            color="btn-blue"
            onClick={expandAll}
          />
          <Button
            title="Свернуть все"
            color="btn-orange"
            onClick={collapseAll}
          />
        </div>
      </div>

      {/* Таблица статистики ЛПР с детализацией по подразделениям */}
      <div className="table-wrapper">
        <table className="table-container" style={{ width: '100%', borderCollapse: 'separate' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: '280px' }}>Факультет / Подразделение</th>
              <th>Профилей</th>
              <th>По нормативу (План)</th>
              <th>По факту</th>
              <th>Разница (План/Факт)</th>
              <th>Занятий по плану</th>
              <th>Занятий по факту</th>
              <th>Эл. отчёты (Сдано/Замеч.)</th>
              <th>Бум. отчёты (Сдано/Замеч.)</th>
              <th>Всё сдано</th>
            </tr>
          </thead>
          <tbody>
            {initialFacultiesData.map(faculty => {
              const totals = getFacultyTotals(faculty);
              const isExpanded = !!expandedFaculties[faculty.id];

              return (
                <React.Fragment key={faculty.id}>
                  {/* Строка факультета (основная) */}
                  <tr
                    onClick={() => toggleFaculty(faculty.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'var(--secondary-divider-bg-c)' : undefined,
                      fontWeight: 600
                    }}
                  >
                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0,
                            color: 'var(--accent-blue-c)'
                          }}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <Building2 size={16} color="var(--accent-blue-c)" />
                        <span className="text-bold" style={{ fontSize: '14px' }}>
                          {faculty.code} — {faculty.name}
                        </span>
                        <span className="text text-blind" style={{ fontSize: '11px', fontWeight: 400 }}>
                          ({faculty.departments.length} каф.)
                        </span>
                      </div>
                    </td>
                    <td>{totals.profiles}</td>
                    <td><strong className="text-bold">{totals.groupNorm}</strong></td>
                    <td>{totals.groupFact}</td>
                    <td>
                      <Capsule variant={totals.diff >= 0 ? 'success' : 'danger'}>
                        {totals.diff >= 0 ? `+${totals.diff}` : totals.diff}
                      </Capsule>
                    </td>
                    <td>{totals.classNorm}</td>
                    <td>{totals.classFact}</td>
                    <td>
                      <span className="text text-bold">{totals.eReportDone}</span>
                      {totals.eReportRemarks > 0 && (
                        <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '12px' }}>
                          ({totals.eReportRemarks})
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text text-bold">{totals.pReportDone}</span>
                      {totals.pReportRemarks > 0 && (
                        <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '12px' }}>
                          ({totals.pReportRemarks})
                        </span>
                      )}
                    </td>
                    <td>
                      <Capsule variant={totals.allPassed ? 'success' : 'danger'}>
                        {totals.allPassed ? 'Да' : 'Нет'}
                      </Capsule>
                    </td>
                  </tr>

                  {/* Дочерние строки (Детализация по кафедрам факультета) */}
                  {isExpanded && faculty.departments.map(dept => {
                    const deptNorm = calculateGroupNorm(dept.profilesCount, dept.coursesCount, isSpring, dept.magistracyCount);
                    const deptDiff = dept.groupFact - deptNorm;
                    const deptPassed = deptDiff >= 0 && dept.eReportRemarks === 0 && dept.pReportRemarks === 0;

                    return (
                      <tr
                        key={dept.id}
                        style={{
                          backgroundColor: 'var(--background-inner-main-element-c)',
                          fontSize: '13px'
                        }}
                      >
                        <td style={{ textAlign: 'left', paddingLeft: '40px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--secondary-lock-font-c)', fontFamily: 'monospace' }}>↳</span>
                            <span className="text" style={{ fontSize: '13px' }}>
                              {dept.name}
                            </span>
                          </div>
                        </td>
                        <td>{dept.profilesCount}</td>
                        <td>{deptNorm}</td>
                        <td>{dept.groupFact}</td>
                        <td>
                          <Capsule variant={deptDiff >= 0 ? 'success' : 'danger'}>
                            {deptDiff >= 0 ? `+${deptDiff}` : deptDiff}
                          </Capsule>
                        </td>
                        <td>{dept.classNorm}</td>
                        <td>{dept.classFact}</td>
                        <td>
                          <span>{dept.eReportDone}</span>
                          {dept.eReportRemarks > 0 && (
                            <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '11px' }}>
                              ({dept.eReportRemarks})
                            </span>
                          )}
                        </td>
                        <td>
                          <span>{dept.pReportDone}</span>
                          {dept.pReportRemarks > 0 && (
                            <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '11px' }}>
                              ({dept.pReportRemarks})
                            </span>
                          )}
                        </td>
                        <td>
                          <Capsule variant={deptPassed ? 'success' : 'danger'}>
                            {deptPassed ? 'Да' : 'Нет'}
                          </Capsule>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно мастера автоматического подбора групп для ЛПР */}
      {isAutoPickOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setIsAutoPickOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--background-c)',
              borderRadius: '16px',
              border: '1px solid var(--secondary-border-c)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              padding: '28px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={22} color="var(--accent-blue-c)" />
              <h2 className="title text-bold" style={{ fontSize: '18px', margin: 0 }}>
                Автоматический подбор групп на тестирование ({currentSemesterObj.label})
              </h2>
            </div>

            <p className="text text-blind" style={{ fontSize: '13px', margin: '0 0 18px 0', lineHeight: '1.4' }}>
              Алгоритм анализирует переход групп между курсами. Если данных предыдущего тестирования нет (1 курс) или на профиле сформировано несколько параллельных групп после 1-го курса, ЛПР делает утвердительный выбор.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {candidates.map(candidate => (
                <div
                  key={candidate.id}
                  style={{
                    backgroundColor: 'var(--background-main-element-c)',
                    border: '1px solid var(--secondary-border-c)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="text-bold" style={{ fontSize: '14px' }}>{candidate.profileName}</div>
                      <div className="text text-blind" style={{ fontSize: '12px', marginTop: '2px' }}>
                        Переход: {candidate.previousCourse} курс → {candidate.currentCourse} курс
                      </div>
                    </div>
                    {candidate.needsManualSelection ? (
                      <Capsule variant="warning" icon={<AlertTriangle size={13} />}>
                        Несколько групп — выбор ЛПР
                      </Capsule>
                    ) : (
                      <Capsule variant="success" icon={<CheckCircle size={13} />}>
                        Автоподбор (1 группа)
                      </Capsule>
                    )}
                  </div>

                  <p className="text text-blind" style={{ fontSize: '12px', margin: '0 0 10px 0' }}>
                    {candidate.autoReason}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="text text-bold" style={{ fontSize: '12px' }}>Доступные группы:</span>
                    {candidate.parallelGroups.map(grp => {
                      const isSelected = candidate.selectedGroup === grp;
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => handleSelectGroup(candidate.id, grp)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--accent-blue-c)' : '1px solid var(--secondary-border-c)',
                            backgroundColor: isSelected ? 'var(--accent-blue-bg-c)' : 'var(--background-inner-main-element-c)',
                            color: isSelected ? 'var(--accent-blue-c)' : 'var(--secondary-font-c)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {grp} {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                title="Отмена"
                color="btn-red"
                onClick={() => setIsAutoPickOpen(false)}
              />
              <Button
                title="Утвердить выбор и включить в график"
                color="btn-blue"
                onClick={handleApplyAutoPick}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
