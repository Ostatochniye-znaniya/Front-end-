"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Button from '@/components/button/Button';
import Capsule from '@/components/capsule/Capsule';
import { DisciplineStat } from '@/components/statistics/statisticsData';
import {
  getDepartmentStatisticsDetails,
  getStatisticsFilters,
  StatisticsSemesterOption,
} from '@/services/statistics';
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  GraduationCap
} from 'lucide-react';

export default function HodStatisticsPage() {
  const [semesters, setSemesters] = useState<StatisticsSemesterOption[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [disciplines, setDisciplines] = useState<DisciplineStat[]>([]);
  const [departmentName, setDepartmentName] = useState('Кафедра');
  const [facultyCode, setFacultyCode] = useState<string | null>(null);
  const [includePaper, setIncludePaper] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const filters = await getStatisticsFilters();
        if (cancelled) return;
        setSemesters(filters.semesters);
        if (filters.semesters.length > 0) {
          setSelectedSemester(String(filters.semesters[0].id));
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить семестры');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSemester) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await getDepartmentStatisticsDetails({
          semesterId: Number(selectedSemester),
        });
        if (cancelled) return;
        setDepartmentName(details.departmentName);
        setFacultyCode(details.facultyCode);
        setIncludePaper(details.requiresPaperReports);
        const mapped: DisciplineStat[] = details.disciplines.map(d => ({
          id: String(d.id),
          title: d.title,
          course: d.course,
          semester: d.semester,
          profilesCount: d.profilesCount,
          groupFact: d.groupFact,
          classNorm: d.classNorm,
          classFact: d.classFact,
          eReportDone: d.eReportDone,
          eReportRemarks: d.eReportRemarks,
          pReportDone: d.pReportDone,
          pReportRemarks: d.pReportRemarks,
          groups: d.groups.map(g => ({
            groupNumber: g.groupNumber,
            course: g.course,
            teacher: g.teacher,
            eReportStatus: g.eReportStatus,
            pReportStatus: g.pReportStatus,
            allPassed: g.allPassed,
          })),
        }));
        setDisciplines(mapped);
        setExpandedDisciplines(Object.fromEntries(mapped.slice(0, 2).map(d => [d.id, true])));
      } catch (err) {
        if (!cancelled) {
          setDisciplines([]);
          setError(err instanceof Error ? err.message : 'Не удалось загрузить статистику кафедры');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSemester]);

  const courseOptions = [
    { value: 'all', label: 'Все курсы' },
    { value: '2', label: '2 курс (Бакалавриат)' },
    { value: '3', label: '3 курс (Бакалавриат)' },
    { value: '4', label: '4 курс (Бакалавриат)' },
    { value: 'mag', label: '2 курс (Магистратура)' }
  ];

  const semesterOptions = useMemo(
    () => semesters.map(s => ({ value: String(s.id), label: s.label })),
    [semesters]
  );

  const toggleDiscipline = (id: string) => {
    setExpandedDisciplines(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    disciplines.forEach(d => { all[d.id] = true; });
    setExpandedDisciplines(all);
  };

  const collapseAll = () => {
    setExpandedDisciplines({});
  };

  const filteredDisciplines = useMemo(() => {
    return disciplines.filter(d => {
      if (courseFilter !== 'all') {
        if (courseFilter === 'mag' && !d.semester.toLowerCase().includes('маг')) return false;
        if (courseFilter !== 'mag' && String(d.course) !== courseFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesTeacher = d.groups.some(g => g.teacher.toLowerCase().includes(q));
        const matchesGroup = d.groups.some(g => g.groupNumber.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTeacher && !matchesGroup) return false;
      }
      return true;
    });
  }, [disciplines, courseFilter, searchQuery]);

  const departmentTotals = useMemo(() => {
    let groupNorm = 0;
    let groupFact = 0;
    let classNorm = 0;
    let classFact = 0;
    let eReportDone = 0;
    let eReportRemarks = 0;
    let pReportDone = 0;
    let pReportRemarks = 0;
    let totalDebt = 0;

    disciplines.forEach(d => {
      const dNorm = d.profilesCount * 2;
      groupNorm += dNorm;
      groupFact += d.groupFact;
      classNorm += d.classNorm;
      classFact += d.classFact;
      eReportDone += d.eReportDone;
      eReportRemarks += d.eReportRemarks;
      pReportDone += d.pReportDone;
      pReportRemarks += d.pReportRemarks;

      const eMissing = Math.max(0, d.classFact - d.eReportDone);
      const pMissing = includePaper ? Math.max(0, d.classFact - d.pReportDone) : 0;
      totalDebt += Math.max(eMissing, pMissing);
    });

    return {
      groupNorm,
      groupFact,
      classNorm,
      classFact,
      eReportDone,
      eReportRemarks,
      pReportDone,
      pReportRemarks,
      totalDebt,
      allPassed: totalDebt === 0
    };
  }, [disciplines, includePaper]);

  return (
    <div className="main-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
            Статистика кафедры «{departmentName}»
          </h1>
          {facultyCode && <Capsule variant="default">{facultyCode}</Capsule>}
        </div>
      </div>

      {error && (
        <p className="text" style={{ color: 'var(--accent-red-c)', marginBottom: '16px' }}>{error}</p>
      )}

      <div
        style={{
          backgroundColor: 'var(--background-main-element-c)',
          border: '1px solid var(--secondary-border-c)',
          borderRadius: '16px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={20} color="var(--accent-blue-c)" />
          <span className="text text-bold">Сводка по кафедре:</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span className="text text-blind">Групп (план / факт): </span>
            <span className="text text-bold">{departmentTotals.groupNorm} / {departmentTotals.groupFact}</span>
          </div>
          <div>
            <span className="text text-blind">Дисциплины (план / факт): </span>
            <span className="text text-bold">{departmentTotals.classNorm} / {departmentTotals.classFact}</span>
          </div>
          <div>
            <span className="text text-blind">Эл. отчёты: </span>
            <span className="text text-bold">{departmentTotals.eReportDone}</span>
            {departmentTotals.eReportRemarks > 0 && (
              <span style={{ color: 'var(--accent-red-c)', marginLeft: '6px', fontSize: '12px', fontWeight: 600 }}>
                (замечаний: {departmentTotals.eReportRemarks})
              </span>
            )}
          </div>
          {includePaper ? (
            <div>
              <span className="text text-blind">Бум. отчёты: </span>
              <span className="text text-bold">{departmentTotals.pReportDone}</span>
              {departmentTotals.pReportRemarks > 0 && (
                <span style={{ color: 'var(--accent-red-c)', marginLeft: '6px', fontSize: '12px', fontWeight: 600 }}>
                  (замечаний: {departmentTotals.pReportRemarks})
                </span>
              )}
            </div>
          ) : (
            <div>
              <span className="text text-blind">Бум. отчёты: </span>
              <span className="text text-bold" style={{ color: 'var(--secondary-lock-font-c)' }}>не требуются</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text text-blind">Недосдано отчётов:</span>
            <Capsule variant={departmentTotals.totalDebt === 0 ? 'success' : 'danger'}>
              {departmentTotals.totalDebt === 0 ? '0' : `-${departmentTotals.totalDebt}`}
            </Capsule>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <Dropdown
              label="Семестр"
              options={semesterOptions}
              value={selectedSemester}
              onChange={setSelectedSemester}
              placeholder="Выберите семестр"
            />
          </div>
          <div style={{ minWidth: '220px', flex: 1 }}>
            <Search
              hint="Поиск по дисциплине, преподавателю, группе..."
              value={searchQuery}
              onChange={setSearchQuery}
              size="large"
            />
          </div>
          <div style={{ width: '180px' }}>
            <Dropdown
              label="Курс"
              options={courseOptions}
              value={courseFilter}
              onChange={setCourseFilter}
              placeholder="Все курсы"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            title="Раскрыть все группы"
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

      {loading ? (
        <p className="text">Загрузка статистики…</p>
      ) : filteredDisciplines.length === 0 ? (
        <p className="text">Нет данных за выбранный семестр.</p>
      ) : (
      <div className="table-wrapper">
        <table className="table-container" style={{ width: '100%', borderCollapse: 'separate', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Дисциплина кафедры</th>
              <th style={{ padding: '12px 6px', width: '130px' }}>Курс / Семестр</th>
              <th style={{ padding: '12px 6px', width: '70px' }}>Профили</th>
              <th style={{ padding: '12px 6px', width: '75px' }}>План</th>
              <th style={{ padding: '12px 6px', width: '75px' }}>Факт</th>
              <th style={{ padding: '12px 6px', width: '90px' }}>Занятия</th>
              <th style={{ padding: '12px 6px', width: '100px' }}>Эл. отчёты</th>
              {includePaper && <th style={{ padding: '12px 6px', width: '100px' }}>Бум. отчёты</th>}
              <th style={{ padding: '12px 8px', width: '110px' }}>Сдача отчётов</th>
            </tr>
          </thead>
          <tbody>
            {filteredDisciplines.map(disc => {
              const isExpanded = !!expandedDisciplines[disc.id];

              return (
                <React.Fragment key={disc.id}>
                  <tr
                    onClick={() => toggleDiscipline(disc.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'var(--secondary-divider-bg-c)' : undefined,
                      fontWeight: 600
                    }}
                  >
                    <td style={{ textAlign: 'left', padding: '12px 14px' }}>
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
                        <BookOpen size={16} color="var(--accent-blue-c)" />
                        <span className="text-bold" style={{ fontSize: '14px' }}>
                          {disc.title}
                        </span>
                        <span className="text text-blind" style={{ fontSize: '11px', fontWeight: 400 }}>
                          ({disc.groups.length} групп)
                        </span>
                      </div>
                    </td>
                    <td>
                      <Capsule variant="default">
                        {disc.course} курс ({disc.semester})
                      </Capsule>
                    </td>
                    <td>{disc.profilesCount}</td>
                    <td>{disc.groupFact}</td>
                    <td>{disc.classNorm} / {disc.classFact}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span className="text text-bold">{disc.eReportDone}</span>
                        {disc.eReportRemarks > 0 && (
                          <span style={{ color: 'var(--accent-red-c)', fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                            замечаний: {disc.eReportRemarks}
                          </span>
                        )}
                      </div>
                    </td>
                    {includePaper && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className="text text-bold">{disc.pReportDone}</span>
                          {disc.pReportRemarks > 0 && (
                            <span style={{ color: 'var(--accent-red-c)', fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                              замечаний: {disc.pReportRemarks}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td>
                      {(() => {
                        const eMissing = Math.max(0, disc.classFact - disc.eReportDone);
                        const pMissing = includePaper ? Math.max(0, disc.classFact - disc.pReportDone) : 0;
                        const discDebt = Math.max(eMissing, pMissing);
                        const discHasRemarks = disc.eReportRemarks > 0 || (includePaper && disc.pReportRemarks > 0);
                        return (
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {discDebt > 0 ? (
                              <Capsule variant="danger">-{discDebt}</Capsule>
                            ) : discHasRemarks ? (
                              <Capsule variant="warning">Замечания</Capsule>
                            ) : (
                              <Capsule variant="success">Сдано</Capsule>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>

                  {isExpanded && disc.groups.map(grp => {
                    const eStatusText =
                      grp.eReportStatus === 'done' ? 'Сдан' :
                      grp.eReportStatus === 'remarks' ? 'Замечания' : 'Не сдан';
                    const eVariant =
                      grp.eReportStatus === 'done' ? 'success' :
                      grp.eReportStatus === 'remarks' ? 'warning' : 'danger';

                    const pStatusText =
                      grp.pReportStatus === 'done' ? 'Сдан' :
                      grp.pReportStatus === 'remarks' ? 'Замечания' : 'Не сдан';
                    const pVariant =
                      grp.pReportStatus === 'done' ? 'success' :
                      grp.pReportStatus === 'remarks' ? 'warning' : 'danger';

                    return (
                      <tr
                        key={grp.groupNumber}
                        style={{
                          backgroundColor: 'var(--background-inner-main-element-c)',
                          fontSize: '13px'
                        }}
                      >
                        <td style={{ textAlign: 'left', paddingLeft: '38px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--secondary-lock-font-c)', fontFamily: 'monospace' }}>↳</span>
                            <span className="text-bold" style={{ fontSize: '13px' }}>
                              Группа {grp.groupNumber}
                            </span>
                            <span className="text text-blind" style={{ fontSize: '12px' }}>
                              • Преп. {grp.teacher}
                            </span>
                          </div>
                        </td>
                        <td>{grp.course} курс</td>
                        <td>—</td>
                        <td>1</td>
                        <td>1</td>
                        <td>1 / 1</td>
                        <td>
                          <Capsule variant={eVariant}>{eStatusText}</Capsule>
                        </td>
                        {includePaper && (
                          <td>
                            <Capsule variant={pVariant}>{pStatusText}</Capsule>
                          </td>
                        )}
                        <td>
                          {(() => {
                            const isDone = grp.eReportStatus === 'done' && (!includePaper || grp.pReportStatus === 'done');
                            const hasRemarks = grp.eReportStatus === 'remarks' || (includePaper && grp.pReportStatus === 'remarks');
                            return (
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Capsule variant={isDone ? 'success' : hasRemarks ? 'warning' : 'danger'}>
                                  {isDone ? 'Сдано' : hasRemarks ? 'Замечания' : 'Не сдан'}
                                </Capsule>
                              </div>
                            );
                          })()}
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
      )}
    </div>
  );
}
