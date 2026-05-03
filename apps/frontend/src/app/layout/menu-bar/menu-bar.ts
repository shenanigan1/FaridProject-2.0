import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AppNavigationItem } from '@shared/navigation/app-navigation';

export type MenuItem = AppNavigationItem;

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideDynamicIcon],
  templateUrl: './menu-bar.html',
  styleUrl: './menu-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarComponent {
  @Input({ required: true }) items!: MenuItem[];
  @Input() variant: 'desktop' | 'mobile' = 'desktop';

  trackByRoute(_: number, item: MenuItem): string {
    return item.route;
  }
}
