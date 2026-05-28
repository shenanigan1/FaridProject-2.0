import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { JobOffer } from '@jobs/models/job-offer.model';

import { UiButtonPrimaryComponent } from '@lib-ui/button-primary/button-primary.component';
import { UiBadgeComponent } from '@lib-ui/badge/badge.component';


@Component({
  selector: 'app-job-offer-detail-card',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonPrimaryComponent,
    UiBadgeComponent,
  ],
  templateUrl: './job-offer-detail-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobOfferDetailCardComponent {
  @Input({ required: true }) offer!: JobOffer;

  @Output() readonly applyClicked = new EventEmitter<void>();

  onApplyButtonClicked(): void {
    this.applyClicked.emit();
  }
}
