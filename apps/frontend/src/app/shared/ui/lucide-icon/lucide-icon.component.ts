import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';

const LUCIDE_PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.25 9.75V21h13.5V9.75',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M15 7a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6 14v-2a4 4 0 0 0-3-3.87M16.5 3.13a4 4 0 0 1 0 7.75',
  briefcase:
    'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m5 3H3v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9ZM3 10l9 4 9-4',
  'clipboard-check':
    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 0 0 6 0M9 5a3 3 0 0 1 6 0m-7 9 2 2 4-4',
  'layout-grid': 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  'folder-kanban':
    'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3V6zm0 4h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zm4 2v6m4-4v4m4-2v2',
  'file-text':
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 1v5h5M8 13h8M8 17h8M8 9h3',
  settings:
    'm12 15.5 2-1.1 2 .2 1-1.8-1.2-1.6.2-2 1.7-1-1-1.8-2 .2L12 4.5 10 3.4l-2 .2-1 1.8 1.7 1-.2 2-1.2 1.6 1 1.8 2-.2L12 15.5Zm0-2.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
  'clipboard-list':
    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 0 0 6 0M9 12h6M9 16h6',
  'alert-triangle':
    'M10.3 3.9 1.8 18A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01',
  building: 'M3 21h18M6 21V7l6-4 6 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01',
  inbox: 'M3 12h5l2 3h4l2-3h5M5 3h14a2 2 0 0 1 2 2v14H3V5a2 2 0 0 1 2-2Z',
  user: 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  'badge-check':
    'M9 11 11 13 15 9M12 3l2.5 2 3.5.5.5 3.5L20 12l-1.5 3-.5 3.5-3.5.5L12 21l-2.5-2-3.5-.5-.5-3.5L4 12l1.5-3 .5-3.5 3.5-.5L12 3Z',
  shield: 'M12 2 4 6v6c0 5.5 3.8 9.7 8 10 4.2-.3 8-4.5 8-10V6l-8-4Z',
  truck:
    'M10 17h4M3 5h11v9H3V5Zm11 3h4l3 3v3h-7V8Zm-7 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v6l4 2',
  menu: 'M3 6h18M3 12h18M3 18h18',
  'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  trash: 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 19h14',
  'plus-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM8 12h8M12 8v8',
  'ellipsis-vertical': 'M12 5h.01M12 12h.01M12 19h.01',
};

@Component({
  selector: 'app-lucide-icon',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="'0 0 24 24'"
      [attr.class]="sizeClass"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
    >
      <path [attr.d]="path()" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LucideIconComponent {
  @Input({ required: true }) name!: string;
  @Input() sizeClass = 'h-4 w-4';
  @Input() strokeWidth = 1.9;

  readonly path = computed(() => LUCIDE_PATHS[this.name] ?? LUCIDE_PATHS['home']);
}
