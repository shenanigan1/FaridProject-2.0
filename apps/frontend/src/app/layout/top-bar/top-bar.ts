import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
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
  @Output() editProfile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

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
}
