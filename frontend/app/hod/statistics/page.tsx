"use client";

import React, { useState, useMemo } from 'react';
import Dropdown from '@/components/dropdown/Dropdown';
import Search from '@/components/search/Search';
import Button from '@/components/button/Button';
import Capsule from '@/components/capsule/Capsule';
import CheckBox from '@/components/checkbox/CheckBox';
import {
  DisciplineStat,
  initialHodDisciplinesData,
  semesterOptions
} from '@/components/statistics/statisticsData';
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  GraduationCap
} from 'lucide-react';

export default function HodStatisticsPage() {
  const [selectedSemester, setSelectedSemester] = useState<string>('spring2025');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({
    disc_net: true,
    disc_db: true
  });

  const courseOptions = [
    { value: 'all', label: 'Все курсы' },
    { value: '2', label: '2 курс (Бакалавриат)' },
    { value: '3', label: '3 курс (Бакалавриат)' },
    { value: '4', label: '4 курс (Бакалавриат)' },
    { value: 'mag', label: '2 курс (Магистратура)' }
  ];

  const toggleDiscipline = (id: string) => {
    setExpandedDisciplines(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    initialHodDisciplinesData.forEach(d => { all[d.id] = true; });
    setExpandedDisciplines(all);
  };

  const collapseAll = () => {
    setExpandedDisciplines({});
  };

  const filteredDisciplines = useMemo(() => {
    return initialHodDisciplinesData.filter(d => {
      if (courseFilter !== 'all') {
        if (courseFilter === 'mag' && !d.semester.includes('маг')) return false;
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
  }, [courseFilter, searchQuery]);

  const departmentTotals = useMemo(() => {
    let groupNorm = 0;
    let groupFact = 0;
    let classNorm = 0;
    let classFact = 0;
    let eReportDone = 0;
    let eReportRemarks = 0;
    let pReportDone = 0;
    let pReportRemarks = 0;

    initialHodDisciplinesData.forEach(d => {
      const dNorm = d.profilesCount * 2;
      groupNorm += dNorm;
      groupFact += d.groupFact;
      classNorm += d.classNorm;
      classFact += d.classFact;
      eReportDone += d.eReportDone;
      eReportRemarks += d.eReportRemarks;
      pReportDone += d.pReportDone;
      pReportRemarks += d.pReportRemarks;
    });

    const diff = groupFact - groupNorm;

    return {
      groupNorm,
      groupFact,
      diff,
      classNorm,
      classFact,
      eReportDone,
      eReportRemarks,
      pReportDone,
      pReportRemarks,
      allPassed: diff >= 0 && eReportRemarks === 0 && pReportRemarks === 0
    };
  }, []);

  return (
    <div className="main-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
            Статистика кафедры «Информационные технологии»
          </h1>
          <Capsule variant="default">ФИТ</Capsule>
        </div>
      </div>

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
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span className="text text-blind">Групп (план): </span>
            <span className="text text-bold">{departmentTotals.groupNorm}</span>
          </div>
          <div>
            <span className="text text-blind">Групп (факт): </span>
            <span className="text text-bold">{departmentTotals.groupFact}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="text text-blind">Разница:</span>
            <Capsule variant={departmentTotals.diff >= 0 ? 'success' : 'danger'}>
              {departmentTotals.diff >= 0 ? `+${departmentTotals.diff}` : departmentTotals.diff}
            </Capsule>
          </div>
          <div>
            <span className="text text-blind">Эл. отчёты: </span>
            <span className="text text-bold">{departmentTotals.eReportDone}</span>
            {departmentTotals.eReportRemarks > 0 && (
              <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '12px' }}>
                ({departmentTotals.eReportRemarks} замеч.)
              </span>
            )}
          </div>
          <div>
            <span className="text text-blind">Бум. отчёты: </span>
            <span className="text text-bold">{departmentTotals.pReportDone}</span>
            {departmentTotals.pReportRemarks > 0 && (
              <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '12px' }}>
                ({departmentTotals.pReportRemarks} замеч.)
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '240px', flex: 1 }}>
            <Search
              hint="Поиск по дисциплине, преподавателю, группе..."
              value={searchQuery}
              onChange={setSearchQuery}
              size="large"
            />
          </div>
          <div style={{ width: '220px' }}>
            <Dropdown
              label="Семестр"
              options={semesterOptions}
              value={selectedSemester}
              onChange={setSelectedSemester}
              placeholder="Семестр"
            />
          </div>
          <div style={{ width: '220px' }}>
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

      <div className="table-wrapper">
        <table className="table-container" style={{ width: '100%', borderCollapse: 'separate', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Дисциплина кафедры</th>
              <th style={{ padding: '12px 6px', width: '130px' }}>Курс / Семестр</th>
              <th style={{ padding: '12px 6px', width: '70px' }}>Профили</th>
              <th style={{ padding: '12px 6px', width: '85px' }}>План</th>
              <th style={{ padding: '12px 6px', width: '85px' }}>Факт</th>
              <th style={{ padding: '12px 6px', width: '80px' }}>Разница</th>
              <th style={{ padding: '12px 6px', width: '110px' }}>Занятия</th>
              <th style={{ padding: '12px 6px', width: '100px' }}>Эл. отчёты</th>
              <th style={{ padding: '12px 6px', width: '100px' }}>Бум. отчёты</th>
              <th style={{ padding: '12px 8px', width: '65px' }}>Сдано</th>
            </tr>
          </thead>
          <tbody>
            {filteredDisciplines.map(disc => {
              const dNorm = disc.profilesCount * 2;
              const diff = disc.groupFact - dNorm;
              const isExpanded = !!expandedDisciplines[disc.id];
              const allPassed = diff >= 0 && disc.eReportRemarks === 0 && disc.pReportRemarks === 0;

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
                    <td><strong className="text-bold">{dNorm}</strong></td>
                    <td>{disc.groupFact}</td>
                    <td>
                      <Capsule variant={diff >= 0 ? 'success' : 'danger'}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </Capsule>
                    </td>
                    <td>{disc.classNorm} / {disc.classFact}</td>
                    <td>
                      <span className="text text-bold">{disc.eReportDone}</span>
                      {disc.eReportRemarks > 0 && (
                        <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '11px' }}>
                          ({disc.eReportRemarks})
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text text-bold">{disc.pReportDone}</span>
                      {disc.pReportRemarks > 0 && (
                        <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '11px' }}>
                          ({disc.pReportRemarks})
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                        <CheckBox text="" type={allPassed ? 'blue' : 'red'} state={true} />
                      </div>
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
                        <td>
                          <Capsule variant="success">0</Capsule>
                        </td>
                        <td>2 / 2</td>
                        <td>
                          <Capsule variant={eVariant}>{eStatusText}</Capsule>
                        </td>
                        <td>
                          <Capsule variant={pVariant}>{pStatusText}</Capsule>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                            <CheckBox text="" type={grp.allPassed ? 'blue' : 'red'} state={true} />
                          </div>
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
    </div>
  );
}
