import FacultiesStatistics from '@/components/statistics/FacultiesStatistics';
import { initialFacultiesData } from '@/components/statistics/statisticsData';

export default function LprStatisticsPage() {
  return (
    <FacultiesStatistics
      faculties={initialFacultiesData}
      title="Статистика проверки остаточных знаний"
      summaryLabel="Сводка по университету:"
    />
  );
}
