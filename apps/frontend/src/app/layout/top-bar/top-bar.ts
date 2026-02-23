import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TopBarUser {
  fullName: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() user?: TopBarUser;
  @Input() notificationCount = 0;
}
