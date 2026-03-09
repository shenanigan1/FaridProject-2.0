import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CandidatePortalService } from './candidate-portal.service';

describe('CandidatePortalService', () => {
  let service: CandidatePortalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CandidatePortalService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('http://localhost:8000/api/positions/').flush([]);
  });

  afterEach(() => httpMock.verify());

  it('loads offers from API', async () => {
    const promise = service.loadOffers();

    const req = httpMock.expectOne('http://localhost:8000/api/positions/');
    req.flush([
      {
        id: 1,
        company: 1,
        title: 'Conducteur',
        description: 'desc',
        department: 'Transport',
        contract_type: 'CDI',
        location: 'Lyon',
        salary: '2000',
        is_active: true,
      },
    ]);

    await promise;
    expect(service.offers().length).toBe(1);
  });

  it('requires authentication before applying', async () => {
    const result = await service.applyToOffer(1, 'Je suis motivée');
    expect(result).toBe('auth_required');
  });
});
