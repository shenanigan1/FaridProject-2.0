import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      ]),
    );
    bff.listValidationQueue.and.returnValue(
      of([
        {
          evaluationId: 1,
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
      providers: [provideRouter([]), { provide: TestsAdminBffService, useValue: bff }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestsAdminPage);
    fixture.detectChanges();
  });

  it('renders unfinished tests with progress from evaluations API', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Tests');
    expect(text).toContain('Nadia Benali');
    expect(text).toContain('66%');
    expect(text).toContain('2 / 3');
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
