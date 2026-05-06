/**
 * ----------------------------------------------------------------------------
 * UiTabsComponent
 * ----------------------------------------------------------------------------
 * Simple tabs component (routerless) for switching views inside a page:
 * e.g., Editor / Preview / Settings / History.
 *
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 * Usage :
 * <ui-tabs
 *  [variant]="'pill'"
 *  [items]="[
 *    { key: 'editor', label: 'Editor' },
 *    { key: 'preview', label: 'Preview' },
 *    { key: 'settings', label: 'Settings' },
 *    { key: 'history', label: 'History' }
 *  ]"
 *  [activeKey]="tab()"
 *  (activeKeyChange)="tab.set($event)"
 * ></ui-tabs>
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UiTabItem<K extends string = string> {
  key: K;
  label: string;
  disabled?: boolean;
}

type UiTabsVariant = 'pill' | 'underline';

@Component({
  standalone: true,
  selector: 'app-ui-tabs',
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
     @for (t of items; track t.key) {
        <button
          type="button"
          [disabled]="t.disabled"
          [class]="tabClasses(t.key, !!t.disabled)"
          (click)="setActive(t.key)"
        >
          {{ t.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTabsComponent<K extends string = string> {
  @Input() items: UiTabItem<K>[] = [];
  @Input() activeKey!: K;
  @Input() variant: UiTabsVariant = 'pill';

  @Output() activeKeyChange = new EventEmitter<K>();

  get containerClasses(): string {
    return this.variant === 'pill'
      ? 'inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-1'
      : 'flex items-center gap-4 border-b border-slate-800';
  }

  tabClasses(key: K, disabled: boolean): string {
    const isActive = key === this.activeKey;

    const base =
      'text-sm transition disabled:opacity-60 disabled:cursor-not-allowed';

    if (this.variant === 'underline') {
      return [
        base,
        'pb-2',
        isActive ? 'text-slate-100 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200',
        disabled ? '' : '',
      ].join(' ');
    }

    // pill
    return [
      base,
      'rounded-xl px-3 py-1.5',
      isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-300 hover:bg-slate-800/60',
    ].join(' ');
  }

  setActive(key: K): void {
    if (key === this.activeKey) return;
    this.activeKeyChange.emit(key);
  }
}
