import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { JobOffer } from '../../models/job-offer.model';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './job-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobCardComponent {
  @Input({ required: true }) job!: JobOffer;

}
