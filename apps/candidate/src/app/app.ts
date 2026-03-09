import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CandidatePortalService } from './core/services/candidate-portal.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly portalService = inject(CandidatePortalService);

  readonly currentUser = this.portalService.currentUser;
  readonly isAuthenticated = this.portalService.isAuthenticated;

  readonly profileMenuOpen = signal(false);

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.portalService.logout();
    this.profileMenuOpen.set(false);
  }

  @HostListener('document:click')
  closeMenuOnOutsideClick(): void {
    if (this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
