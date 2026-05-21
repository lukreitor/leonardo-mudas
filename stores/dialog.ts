import { create } from 'zustand';

export type DialogButton = {
  label: string;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  onPress?: () => void;
};

export type DialogIcon = 'warning' | 'check' | 'info' | 'trash' | 'save' | 'error' | 'leaf';

export type DialogPayload = {
  title: string;
  body?: string;
  buttons?: DialogButton[];
  icon?: DialogIcon;
};

type DialogState = {
  current: DialogPayload | null;
  show: (p: DialogPayload) => void;
  hide: () => void;
};

export const useDialog = create<DialogState>((set) => ({
  current: null,
  show: (p) => set({ current: p }),
  hide: () => set({ current: null }),
}));

export function showDialog(payload: DialogPayload) {
  useDialog.getState().show(payload);
}

export function hideDialog() {
  useDialog.getState().hide();
}
