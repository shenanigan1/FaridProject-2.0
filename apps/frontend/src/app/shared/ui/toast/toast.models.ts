export type UiToastTone = 'success' | 'info' | 'warning' | 'error';

export interface UiToast {
  id: string;
  tone: UiToastTone;
  message: string;
  durationMs: number; // auto dismiss
}
