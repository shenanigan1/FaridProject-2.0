import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, skip, take, throwError } from 'rxjs';

import {
  CandidateDto,
  CandidatesApiService,
} from '@features/candidates/services/candidates-api.service';

import { CandidatesListPage } from './candidates-list.page';

describe('CandidatesListPage', () => {
  let fixture: ComponentFixture<CandidatesListPage>;
  let component: CandidatesListPage;
  let candidatesApiSpy: jasmine.SpyObj<CandidatesApiService>;

  const mockCandidates: CandidateDto[] = [
    {
      id: 1,
      user: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+331111111',
      },
      status: 'pending',
      flag: false,
      created_at: '2026-04-08T10:00:00Z',
      updated_at: '2026-04-08T10:00:00Z',
    },
    {
      id: 2,
      user: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '+332222222',
      },
      status: 'approved',
      flag: false,
      created_at: '2026-04-08T10:00:00Z',
      updated_at: '2026-04-08T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    candidatesApiSpy = jasmine.createSpyObj<CandidatesApiService>('CandidatesApiService', ['list']);
    candidatesApiSpy.list.and.returnValue(of(mockCandidates));

    await TestBed.configureTestingModule({
      imports: [CandidatesListPage],
      providers: [{ provide: CandidatesApiService, useValue: candidatesApiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidatesListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads candidates on init', () => {
    expect(candidatesApiSpy.list).toHaveBeenCalledTimes(1);
    expect(component.isLoading).toBeFalse();
  });

  it('filters candidates by search query', (done) => {
    component.filteredCandidates$.pipe(skip(1), take(1)).subscribe((results) => {
      expect(results.length).toBe(1);
      expect(results[0].user.email).toBe('jane@example.com');
      done();
    });

    component.searchControl.setValue('jane');
  });

  it('shows error message when API fails', async () => {
    candidatesApiSpy.list.and.returnValue(throwError(() => new Error('boom')));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CandidatesListPage],
      providers: [{ provide: CandidatesApiService, useValue: candidatesApiSpy }],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(CandidatesListPage);
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.errorMessage).toBe(
      'Unable to load candidates right now.',
    );
  });
});
