import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, skip, take, throwError } from 'rxjs';

import {
  PositionApplicant,
  PositionApplicantsService,
} from '@features/positions/services/position-applicants.service';

import { PositionApplicantsPage } from './position-applicants.page';

describe('PositionApplicantsPage', () => {
  let fixture: ComponentFixture<PositionApplicantsPage>;
  let component: PositionApplicantsPage;
  let applicantsServiceSpy: jasmine.SpyObj<PositionApplicantsService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const applicants: PositionApplicant[] = [
    {
      applicationId: 1,
      candidateId: 7,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+331111111',
      status: 'applied',
      appliedAt: '2026-04-08T10:00:00Z',
      ongoingTestsCount: 2,
      ongoingTestIds: [10, 11],
      completedTestsCount: 1,
      completedTestIds: [12],
    },
    {
      applicationId: 2,
      candidateId: 8,
      fullName: 'John Smith',
      email: 'john@example.com',
      phone: '+33222222',
      status: 'applied',
      appliedAt: '2026-04-08T09:00:00Z',
      ongoingTestsCount: 0,
      ongoingTestIds: [],
      completedTestsCount: 0,
      completedTestIds: [],
    },
  ];

  beforeEach(async () => {
    applicantsServiceSpy = jasmine.createSpyObj<PositionApplicantsService>(
      'PositionApplicantsService',
      [
        'listByPosition',
        'rejectApplication',
      ],
    );
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    applicantsServiceSpy.listByPosition.and.returnValue(of(applicants));
    applicantsServiceSpy.rejectApplication.and.returnValue(of({ id: 2, status: 'rejected' }));
    routerSpy.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [PositionApplicantsPage],
      providers: [
        { provide: PositionApplicantsService, useValue: applicantsServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '9' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PositionApplicantsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads applicants for current position', () => {
    expect(applicantsServiceSpy.listByPosition).toHaveBeenCalledOnceWith(9);
    expect(component.isLoading).toBeFalse();
  });

  it('filters applicants by search query', (done) => {
    component.filteredApplicants$.pipe(skip(1), take(1)).subscribe((filteredApplicants) => {
      expect(filteredApplicants.length).toBe(1);
      expect(filteredApplicants[0].email).toBe('jane@example.com');
      done();
    });

    component.searchControl.setValue('jane');
  });

  it('sets error message when API fails', async () => {
    applicantsServiceSpy.listByPosition.and.returnValue(
      throwError(() => new Error('failed')),
    );

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PositionApplicantsPage],
      providers: [
        { provide: PositionApplicantsService, useValue: applicantsServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '9' }) } },
        },
      ],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(PositionApplicantsPage);
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.errorMessage).toBe(
      'Unable to load applicants for this position.',
    );
  });

  it('does not relaunch test for applicant with ongoing tests', () => {
    component.launchTest(applicants[0]);

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(component.launchMessage).toContain('already has an ongoing test');
  });

  it('opens the dedicated test relaunch workflow for an applicant without ongoing tests', () => {
    component.launchTest(applicants[1]);

    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/tests/relaunch', 8], {
      queryParams: { applicationId: 2 },
    });
  });

  it('renders completed tests as a green link to the filtered tests page', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector(
      'a.ff-status-pill--success',
    ) as HTMLAnchorElement | null;

    expect(link?.textContent).toContain('Tests effectues: 1');
    expect(link?.tagName).toBe('A');
  });
});
