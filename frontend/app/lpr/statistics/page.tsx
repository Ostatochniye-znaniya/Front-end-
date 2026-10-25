"use client";

import React, { useState, useMemo } from 'react';
import Dropdown from '@/components/dropdown/Dropdown';
import Button from '@/components/button/Button';
import Capsule from '@/components/capsule/Capsule';
import CheckBox from '@/components/checkbox/CheckBox';
import {
  FacultyStat,
  DepartmentStat,
  initialFacultiesData,
  semesterOptions,
  calculateGroupNorm
} from '@/components/statistics/statisticsData';
import {
  ChevronRight,
  ChevronDown,
  Building2
} from 'lucide-react';

export default function LprStatisticsPage() {
  const [selectedSemester, setSelectedSemester] = useState<string>('spring2025');
  const [reportRequirement, setReportRequirement] = useState<'both' | 'electronic_only'>('both');
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({
    fit: true
  });

  const includePaper = reportRequirement === 'both';

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
    let unsubmittedCount = 0;

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

      const eMissing = Math.max(0, dept.classFact - dept.eReportDone);
      const pMissing = includePaper ? Math.max(0, dept.classFact - dept.pReportDone) : 0;
      unsubmittedCount += Math.max(eMissing, pMissing);
    });

    const hasRemarks = eReportRemarks > 0 || (includePaper && pReportRemarks > 0);
    const allPassed = unsubmittedCount === 0 && !hasRemarks;

    return {
      profiles,
      groupNorm,
      groupFact,
      classNorm,
      classFact,
      eReportDone,
      eReportRemarks,
      pReportDone,
      pReportRemarks,
      unsubmittedCount,
      hasRemarks,
      allPassed
    };
  };

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
    let totalDebt = 0;

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
      totalDebt += totals.unsubmittedCount;
    });

    return {
      profiles,
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
  }, [isSpring, includePaper]);

  return (
    <div className="main-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-bold" style={{ fontSize: '24px', margin: 0 }}>
            Статистика проверки остаточных знаний
          </h1>
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
          <Building2 size={20} color="var(--accent-blue-c)" />
          <span className="text text-bold">Сводка по университету:</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span className="text text-blind">Группы (план / факт): </span>
            <span className="text text-bold">{universityTotals.groupNorm} / {universityTotals.groupFact}</span>
          </div>
          <div>
            <span className="text text-blind">Дисциплины (план / факт): </span>
            <span className="text text-bold">{universityTotals.classNorm} / {universityTotals.classFact}</span>
          </div>
          <div>
            <span className="text text-blind">Эл. отчёты: </span>
            <span className="text text-bold">{universityTotals.eReportDone}</span>
            {universityTotals.eReportRemarks > 0 && (
              <span style={{ color: 'var(--accent-red-c)', marginLeft: '6px', fontSize: '12px', fontWeight: 600 }}>
                (замечаний: {universityTotals.eReportRemarks})
              </span>
            )}
          </div>
          {includePaper ? (
            <div>
              <span className="text text-blind">Бум. отчёты: </span>
              <span className="text text-bold">{universityTotals.pReportDone}</span>
              {universityTotals.pReportRemarks > 0 && (
                <span style={{ color: 'var(--accent-red-c)', marginLeft: '6px', fontSize: '12px', fontWeight: 600 }}>
                  (замечаний: {universityTotals.pReportRemarks})
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
            <Capsule variant={universityTotals.totalDebt === 0 ? 'success' : 'danger'}>
              {universityTotals.totalDebt === 0 ? '0' : `-${universityTotals.totalDebt}`}
            </Capsule>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ width: '280px' }}>
            <Dropdown
              label="Семестр"
              options={semesterOptions}
              value={selectedSemester}
              onChange={setSelectedSemester}
              placeholder="Выберите семестр"
            />
          </div>

          <div style={{ width: '270px' }}>
            <Dropdown
              label="Форма отчётности (настройка ЛПР)"
              options={[
                { value: 'both', label: 'Электронные + Бумажные' },
                { value: 'electronic_only', label: 'Только электронные' }
              ]}
              value={reportRequirement}
              onChange={(val) => setReportRequirement(val as 'both' | 'electronic_only')}
              placeholder="Форма отчётности"
            />
          </div>
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

      <div className="table-wrapper">
        <table className="table-container" style={{ width: '100%', borderCollapse: 'separate', fontSize: '13px' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ textAlign: 'left', padding: '12px 14px' }}>Факультет / Кафедра</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderBottom: '1px solid var(--secondary-border-c)' }}>Выбранные группы</th>
              <th colSpan={2} style={{ padding: '8px 6px', borderBottom: '1px solid var(--secondary-border-c)' }}>Дисциплины</th>
              <th colSpan={includePaper ? 2 : 1} style={{ padding: '8px 6px', borderBottom: '1px solid var(--secondary-border-c)' }}>Отчёты</th>
              <th rowSpan={2} style={{ padding: '12px 8px', width: '120px' }}>Сдача отчётов</th>
            </tr>
            <tr>
              <th style={{ padding: '8px 6px', width: '75px' }}>План</th>
              <th style={{ padding: '8px 6px', width: '75px' }}>Факт</th>
              <th style={{ padding: '8px 6px', width: '75px' }}>План</th>
              <th style={{ padding: '8px 6px', width: '75px' }}>Факт</th>
              <th style={{ padding: '8px 6px', width: '100px' }}>Эл. отчёты</th>
              {includePaper && <th style={{ padding: '8px 6px', width: '100px' }}>Бум. отчёты</th>}
            </tr>
          </thead>
          <tbody>
            {initialFacultiesData.map(faculty => {
              const totals = getFacultyTotals(faculty);
              const isExpanded = !!expandedFaculties[faculty.id];

              return (
                <React.Fragment key={faculty.id}>
                  <tr
                    onClick={() => toggleFaculty(faculty.id)}
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
                        <Building2 size={16} color="var(--accent-blue-c)" />
                        <span className="text-bold" style={{ fontSize: '14px' }}>
                          {faculty.code} — {faculty.name}
                        </span>
                        <span className="text text-blind" style={{ fontSize: '11px', fontWeight: 400 }}>
                          ({faculty.departments.length} каф.)
                        </span>
                      </div>
                    </td>
                    <td><strong className="text-bold">{totals.groupNorm}</strong></td>
                    <td>{totals.groupFact}</td>
                    <td>{totals.classNorm}</td>
                    <td>{totals.classFact}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span className="text text-bold">{totals.eReportDone}</span>
                        {totals.eReportRemarks > 0 && (
                          <span style={{ color: 'var(--accent-red-c)', fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                            замечаний: {totals.eReportRemarks}
                          </span>
                        )}
                      </div>
                    </td>
                    {includePaper && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className="text text-bold">{totals.pReportDone}</span>
                          {totals.pReportRemarks > 0 && (
                            <span style={{ color: 'var(--accent-red-c)', fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                              замечаний: {totals.pReportRemarks}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {totals.unsubmittedCount > 0 ? (
                          <Capsule variant="danger">-{totals.unsubmittedCount}</Capsule>
                        ) : totals.hasRemarks ? (
                          <Capsule variant="warning">Замечания</Capsule>
                        ) : (
                          <Capsule variant="success">Сдано</Capsule>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && faculty.departments.map(dept => {
                    const deptNorm = calculateGroupNorm(dept.profilesCount, dept.coursesCount, isSpring, dept.magistracyCount);
                    const eMissing = Math.max(0, dept.classFact - dept.eReportDone);
                    const pMissing = includePaper ? Math.max(0, dept.classFact - dept.pReportDone) : 0;
                    const deptDebt = Math.max(eMissing, pMissing);
                    const deptHasRemarks = dept.eReportRemarks > 0 || (includePaper && dept.pReportRemarks > 0);

                    return (
                      <tr
                        key={dept.id}
                        style={{
                          backgroundColor: 'var(--background-inner-main-element-c)',
                          fontSize: '13px'
                        }}
                      >
                        <td style={{ textAlign: 'left', paddingLeft: '38px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--secondary-lock-font-c)', fontFamily: 'monospace' }}>↳</span>
                            <span className="text" style={{ fontSize: '13px' }}>
                              {dept.name}
                            </span>
                          </div>
                        </td>
                        <td>{deptNorm}</td>
                        <td>{dept.groupFact}</td>
                        <td>{dept.classNorm}</td>
                        <td>{dept.classFact}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span>{dept.eReportDone}</span>
                            {dept.eReportRemarks > 0 && (
                              <span style={{ color: 'var(--accent-red-c)', fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                                замечаний: {dept.eReportRemarks}
                              </span>
                            )}
                          </div>
                        </td>
                        {includePaper && (
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span>{dept.pReportDone}</span>
                              {dept.pReportRemarks > 0 && (
                                <span style={{ color: 'var(--accent-red-c)', fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                                  замечаний: {dept.pReportRemarks}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {deptDebt > 0 ? (
                              <Capsule variant="danger">-{deptDebt}</Capsule>
                            ) : deptHasRemarks ? (
                              <Capsule variant="warning">Замечания</Capsule>
                            ) : (
                              <Capsule variant="success">Сдано</Capsule>
                            )}
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
