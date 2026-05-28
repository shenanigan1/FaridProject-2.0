import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TestsAdminBffService } from '../services/tests-admin-bff.service';
import { LaunchEvaluationPage } from './launch-evaluation.page';

describe('LaunchEvaluationPage', () => {
  let fixture: ComponentFixture<LaunchEvaluationPage>;
  let component: LaunchEvaluationPage;
  let bff: jasmine.SpyObj<TestsAdminBffService>;

  beforeEach(async () => {
    bff = jasmine.createSpyObj<TestsAdminBffService>('TestsAdminBffService', [
      'getLaunchContext',
      'launchEvaluation',
    ]);
    bff.getLaunchContext.and.returnValue(
      of({
        applicationId: 3,
        templateId: 9,
        templateName: 'Évaluation Globale Chauffeur CDL-A',
        sections: [
          { id: 1, title: 'Conduite de Nuit', weight: 40, points: 40, durationMinutes: 45 },
          { id: 2, title: 'Habilitation Hazmat', weight: 25, points: 25, durationMinutes: 30 },
        ],
        managers: [{ id: 7, full_name: 'Marc Manager', email: 'marc@example.com' }],
      }),
    );
    bff.launchEvaluation.and.returnValue(of([{ id: 30, application: 3, status: 'in_progress' }]));

    await TestBed.configureTestingModule({
      imports: [LaunchEvaluationPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: '3', templateId: '9' }) } },
        },
        { provide: TestsAdminBffService, useValue: bff },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LaunchEvaluationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('blocks launch until every section has a manager', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.ff-page-bar')).not.toBeNull();
    expect(host.querySelector('.ff-workflow-hero')).not.toBeNull();
    expect(host.querySelector('.ff-decision-bar')).not.toBeNull();

    component.launch();

    expect(bff.launchEvaluation).not.toHaveBeenCalled();
    expect(component.error()).toBe('Assigne un manager a chaque module avant de lancer l evaluation.');
  });

  it('launches evaluation with manager assignments for every section', () => {
    component.setManager(1, '7');
    component.setManager(2, '7');
    component.launch();

    expect(bff.launchEvaluation).toHaveBeenCalledWith(3, 9, [
      { section_id: 1, manager_id: 7 },
      { section_id: 2, manager_id: 7 },
    ]);
  });
});
