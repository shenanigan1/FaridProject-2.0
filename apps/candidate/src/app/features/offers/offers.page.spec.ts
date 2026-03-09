import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { OffersPage } from './offers.page';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

describe('OffersPage', () => {
  let fixture: ComponentFixture<OffersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffersPage],
      providers: [
        provideRouter([]),
        {
          provide: CandidatePortalService,
          useValue: {
            offers: signal([
              { id: 1, title: 'Offre 1', location: 'Paris', contractType: 'CDI', salaryRange: 'x', description: 'd', requirements: [] },
            ]),
            loadOffers: async () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OffersPage);
    fixture.detectChanges();
  });

  it('renders the available offers', () => {
    const cards = fixture.nativeElement.querySelectorAll('.offer-card');
    expect(cards.length).toBeGreaterThan(0);
  });
});
