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

  it('uses the shared UI-book relaunch layout without inline card styles', () => {
    const host = fixture.nativeElement as HTMLElement;
    const card = host.querySelector<HTMLButtonElement>('[data-testid="relaunch-template-5"]');
    const sticky = host.querySelector<HTMLElement>('[data-testid="relaunch-selection-bar"]');

    expect(host.querySelector('.ff-page-bar')).not.toBeNull();
    expect(host.querySelector('.ff-workflow-hero')).not.toBeNull();
    expect(host.querySelector('.ff-filter-stack')).not.toBeNull();
    expect(host.querySelector('.ff-module-grid')).not.toBeNull();
    expect(card).not.toBeNull();
    expect(card?.classList.contains('ff-module-card')).toBeTrue();
    expect(card?.getAttribute('style') ?? '').not.toContain('text-align');
    expect(sticky?.classList.contains('ff-decision-bar')).toBeTrue();
  });

  it('filters modules by difficulty chip', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent ?? '').toContain('Conduite de Nuit');
    host.querySelector<HTMLButtonElement>('[data-testid="relaunch-filter-hard"]')?.click();
    fixture.detectChanges();

    expect(host.textContent ?? '').not.toContain('Conduite de Nuit');
    expect(host.textContent ?? '').toContain('Aucun module de test en base.');
  });
});
