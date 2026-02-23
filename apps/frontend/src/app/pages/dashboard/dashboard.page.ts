import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
