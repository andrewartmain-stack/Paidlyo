export type Task = {
  id: string;
  name: string;
  defaultHourlyRateCents: number | null;
  isBillable: boolean;
  isCommon: boolean;
  archivedAt: string | null;
};
