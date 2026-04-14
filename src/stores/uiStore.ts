import { create } from 'zustand';

export type ModalName =
  | 'createTask'
  | 'editTask'
  | 'deleteTask'
  | 'voiceCapture'
  | 'taskDetail'
  | 'settings'
  | null;

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  variant: NotificationVariant;
  /** Auto-dismiss after this many milliseconds. Omit for persistent. */
  durationMs?: number;
}

interface UiStore {
  // State
  isSidebarOpen: boolean;
  activeModal: ModalName;
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: ModalName) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  notifications: [],

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    return id;
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
