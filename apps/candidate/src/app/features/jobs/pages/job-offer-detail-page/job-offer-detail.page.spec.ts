import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { AuthService, AuthenticatedCandidate } from '@core/auth/services/auth.service';
import { JobOffer } from '@jobs/models/job-offer.model';
import { JobApplicationService } from '@jobs/services/job-application.service';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';

import { JobOfferDetailPageComponent } from './job-offer-detail.page';

describe('JobOfferDetailPageComponent', () => {
  let fixture: ComponentFixture<JobOfferDetailPageComponent>;
  let component: JobOfferDetailPageComponent;
  let jobPublicApiServiceSpy: jasmine.SpyObj<JobPublicApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let jobApplicationServiceSpy: jasmine.SpyObj<JobApplicationService>;

  const mockOffer: JobOffer = {
    id: 1,
    title: 'Backend Developer',
    location: 'Paris',
    contractType: 'CDI',
    description: 'Detailed job description',
    department: 'Engineering',
    salary: 50000,
    createdAt: '2026-03-19T10:00:00Z',
  };

  const mockCandidate: AuthenticatedCandidate = {
    candidateId: 4,
    email: 'candidate@example.com',
    firstName: 'Alice',
    lastName: 'Martin',
    phone: '+33102030405',
  };

  async function createComponentWithRouteId(routeId: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [JobOfferDetailPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: routeId }),
            },
          },
        },
        {
          provide: JobPublicApiService,
          useValue: jobPublicApiServiceSpy,
        },
        {
          provide: AuthService,
          useValue: authServiceSpy,
        },
        {
          provide: JobApplicationService,
          useValue: jobApplicationServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobOfferDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    jobPublicApiServiceSpy = jasmine.createSpyObj<JobPublicApiService>(
      'JobPublicApiService',
      ['getOfferById'],
    );
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'getAuthenticatedCandidate',
    ]);
    jobApplicationServiceSpy = jasmine.createSpyObj<JobApplicationService>(
      'JobApplicationService',
      ['applyToOffer'],
    );

    authServiceSpy.isAuthenticated.and.returnValue(false);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(null);
    jobApplicationServiceSpy.applyToOffer.and.returnValue(
      of({ id: 12, position: 1, candidate: 4, status: 'applied' }),
    );
  });

  it('should create', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));

    await createComponentWithRouteId('1');

    expect(component).toBeTruthy();
  });

  it('should load offer and set success state', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));

    await createComponentWithRouteId('1');

    expect(jobPublicApiServiceSpy.getOfferById).toHaveBeenCalledOnceWith(1);
    expect(component.offer).toEqual(mockOffer);
    expect(component.state).toBe('success');
  });

  it('should render offer content in success state', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));

    await createComponentWithRouteId('1');

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Backend Developer');
    expect(compiled.textContent).toContain('Paris');
    expect(compiled.textContent).toContain('CDI');
    expect(compiled.textContent).toContain('Engineering');
  });

  it('should set not-found state on 404 error', async () => {
    const notFoundError = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
    });

    jobPublicApiServiceSpy.getOfferById.and.returnValue(
      throwError(() => notFoundError),
    );

    await createComponentWithRouteId('1');

    expect(component.offer).toBeNull();
    expect(component.state).toBe('not-found');
  });

  it('should render not-found message', async () => {
    const notFoundError = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
    });

    jobPublicApiServiceSpy.getOfferById.and.returnValue(
      throwError(() => notFoundError),
    );

    await createComponentWithRouteId('1');

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Offer not found');
  });

  it('should set error state on non-404 error', async () => {
    const serverError = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    });

    jobPublicApiServiceSpy.getOfferById.and.returnValue(
      throwError(() => serverError),
    );

    await createComponentWithRouteId('1');

    expect(component.offer).toBeNull();
    expect(component.state).toBe('error');
  });

  it('should render error message', async () => {
    const serverError = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    });

    jobPublicApiServiceSpy.getOfferById.and.returnValue(
      throwError(() => serverError),
    );

    await createComponentWithRouteId('1');

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('We could not load this job offer right now. Please try again later.');
  });

  it('should set not-found state if id is invalid', async () => {
    await createComponentWithRouteId('invalid-id');

    expect(jobPublicApiServiceSpy.getOfferById).not.toHaveBeenCalled();
    expect(component.offer).toBeNull();
    expect(component.state).toBe('not-found');
  });

  it('should call onApplyClicked when apply button is clicked', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));

    await createComponentWithRouteId('1');

    spyOn(component, 'onApplyClicked');

    const button = fixture.debugElement.query(
      By.css('[data-testid="apply-button"] button'),
    ).nativeElement as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(component.onApplyClicked).toHaveBeenCalledTimes(1);
  });

  it('opens auth modal when user is not authenticated', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));
    authServiceSpy.isAuthenticated.and.returnValue(false);

    await createComponentWithRouteId('1');

    component.onApplyClicked();

    expect(component.authModalOpen).toBeTrue();
    expect(component.applicationModalOpen).toBeFalse();
  });

  it('opens application modal with prefilled profile when user is authenticated', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(mockCandidate);

    await createComponentWithRouteId('1');

    component.onApplyClicked();

    expect(component.applicationModalOpen).toBeTrue();
    expect(component.applicationForm.getRawValue()).toEqual({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'candidate@example.com',
      phone: '+33102030405',
      motivation: '',
    });
  });

  it('resumes flow after auth success and opens application form', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(mockCandidate);

    await createComponentWithRouteId('1');

    component.authModalOpen = true;
    component.onAuthSuccess();

    expect(component.authModalOpen).toBeFalse();
    expect(component.applicationModalOpen).toBeTrue();
  });



  it('does not submit when application form is invalid', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(mockCandidate);

    await createComponentWithRouteId('1');

    component.onApplyClicked();
    component.applicationForm.patchValue({ motivation: '' });

    component.onApplicationSubmitted();

    expect(jobApplicationServiceSpy.applyToOffer).not.toHaveBeenCalled();
    expect(component.applicationSubmitted).toBeFalse();
  });

  it('submits the application when form is valid', async () => {
    jobPublicApiServiceSpy.getOfferById.and.returnValue(of(mockOffer));
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getAuthenticatedCandidate.and.returnValue(mockCandidate);

    await createComponentWithRouteId('1');

    component.onApplyClicked();
    component.applicationForm.patchValue({ motivation: 'I can start next week.' });

    component.onApplicationSubmitted();

    expect(jobApplicationServiceSpy.applyToOffer).toHaveBeenCalledWith({
      positionId: 1,
      candidateId: 4,
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'candidate@example.com',
      phone: '+33102030405',
      motivation: 'I can start next week.',
    });
    expect(component.applicationSubmitted).toBeTrue();
    expect(component.applicationModalOpen).toBeFalse();
  });
});
