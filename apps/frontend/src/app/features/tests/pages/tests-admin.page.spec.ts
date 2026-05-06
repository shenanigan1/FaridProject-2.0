import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TestsAdminBffService } from '../services/tests-admin-bff.service';
import { TestsAdminPage } from './tests-admin.page';

describe('TestsAdminPage workflow', () => {
  let fixture: ComponentFixture<TestsAdminPage>;
  let bff: jasmine.SpyObj<TestsAdminBffService>;

  beforeEach(async () => {
    bff = jasmine.createSpyObj<TestsAdminBffService>('TestsAdminBffService', [
      'listActiveTests',
      'listValidationQueue',
      'listTemplates',
    ]);
    bff.listActiveTests.and.returnValue(
      of([
        {
          evaluationId: 1,
          applicationId: 101,
          candidateName: 'Nadia Benali',
          candidateEmail: 'nadia@example.com',
          templateName: 'Conduite de Nuit',
          positionTitle: 'Driver',
          status: 'in_progress',
          statusLabel: 'En cours',
          receivedAt: '2026-05-01T10:00:00Z',
          progressPercent: 66,
          completedSectionsCount: 2,
          totalSectionsCount: 3,
        },
        {
          evaluationId: 2,
          applicationId: 102,
          candidateName: 'John Doe',
          candidateEmail: 'john@example.com',
          templateName: 'Hazmat',
          positionTitle: 'Driver',
          status: 'completed',
          statusLabel: 'Score sous revue',
          receivedAt: '2026-05-02T10:00:00Z',
          progressPercent: 100,
          completedSectionsCount: 2,
          totalSectionsCount: 2,
        },
        {
          evaluationId: 3,
          applicationId: 103,
          candidateName: 'Sarah Miller',
          candidateEmail: 'sarah@example.com',
          templateName: 'Routier',
          positionTitle: 'Driver',
          status: 'validated',
          statusLabel: 'Valide',
          receivedAt: '2026-05-03T10:00:00Z',
          progressPercent: 100,
          completedSectionsCount: 1,
          totalSectionsCount: 1,
        },
      ]),
    );
    bff.listValidationQueue.and.returnValue(
      of([
        {
          evaluationId: 1,
          applicationId: 101,
          candidateName: 'Nadia Benali',
          candidateEmail: 'nadia@example.com',
          templateName: 'Conduite de Nuit',
          positionTitle: 'Driver',
          status: 'completed',
          statusLabel: 'Score sous revue',
          receivedAt: '2026-05-01T10:00:00Z',
        },
      ]),
    );
    bff.listTemplates.and.returnValue(
      of([
        {
          id: 8,
          name: 'Sécurité Hazmat',
          description: 'Procédures dangereuses',
          difficulty: 'hard',
          durationMinutes: 45,
          pointsTotal: 100,
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [TestsAdminPage],
      providers: [
        provideRouter([]),
        { provide: TestsAdminBffService, useValue: bff },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestsAdminPage);
    fixture.detectChanges();
  });

  it('renders all configured admin tests with progress from evaluations API', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Tests');
    expect(text).toContain('Nadia Benali');
    expect(text).toContain('John Doe');
    expect(text).toContain('Sarah Miller');
    expect(text).toContain('66%');
    expect(text).toContain('2 / 3');
  });

  it('filters tests by search query and status', () => {
    fixture.componentInstance.searchControl.setValue('hazmat');
    fixture.componentInstance.setStatusFilter('completed');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('John Doe');
    expect(text).not.toContain('Nadia Benali');
    expect(text).not.toContain('Sarah Miller');
  });

  it('initializes tests filters from jobs applicant link query params', async () => {
    await TestBed.resetTestingModule();
    bff.listActiveTests.and.returnValue(
      of([
        {
          evaluationId: 4,
          applicationId: 22,
          candidateName: 'Marc Driver',
          candidateEmail: 'marc@example.com',
          templateName: 'Conduite',
          positionTitle: 'Driver',
          status: 'completed',
          statusLabel: 'Score sous revue',
          receivedAt: '2026-05-03T10:00:00Z',
          progressPercent: 100,
          completedSectionsCount: 2,
          totalSectionsCount: 2,
        },
        {
          evaluationId: 5,
          applicationId: 23,
          candidateName: 'Marc Driver',
          candidateEmail: 'marc@example.com',
          templateName: 'Hazmat',
          positionTitle: 'Other position',
          status: 'validated',
          statusLabel: 'Valide',
          receivedAt: '2026-05-04T10:00:00Z',
          progressPercent: 100,
          completedSectionsCount: 1,
          totalSectionsCount: 1,
        },
      ]),
    );
    bff.listTemplates.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TestsAdminPage],
      providers: [
        provideRouter([]),
        { provide: TestsAdminBffService, useValue: bff },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                q: 'marc@example.com',
                status: 'done',
                applicationId: '22',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    const queryFixture = TestBed.createComponent(TestsAdminPage);
    queryFixture.detectChanges();
    const queryComponent = queryFixture.componentInstance;

    expect(queryComponent.searchControl.value).toBe('marc@example.com');
    expect(queryComponent.statusFilter()).toBe('done');
    expect(queryComponent.filteredActiveTests().map((test) => test.evaluationId)).toEqual([4]);
  });

  it('sorts tests by progress when requested', () => {
    fixture.componentInstance.setSort('progress_asc');
    fixture.detectChanges();

    const tests = fixture.componentInstance.filteredActiveTests();

    expect(tests.map((test) => test.evaluationId)).toEqual([1, 2, 3]);
  });

  it('switches to templates and renders backend templates', () => {
    fixture.componentInstance.setView('templates');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Templates de Test');
    expect(text).toContain('Sécurité Hazmat');
    expect(text).toContain('100 pts');
  });
});
