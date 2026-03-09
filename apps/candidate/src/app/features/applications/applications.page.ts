import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

@Component({
  selector: 'app-applications-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss',
})
export class ApplicationsPage implements OnInit {
  private readonly portalService = inject(CandidatePortalService);

  readonly isAuthenticated = this.portalService.isAuthenticated;
  readonly applications = this.portalService.currentApplications;

  async ngOnInit(): Promise<void> {
    if (this.isAuthenticated()) {
      await this.portalService.loadApplications();
    }
  }
}
