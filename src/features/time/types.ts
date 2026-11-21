export type TimeEntry = {
  id: string;
  spentDate: string;
  minutes: number;
  notes: string | null;
  isBillable: boolean;
  timerStartedAt: string | null;
  /** On an invoice: locked in the timesheet. */
  invoiced: boolean;
  project: { id: string; name: string; code: string | null; clientName: string };
  task: { id: string; name: string };
};

/** A project people can track time on, with its enabled (active) tasks. */
export type TrackableProject = {
  id: string;
  name: string;
  code: string | null;
  clientName: string;
  tasks: { id: string; name: string }[];
};
