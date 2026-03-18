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

  get priorityClasses(): string {
    switch (this.job.priority) {
      case 'urgent':
        return 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/30';
    }
  }

  get statusClasses(): string {
    switch (this.job.status) {
      case 'active':
        return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30';
      case 'closed':
        return 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/30';
    }
  }
}
