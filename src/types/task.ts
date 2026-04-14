export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'cancelled';

export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export type TaskHistoryAction =
  | 'created'
  | 'updated'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'checkin_sent'
  | 'checkin_responded';

export type CheckinAction = 'completed' | 'postponed' | 'cancelled' | 'ignored';

export interface Task {
  id: string;
  userId: string;
  orgId?: string;
  sessionId?: string;
  intentId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string;
  completedAt?: string;
  postponedUntil?: string;
  person?: string;
  place?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: TaskHistoryAction;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CheckinEvent {
  id: string;
  taskId: string;
  userId: string;
  sentAt: string;
  respondedAt?: string;
  responseAction?: CheckinAction;
  postponedUntil?: string;
  channel: string;
}
