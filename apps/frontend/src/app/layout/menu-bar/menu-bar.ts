import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideDynamicIcon} from '@lucide/angular';
import { AppIcon } from '@shared/icons/app-icons';

export interface MenuItem {
  label: string;
  icon: AppIcon;
  route: string;
}

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideDynamicIcon],
  templateUrl: './menu-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarComponent {
  @Input({ required: true }) items!: MenuItem[];

  trackByRoute(_: number, item: MenuItem): string {
    return item.route;
  }
}