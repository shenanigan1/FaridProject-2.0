import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MyTestsPageComponent } from './my-tests.page';
import { EvaluationApiService } from '@features/evaluations/services/evaluation-api.service';

describe('MyTestsPageComponent', () => {
  let fixture: ComponentFixture<MyTestsPageComponent>;
  let component: MyTestsPageComponent;
  let evaluationApiServiceSpy: jasmine.SpyObj<EvaluationApiService>;

  beforeEach(async () => {
    evaluationApiServiceSpy = jasmine.createSpyObj<EvaluationApiService>('EvaluationApiService', [
      'listMyEvaluations',
    ]);

    await TestBed.configureTestingModule({
      imports: [MyTestsPageComponent],
      providers: [{ provide: EvaluationApiService, useValue: evaluationApiServiceSpy }],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(MyTestsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should load evaluations on init', fakeAsync(() => {
    evaluationApiServiceSpy.listMyEvaluations.and.returnValue(
      of([
        {
          id: 12,
          status: 'in_progress',
          createdAt: '2026-04-01T10:00:00Z',
          updatedAt: '2026-04-01T11:00:00Z',
          assignedTo: 2,
          subject: 8,
          position: 3,
        },
      ]),
    );

    createComponent();
    tick();
    fixture.detectChanges();

    expect(component.evaluations.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Evaluation #12');
  }));

  it('should render an error state when list fetch fails', fakeAsync(() => {
    evaluationApiServiceSpy.listMyEvaluations.and.returnValue(
      throwError(() => new Error('boom')),
    );

    createComponent();
    tick();
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Unable to load');
  }));
});
