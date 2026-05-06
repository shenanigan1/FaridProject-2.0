import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ManagerTestsService } from '../services/manager-tests.service';
import { ManagerTestsPage } from './manager-tests.page';

describe('ManagerTestsPage', () => {
  let fixture: ComponentFixture<ManagerTestsPage>;
  let component: ManagerTestsPage;
  let testsSpy: jasmine.SpyObj<ManagerTestsService>;

  beforeEach(async () => {
    testsSpy = jasmine.createSpyObj<ManagerTestsService>('ManagerTestsService', [
      'listAssignedTests',
    ]);

    testsSpy.listAssignedTests.and.returnValue(
      of([
        {
          id: 42,
          status: 'in_progress',
          candidateName: 'Jean Dupont',
          candidateEmail: 'jean@example.com',
          positionTitle: 'Conducteur',
          templateName: 'Conduite',
          createdAt: '2026-04-01T08:00:00Z',
          updatedAt: '2026-04-01T09:00:00Z',
          completedAt: null,
          validatedAt: null,
        },
        {
          id: 43,
          status: 'validated',
          candidateName: 'Marie Lefebvre',
          candidateEmail: 'marie@example.com',
          positionTitle: 'Porteur',
          templateName: 'Securite',
          createdAt: '2026-04-01T08:00:00Z',
          updatedAt: '2026-04-03T09:00:00Z',
          completedAt: '2026-04-02T09:00:00Z',
          validatedAt: '2026-04-03T09:00:00Z',
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ManagerTestsPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        { provide: ManagerTestsService, useValue: testsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerTestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads assigned tests and defaults to todo tab', () => {
    expect(testsSpy.listAssignedTests).toHaveBeenCalledTimes(1);
    expect(component.filteredTests().map((test) => test.id)).toEqual([42]);
  });

  it('shows manager history on history tab', () => {
    component.setTab('history');

    expect(component.filteredTests().map((test) => test.id)).toEqual([43]);
  });
});
