import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { TestsAdminBffService } from '../services/tests-admin-bff.service';
import { RelaunchTestPage } from './relaunch-test.page';

describe('RelaunchTestPage', () => {
  let fixture: ComponentFixture<RelaunchTestPage>;
  let component: RelaunchTestPage;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const bff = jasmine.createSpyObj<TestsAdminBffService>('TestsAdminBffService', ['listTemplates']);
    bff.listTemplates.and.returnValue(
      of([
        {
          id: 5,
          name: 'Conduite de Nuit',
          description: 'Evaluation en conditions faibles.',
          difficulty: 'medium',
          durationMinutes: 45,
          pointsTotal: 40,
        },
      ]),
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [RelaunchTestPage],
      providers: [
        { provide: TestsAdminBffService, useValue: bff },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ candidateId: '8' }),
              queryParamMap: convertToParamMap({ applicationId: '12' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelaunchTestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders modules from templates API and navigates to launch screen', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Conduite de Nuit');

    component.confirmSelection();

    expect(router.navigate).toHaveBeenCalledWith(['/tests/launch', 12, 5]);
  });
});
