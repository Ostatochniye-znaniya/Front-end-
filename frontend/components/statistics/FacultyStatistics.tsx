"use client";

import { useMemo, useState } from 'react';
import Dropdown from '@/components/dropdown/Dropdown';
import FacultiesStatistics from './FacultiesStatistics';
import { initialFacultiesData } from './statisticsData';

const facultyOptions = initialFacultiesData.map(faculty => ({
  value: faculty.id,
  label: `${faculty.code} — ${faculty.name}`,
}));

export default function FacultyStatistics() {
  const [facultyId, setFacultyId] = useState(initialFacultiesData[0].id);
  const faculties = useMemo(
    () => initialFacultiesData.filter(faculty => faculty.id === facultyId),
    [facultyId]
  );

  return (
    <FacultiesStatistics
      key={facultyId}
      faculties={faculties}
      title="Статистика факультета — декан / ответственный"
      summaryLabel={`Сводка по факультету ${faculties[0].code}:`}
    >
      <div style={{ marginBottom: '24px', maxWidth: '560px' }}>
        <Dropdown
          label="Факультет для демонстрации"
          options={facultyOptions}
          value={facultyId}
          onChange={setFacultyId}
        />
        <p className="text text-blind">
          Показаны только кафедры выбранного факультета. Это демонстрационный выбор,
          а не проверка прав: в рабочем режиме факультет должен определяться сервером
          по учётной записи.
        </p>
      </div>
    </FacultiesStatistics>
  );
}
