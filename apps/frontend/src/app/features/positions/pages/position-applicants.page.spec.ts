import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  PositionApplicant,
  PositionApplicantsService,
} from '@features/positions/services/position-applicants.service';

import { PositionApplicantsPage } from './position-applicants.page';

describe('PositionApplicantsPage', () => {
  let fixture: ComponentFixture<PositionApplicantsPage>;
  let component: PositionApplicantsPage;
  let applicantsServiceSpy: jasmine.SpyObj<PositionApplicantsService>;

  const applicants: PositionApplicant[] = [
    {
      applicationId: 1,
      candidateId: 7,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+331111111',
      status: 'applied',
      appliedAt: '2026-04-08T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    applicantsServiceSpy = jasmine.createSpyObj<PositionApplicantsService>(
      'PositionApplicantsService',
      ['listByPosition'],
    );

    applicantsServiceSpy.listByPosition.and.returnValue(of(applicants));

    await TestBed.configureTestingModule({
      imports: [PositionApplicantsPage],
      providers: [
        { provide: PositionApplicantsService, useValue: applicantsServiceSpy },
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
    component.searchControl.setValue('jane');

    component.filteredApplicants$.subscribe((filteredApplicants) => {
      expect(filteredApplicants.length).toBe(1);
      expect(filteredApplicants[0].email).toBe('jane@example.com');
      done();
    });
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
});
