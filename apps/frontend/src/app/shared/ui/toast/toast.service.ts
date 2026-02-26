/**
 * ----------------------------------------------------------------------------
 * ToastService
 * ----------------------------------------------------------------------------
 * Global toast notification queue.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { Injectable, signal } from '@angular/core';
import { UiToast, UiToastTone } from './toast.models';

type ToastOptions = {
  durationMs?: number;
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly maxVisible = 3;

  readonly toasts = signal<UiToast[]>([]);

  success(message: string, opts?: ToastOptions): void {
    this.push('success', message, opts);
  }
  info(message: string, opts?: ToastOptions): void {
    this.push('info', message, opts);
  }
  warning(message: string, opts?: ToastOptions): void {
    this.push('warning', message, opts);
  }
  error(message: string, opts?: ToastOptions): void {
    this.push('error', message, opts);
  }

  remove(id: string): void {
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }

  private push(tone: UiToastTone, message: string, opts?: ToastOptions): void {
    const toast: UiToast = {
      id: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
      tone,
      message,
      durationMs: opts?.durationMs ?? 3500,
    };

    const next = [toast, ...this.toasts()].slice(0, this.maxVisible);
    this.toasts.set(next);

    // auto-dismiss
    setTimeout(() => this.remove(toast.id), toast.durationMs);
  }
}
