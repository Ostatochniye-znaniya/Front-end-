export interface DepartmentStat {
  id: string;
  name: string;
  profilesCount: number;
  coursesCount: number;
  magistracyCount: number;
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

export interface TransitionGroupCandidate {
  id: string;
  profileName: string;
  previousCourse: number;
  currentCourse: number;
  parallelGroups: string[];
  selectedGroup?: string;
  autoReason: string;
  needsManualSelection: boolean;
}

/**
 * Формула расчета норматива групп:
 * Кол-во профилей × 2 × кол-во курсов (+1 если весенний семестр для первого курса) + только 2й курс магистратуры
 */
export function calculateGroupNorm(
  profilesCount: number,
  coursesCount: number = 3,
  isSpring: boolean = false,
  magistracyCount: number = 1
): number {
  const springFirstCourseAdd = isSpring ? 1 : 0;
  return profilesCount * (2 * coursesCount + springFirstCourseAdd) + magistracyCount;
}

export const semesterOptions = [
  { value: 'fall2024', label: 'Осень 2024 (Осенний семестр)', isSpring: false },
  { value: 'spring2025', label: 'Весна 2025 (Весенний семестр)', isSpring: true },
  { value: 'fall2025', label: 'Осень 2025 (Осенний семестр)', isSpring: false },
  { value: 'spring2026', label: 'Весна 2026 (Весенний семестр)', isSpring: true },
];

export const initialFacultiesData: FacultyStat[] = [
  {
    id: 'fit',
    code: 'ФИТ',
    name: 'Факультет информационных технологий',
    departments: [
      {
        id: 'fit_it',
        name: 'Кафедра «Информационные технологии»',
        profilesCount: 3,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 19,
        classNorm: 28,
        classFact: 26,
        eReportDone: 18,
        eReportRemarks: 1,
        pReportDone: 17,
        pReportRemarks: 0,
      },
      {
        id: 'fit_pi',
        name: 'Кафедра «Прикладная информатика»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 13,
        classNorm: 20,
        classFact: 19,
        eReportDone: 11,
        eReportRemarks: 2,
        pReportDone: 10,
        pReportRemarks: 1,
      },
      {
        id: 'fit_ib',
        name: 'Кафедра «Информационная безопасность»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 12,
        classNorm: 18,
        classFact: 18,
        eReportDone: 12,
        eReportRemarks: 0,
        pReportDone: 11,
        pReportRemarks: 1,
      },
      {
        id: 'fit_cnet',
        name: 'Кафедра «Сетевые технологии и телекоммуникации»',
        profilesCount: 1,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 7,
        classNorm: 12,
        classFact: 12,
        eReportDone: 7,
        eReportRemarks: 0,
        pReportDone: 7,
        pReportRemarks: 0,
      }
    ]
  },
  {
    id: 'fm',
    code: 'ФМ',
    name: 'Факультет машиностроения',
    departments: [
      {
        id: 'fm_tm',
        name: 'Кафедра «Технология машиностроения»',
        profilesCount: 3,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 17,
        classNorm: 26,
        classFact: 22,
        eReportDone: 14,
        eReportRemarks: 3,
        pReportDone: 12,
        pReportRemarks: 2,
      },
      {
        id: 'fm_mat',
        name: 'Кафедра «Материаловедение и нанотехнологии»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 12,
        classNorm: 18,
        classFact: 16,
        eReportDone: 10,
        eReportRemarks: 1,
        pReportDone: 9,
        pReportRemarks: 1,
      }
    ]
  },
  {
    id: 'tf',
    code: 'ТФ',
    name: 'Транспортный факультет',
    departments: [
      {
        id: 'tf_auto',
        name: 'Кафедра «Автомобили и транспортные системы»',
        profilesCount: 3,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 18,
        classNorm: 26,
        classFact: 24,
        eReportDone: 16,
        eReportRemarks: 2,
        pReportDone: 15,
        pReportRemarks: 1,
      },
      {
        id: 'tf_sm',
        name: 'Кафедра «Смарт-мобильность»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 13,
        classNorm: 18,
        classFact: 18,
        eReportDone: 13,
        eReportRemarks: 0,
        pReportDone: 12,
        pReportRemarks: 1,
      }
    ]
  },
  {
    id: 'igrik',
    code: 'ИГРИК',
    name: 'Институт графики и искусства книги',
    departments: [
      {
        id: 'igrik_design',
        name: 'Кафедра «Графический дизайн»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 13,
        classNorm: 18,
        classFact: 18,
        eReportDone: 13,
        eReportRemarks: 0,
        pReportDone: 13,
        pReportRemarks: 0,
      },
      {
        id: 'igrik_art',
        name: 'Кафедра «Иллюстрация и эстамп»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 11,
        classNorm: 16,
        classFact: 14,
        eReportDone: 9,
        eReportRemarks: 2,
        pReportDone: 8,
        pReportRemarks: 2,
      }
    ]
  },
  {
    id: 'iidij',
    code: 'ИИДиЖ',
    name: 'Институт издательского дела и журналистики',
    departments: [
      {
        id: 'iidij_pub',
        name: 'Кафедра «Издательское дело и редактирование»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 13,
        classNorm: 18,
        classFact: 18,
        eReportDone: 12,
        eReportRemarks: 1,
        pReportDone: 11,
        pReportRemarks: 1,
      },
      {
        id: 'iidij_journ',
        name: 'Кафедра «Журналистика и массовые коммуникации»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 12,
        classNorm: 18,
        classFact: 17,
        eReportDone: 10,
        eReportRemarks: 2,
        pReportDone: 9,
        pReportRemarks: 1,
      }
    ]
  },
  {
    id: 'fhtib',
    code: 'ФХТиБ',
    name: 'Факультет химической технологии и биотехнологии',
    departments: [
      {
        id: 'fhtib_bio',
        name: 'Кафедра «Биотехнология и промышленная фармация»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 13,
        classNorm: 18,
        classFact: 18,
        eReportDone: 13,
        eReportRemarks: 0,
        pReportDone: 13,
        pReportRemarks: 0,
      },
      {
        id: 'fhtib_chem',
        name: 'Кафедра «Химическая технология и инженерия»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 12,
        classNorm: 18,
        classFact: 17,
        eReportDone: 11,
        eReportRemarks: 1,
        pReportDone: 11,
        pReportRemarks: 0,
      }
    ]
  },
  {
    id: 'feiu',
    code: 'ФЭиУ',
    name: 'Факультет экономики и управления',
    departments: [
      {
        id: 'feiu_econ',
        name: 'Кафедра «Экономика и организация производства»',
        profilesCount: 3,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 19,
        classNorm: 26,
        classFact: 26,
        eReportDone: 19,
        eReportRemarks: 0,
        pReportDone: 19,
        pReportRemarks: 0,
      },
      {
        id: 'feiu_manag',
        name: 'Кафедра «Менеджмент и инновации»',
        profilesCount: 2,
        coursesCount: 3,
        magistracyCount: 1,
        groupFact: 12,
        classNorm: 18,
        classFact: 16,
        eReportDone: 10,
        eReportRemarks: 1,
        pReportDone: 9,
        pReportRemarks: 1,
      }
    ]
  }
];

export const initialHodDisciplinesData: DisciplineStat[] = [
  {
    id: 'disc_net',
    title: 'Сети и телекоммуникации',
    course: 3,
    semester: '5 семестр',
    profilesCount: 3,
    groupFact: 6,
    classNorm: 12,
    classFact: 12,
    eReportDone: 6,
    eReportRemarks: 0,
    pReportDone: 6,
    pReportRemarks: 0,
    groups: [
      { groupNumber: '221-111', course: 3, teacher: 'Иванов И. И.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-112', course: 3, teacher: 'Иванов И. И.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-121', course: 3, teacher: 'Смирнов К. А.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-122', course: 3, teacher: 'Смирнов К. А.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-131', course: 3, teacher: 'Петров В. А.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-132', course: 3, teacher: 'Петров В. А.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
    ]
  },
  {
    id: 'disc_db',
    title: 'Базы данных и проектирование СУБД',
    course: 2,
    semester: '3 семестр',
    profilesCount: 3,
    groupFact: 6,
    classNorm: 12,
    classFact: 11,
    eReportDone: 5,
    eReportRemarks: 1,
    pReportDone: 4,
    pReportRemarks: 1,
    groups: [
      { groupNumber: '231-111', course: 2, teacher: 'Сидорова Е. Н.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '231-112', course: 2, teacher: 'Сидорова Е. Н.', eReportStatus: 'remarks', pReportStatus: 'pending', allPassed: false },
      { groupNumber: '231-121', course: 2, teacher: 'Волков Д. М.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '231-122', course: 2, teacher: 'Волков Д. М.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '231-131', course: 2, teacher: 'Сидорова Е. Н.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '231-132', course: 2, teacher: 'Волков Д. М.', eReportStatus: 'pending', pReportStatus: 'pending', allPassed: false },
    ]
  },
  {
    id: 'disc_web',
    title: 'Web-технологии и клиент-серверная разработка',
    course: 3,
    semester: '5 семестр',
    profilesCount: 2,
    groupFact: 4,
    classNorm: 8,
    classFact: 8,
    eReportDone: 4,
    eReportRemarks: 0,
    pReportDone: 4,
    pReportRemarks: 0,
    groups: [
      { groupNumber: '221-111', course: 3, teacher: 'Ковалев М. Ю.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-112', course: 3, teacher: 'Ковалев М. Ю.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-121', course: 3, teacher: 'Алексеева Т. В.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '221-122', course: 3, teacher: 'Алексеева Т. В.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
    ]
  },
  {
    id: 'disc_arch',
    title: 'Архитектура информационных систем',
    course: 4,
    semester: '7 семестр',
    profilesCount: 2,
    groupFact: 4,
    classNorm: 8,
    classFact: 7,
    eReportDone: 3,
    eReportRemarks: 1,
    pReportDone: 3,
    pReportRemarks: 0,
    groups: [
      { groupNumber: '211-111', course: 4, teacher: 'Михайлов К. Д.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '211-112', course: 4, teacher: 'Михайлов К. Д.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true },
      { groupNumber: '211-121', course: 4, teacher: 'Михайлов К. Д.', eReportStatus: 'remarks', pReportStatus: 'done', allPassed: false },
      { groupNumber: '211-122', course: 4, teacher: 'Михайлов К. Д.', eReportStatus: 'pending', pReportStatus: 'pending', allPassed: false },
    ]
  },
  {
    id: 'disc_mag',
    title: 'Корпоративные информационные платформы (Магистратура)',
    course: 2,
    semester: '3 семестр маг.',
    profilesCount: 1,
    groupFact: 1,
    classNorm: 2,
    classFact: 2,
    eReportDone: 1,
    eReportRemarks: 0,
    pReportDone: 1,
    pReportRemarks: 0,
    groups: [
      { groupNumber: '232-011', course: 2, teacher: 'Иванов И. И.', eReportStatus: 'done', pReportStatus: 'done', allPassed: true }
    ]
  }
];

export const initialTransitionCandidates: TransitionGroupCandidate[] = [
  {
    id: 'trans_1',
    profileName: '09.03.02 Информационные системы и технологии (ИСИТ)',
    previousCourse: 1,
    currentCourse: 2,
    parallelGroups: ['231-111', '231-112'],
    selectedGroup: '231-111',
    autoReason: 'Переход 1 курс → 2 курс. Параллельные группы сформированы из разных потоков, требуется выбор представительной группы.',
    needsManualSelection: true
  },
  {
    id: 'trans_2',
    profileName: '09.03.03 Прикладная информатика (СИПИ)',
    previousCourse: 1,
    currentCourse: 2,
    parallelGroups: ['231-121', '231-122', '231-123'],
    selectedGroup: '',
    autoReason: '3 параллельные группы после 1 курса. Автовыбор невозможен без решения ЛПР.',
    needsManualSelection: true
  },
  {
    id: 'trans_3',
    profileName: '10.03.01 Информационная безопасность (ИБ)',
    previousCourse: 1,
    currentCourse: 2,
    parallelGroups: ['231-131'],
    selectedGroup: '231-131',
    autoReason: 'Единственная группа на профиле, подобрана автоматически.',
    needsManualSelection: false
  },
  {
    id: 'trans_4',
    profileName: '15.03.01 Машиностроение (ТМ)',
    previousCourse: 1,
    currentCourse: 2,
    parallelGroups: ['231-211', '231-212'],
    selectedGroup: '',
    autoReason: '2 параллельные группы, требуется выбор ЛПР.',
    needsManualSelection: true
  },
  {
    id: 'trans_5',
    profileName: '09.04.02 Магистратура (Корпоративные системы)',
    previousCourse: 1,
    currentCourse: 2,
    parallelGroups: ['232-011'],
    selectedGroup: '232-011',
    autoReason: '2-й курс магистратуры, единственная группа профиля.',
    needsManualSelection: false
  }
];
