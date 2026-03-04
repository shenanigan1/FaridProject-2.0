import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthSessionService } from '@auth/services/auth-session.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
