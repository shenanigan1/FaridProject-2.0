import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  label: string;
  icon: string; // for now emoji, later replace by icon component
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
}
