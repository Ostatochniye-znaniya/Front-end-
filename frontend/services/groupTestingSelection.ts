import type {
  GroupsTestingChange,
  PlannedTestingCell,
  TestingStudyProgram,
} from "./groupsTesting";

export type TestingSelection = Record<string, GroupsTestingChange>;

export const selectionKey = (groupId: number, semesterId: number): string =>
  `${groupId}:${semesterId}`;

export function isTestingPlanned(
  groupId: number,
  cell: PlannedTestingCell,
  selection: TestingSelection,
): boolean {
  return selection[selectionKey(groupId, cell.semesterId)]?.planned ?? cell.planned;
}

export function getOccupiedGroup(
  program: TestingStudyProgram,
  semesterId: number,
  selection: TestingSelection,
): number | null {
  for (const group of program.groups) {
    const cell = group.plannedTestings.find((item) => item.semesterId === semesterId);
    if (cell && isTestingPlanned(group.groupId, cell, selection)) return group.groupId;
  }
  return null;
}

export function changeTestingSelection(
  program: TestingStudyProgram,
  groupId: number,
  semesterId: number,
  planned: boolean,
  selection: TestingSelection,
): TestingSelection {
  const group = program.groups.find((item) => item.groupId === groupId);
  const cell = group?.plannedTestings.find((item) => item.semesterId === semesterId);
  if (!cell?.editable) return selection;
  const occupiedGroup = getOccupiedGroup(program, semesterId, selection);
  if (planned && occupiedGroup !== null && occupiedGroup !== groupId) return selection;

  const next = { ...selection };
  const key = selectionKey(groupId, semesterId);
  if (planned === cell.planned) delete next[key];
  else next[key] = { groupId, semesterId, planned };
  return next;
}
