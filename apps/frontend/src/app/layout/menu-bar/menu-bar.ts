import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarComponent {
  @Input({ required: true }) items!: MenuItem[];

  private readonly iconPaths: Record<string, string> = {
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
  };

  trackByRoute(_: number, item: { route: string }): string {
    return item.route;
  }

  iconPath(icon: string): string {
    return this.iconPaths[icon] ?? this.iconPaths.home;
  }
}
