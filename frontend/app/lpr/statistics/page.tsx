"use client";

import React, { useState, useMemo } from 'react';
import Dropdown from '@/components/dropdown/Dropdown';
import Button from '@/components/button/Button';
import Capsule from '@/components/capsule/Capsule';
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
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({
    fit: true
  });

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
            <span className="text text-blind">Групп (план): </span>
            <span className="text text-bold">{universityTotals.groupNorm}</span>
          </div>
          <div>
            <span className="text text-blind">Групп (факт): </span>
            <span className="text text-bold">{universityTotals.groupFact}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="text text-blind">Разница:</span>
            <Capsule variant={universityTotals.diff >= 0 ? 'success' : 'danger'}>
              {universityTotals.diff >= 0 ? `+${universityTotals.diff}` : universityTotals.diff}
            </Capsule>
          </div>
          <div>
            <span className="text text-blind">Эл. отчёты: </span>
            <span className="text text-bold">{universityTotals.eReportDone}</span>
            {universityTotals.eReportRemarks > 0 && (
              <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '12px' }}>
                ({universityTotals.eReportRemarks} замеч.)
              </span>
            )}
          </div>
          <div>
            <span className="text text-blind">Бум. отчёты: </span>
            <span className="text text-bold">{universityTotals.pReportDone}</span>
            {universityTotals.pReportRemarks > 0 && (
              <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '12px' }}>
                ({universityTotals.pReportRemarks} замеч.)
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ width: '280px' }}>
          <Dropdown
            label="Семестр"
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

      <div className="table-wrapper">
        <table className="table-container" style={{ width: '100%', borderCollapse: 'separate', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Факультет / Кафедра</th>
              <th style={{ padding: '12px 6px', width: '70px' }}>Профили</th>
              <th style={{ padding: '12px 6px', width: '85px' }}>План</th>
              <th style={{ padding: '12px 6px', width: '85px' }}>Факт</th>
              <th style={{ padding: '12px 6px', width: '80px' }}>Разница</th>
              <th style={{ padding: '12px 6px', width: '110px' }}>Занятия</th>
              <th style={{ padding: '12px 6px', width: '100px' }}>Эл. отчёты</th>
              <th style={{ padding: '12px 6px', width: '100px' }}>Бум. отчёты</th>
              <th style={{ padding: '12px 8px', width: '85px' }}>Всё сдано</th>
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
                    <td>{totals.classNorm} / {totals.classFact}</td>
                    <td>
                      <span className="text text-bold">{totals.eReportDone}</span>
                      {totals.eReportRemarks > 0 && (
                        <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '11px' }}>
                          ({totals.eReportRemarks})
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text text-bold">{totals.pReportDone}</span>
                      {totals.pReportRemarks > 0 && (
                        <span style={{ color: 'var(--accent-red-c)', marginLeft: '4px', fontSize: '11px' }}>
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
                        <td style={{ textAlign: 'left', paddingLeft: '38px' }}>
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
                        <td>{dept.classNorm} / {dept.classFact}</td>
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
    </div>
  );
}
