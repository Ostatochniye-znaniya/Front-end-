export interface DepartmentStat {
  id: string;
  name: string;
  profilesCount: number;
  coursesCount: number;
  magistracyCount: number;
  groupNorm: number;
  groupFact: number;
  classNorm: number;
  classFact: number;
  eReportDone: number;
  eReportRemarks: number;
  pReportDone: number;
  pReportRemarks: number;
}

export interface FacultyStat {
  id: string;
  code: string;
  name: string;
  departments: DepartmentStat[];
}

export interface DisciplineGroupDetail {
  groupNumber: string;
  course: number;
  teacher: string;
  eReportStatus: 'done' | 'remarks' | 'pending';
  pReportStatus: 'done' | 'remarks' | 'pending';
  allPassed: boolean;
}

export interface DisciplineStat {
  id: string;
  title: string;
  course: number;
  semester: string;
  profilesCount: number;
  groupFact: number;
  classNorm: number;
  classFact: number;
  eReportDone: number;
  eReportRemarks: number;
  pReportDone: number;
  pReportRemarks: number;
  groups: DisciplineGroupDetail[];
}

export function mapFacultyStatistics(faculties: {
  id: number;
  code: string;
  name: string;
  departments: {
    id: number;
    name: string;
    profilesCount: number;
    coursesCount: number;
    magistracyCount: number;
    groupNorm: number;
    groupFact: number;
    classNorm: number;
    classFact: number;
    eReportDone: number;
    eReportRemarks: number;
    pReportDone: number;
    pReportRemarks: number;
  }[];
}[]): FacultyStat[] {
  return faculties.map(faculty => ({
    id: String(faculty.id),
    code: faculty.code,
    name: faculty.name,
    departments: faculty.departments.map(dept => ({
      id: String(dept.id),
      name: dept.name,
      profilesCount: dept.profilesCount,
      coursesCount: dept.coursesCount,
      magistracyCount: dept.magistracyCount,
      groupNorm: dept.groupNorm,
      groupFact: dept.groupFact,
      classNorm: dept.classNorm,
      classFact: dept.classFact,
      eReportDone: dept.eReportDone,
      eReportRemarks: dept.eReportRemarks,
      pReportDone: dept.pReportDone,
      pReportRemarks: dept.pReportRemarks,
    })),
  }));
}
