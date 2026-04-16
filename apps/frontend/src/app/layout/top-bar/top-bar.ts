import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { APP_ICONS } from '@shared/icons/app-icons';
import { LucideDynamicIcon } from '@lucide/angular';

export interface TopBarUser {
  fullName: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './top-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() user?: TopBarUser;
  @Input() notificationCount = 0;
  @Output() editProfile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  readonly icons = APP_ICONS;
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  requestEditProfile(): void {
    this.menuOpen.set(false);
    this.editProfile.emit();
  }

  requestLogout(): void {
    this.menuOpen.set(false);
    this.logout.emit();
  }

  get userInitials(): string {
    if (!this.user?.fullName) {
      return 'U';
    }

    const initials = this.user.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return initials || 'U';
  }
}
