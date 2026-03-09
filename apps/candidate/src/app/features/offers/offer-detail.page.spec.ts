import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OfferDetailPage } from './offer-detail.page';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

describe('OfferDetailPage', () => {
  let fixture: ComponentFixture<OfferDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: CandidatePortalService,
          useValue: {
            getOfferById: () => ({ id: 1, title: 'Offre', location: 'x', contractType: 'CDI', salaryRange: 'x', description: 'x', requirements: [] }),
            applyToOffer: async () => 'auth_required',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferDetailPage);
    fixture.componentRef.setInput('offerId', 1);
    fixture.detectChanges();
  });

  it('shows auth message when applying while disconnected', async () => {
    await fixture.componentInstance.apply();
    expect(fixture.componentInstance.feedbackMessage).toContain('compte');
  });
});
