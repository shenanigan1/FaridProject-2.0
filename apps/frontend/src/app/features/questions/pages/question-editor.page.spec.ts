import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';

import { QuestionEditorPageComponent } from './question-editor.page';
import { SkillQuestionsStore } from '@features/questions/services/skill-questions.store';
import { SkillQuestion } from '@features/questions/models/skill-question.model';

// ---- STUBS (ESLint clean) ----
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

function noop(): void {
  return;
}

@Component({
  selector: 'app-ui-text-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppUiTextInputStubComponent),
      multi: true,
    },
  ],
  template: '',
})
class AppUiTextInputStubComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() type?: string;

  private onChangeFn: (value: string) => void = noop;
  private onTouchedFn: () => void = noop;

  writeValue(value: string): void {
    void value;
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  emit(value: string): void {
    this.onChangeFn(value);
    this.onTouchedFn();
  }
}

@Component({
  selector: 'app-ui-select',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppUiSelectStubComponent),
      multi: true,
    },
  ],
  template: '',
})
class AppUiSelectStubComponent<T extends string> implements ControlValueAccessor {
  @Input() options: { value: T; label: string }[] = [];
  @Input() placeholder?: string;

  private onChangeFn: (value: T) => void = noop;
  private onTouchedFn: () => void = noop;

  writeValue(value: T): void {
    void value;
  }
  registerOnChange(fn: (value: T) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  emit(value: T): void {
    this.onChangeFn(value);
    this.onTouchedFn();
  }
}

@Component({ selector: 'app-ui-tabs', standalone: true, template: '' })
class AppUiTabsStubComponent<T extends string> {
  @Input() items: { key: T; label: string }[] = [];
  @Input() activeKey!: T;
  @Output() activeKeyChange = new EventEmitter<T>();
}

@Component({ selector: 'app-ui-icon-button', standalone: true, template: '<ng-content />' })
class AppUiIconButtonStubComponent {
  @Input() ariaLabel?: string;
}

@Component({ selector: 'app-ui-button-primary', standalone: true, template: '<ng-content />' })
class AppUiButtonPrimaryStubComponent {
  @Input() disabled?: boolean;
  @Input() loading?: boolean;
}

@Component({ selector: 'app-ui-button-secondary', standalone: true, template: '<ng-content />' })
class AppUiButtonSecondaryStubComponent {}
// ---- END STUBS ----

interface SkillQuestionsStoreMock {
  isLoading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  loadOne: jasmine.Spy<(id: string, cb: (row: SkillQuestion | null) => void) => void>;
  createInPool: jasmine.Spy<(poolId: string, dto: unknown, onSuccess?: (created: SkillQuestion) => void) => void>;
  update: jasmine.Spy<(id: string, dto: unknown, onSuccess?: () => void) => void>;
}

function makeStoreMock(): SkillQuestionsStoreMock {
  return {
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadOne: jasmine.createSpy('loadOne'),
    createInPool: jasmine.createSpy('createInPool'),
    update: jasmine.createSpy('update'),
  };
}

function makeRoute(poolId: string | null, questionId: string | null): ActivatedRoute {
  return {
    snapshot: {
      paramMap: convertToParamMap({
        ...(poolId ? { poolId } : {}),
        ...(questionId ? { questionId } : {}),
      }),
    },
  } as unknown as ActivatedRoute;
}

function makeRouterMock(): jasmine.SpyObj<Router> {
  const r = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
  r.navigate.and.returnValue(Promise.resolve(true));
  r.navigateByUrl.and.returnValue(Promise.resolve(true));
  return r;
}

describe('QuestionEditorPageComponent', () => {
  function setup(opts: { poolId: string | null; questionId: string | null }) {
    const storeMock = makeStoreMock();
    const routerMock = makeRouterMock();

    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        QuestionEditorPageComponent,

        // template deps
        AppUiTextInputStubComponent,
        AppUiSelectStubComponent,
        AppUiTabsStubComponent,
        AppUiIconButtonStubComponent,
        AppUiButtonPrimaryStubComponent,
        AppUiButtonSecondaryStubComponent,
      ],
      providers: [
        { provide: SkillQuestionsStore, useValue: storeMock },
        { provide: ActivatedRoute, useValue: makeRoute(opts.poolId, opts.questionId) },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(QuestionEditorPageComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, storeMock, routerMock };
  }

  it('should redirect to /pools when poolId is missing', () => {
    const { routerMock } = setup({ poolId: null, questionId: null });
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/pools');
  });

  it('should init in create mode when questionId is missing', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: null });

    expect(component.poolId()).toBe('p1');
    expect(component.questionId()).toBeNull();
    expect(component.isEditMode()).toBeFalse();
    expect(storeMock.loadOne).not.toHaveBeenCalled();
  });

  it('should expose free text, yes/no and rating question types for pool authoring', () => {
    const { fixture, component } = setup({ poolId: 'p1', questionId: null });

    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Libre');
    expect(text).toContain('Oui/Non');
    expect(text).toContain('Note');

    component.setFormat('free_text');
    expect(component.form.controls.format.value).toBe('free_text');
  });

  it('should init in edit mode and call store.loadOne()', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: 'q42' });

    expect(component.isEditMode()).toBeTrue();
    expect(storeMock.loadOne).toHaveBeenCalledTimes(1);

    const [id, cb] = storeMock.loadOne.calls.mostRecent().args;
    expect(id).toBe('q42');
    expect(typeof cb).toBe('function');

    const row = {
      id: 'q42',
      format: 'true_false',
      title: 'My Title',
      text: 'Hello world',
      explanation: 'Expl',
      rubric: {},
      is_mandatory: true,
      points: 7,
      difficulty: 'hard',
      order: 3,
    } as unknown as SkillQuestion;

    cb(row);

    expect(component.form.controls.format.value).toBe('true_false');
    expect(component.form.controls.title.value).toBe('My Title');
    expect(component.form.controls.text.value).toBe('Hello world');
    expect(component.form.controls.is_mandatory.value).toBeTrue();
    expect(component.form.controls.points.value).toBe(7);
    expect(component.form.controls.difficulty.value).toBe('hard');
    expect(component.form.controls.order.value).toBe(3);
  });

  it('should load and save editable QCM answers from rubric options', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: 'q42' });

    const [, cb] = storeMock.loadOne.calls.mostRecent().args;
    cb({
      id: 'q42',
      poolId: 'p1',
      format: 'mcq',
      title: 'Controle securite',
      text: 'Quel equipement est requis ?',
      explanation: '',
      rubric: { options: ['Gilet', 'Sandales'] },
      is_mandatory: true,
      is_eliminatory: false,
      points: 10,
      difficulty: 'intermediate',
      order: 0,
      createdAt: '',
      updatedAt: '',
    });

    expect(component.form.controls.choice_options_text.value).toBe('Gilet\nSandales');

    component.form.controls.choice_options_text.setValue('Gilet\nCasque\nGants');
    component.save();

    const [, dto] = storeMock.update.calls.mostRecent().args;
    expect(dto).toEqual(jasmine.objectContaining({
      format: 'mcq',
      rubric: { options: ['Gilet', 'Casque', 'Gants'] },
    }));
  });

  it('should expose the correct answer field while editing QCM choices', () => {
    const { fixture, component, storeMock } = setup({ poolId: 'p1', questionId: null });

    component.form.controls.format.setValue('mcq');
    component.form.controls.title.setValue('Controle securite');
    component.form.controls.text.setValue('Quel equipement est requis ?');
    component.form.controls.choice_options_text.setValue('Gilet\nCasque\nGants');
    component.form.controls.explanation.setValue('  Casque  ');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Choix de reponse QCM');
    expect(text).toContain('Bonne reponse');

    component.save();

    const [, dto] = storeMock.createInPool.calls.mostRecent().args;
    expect(dto).toEqual(jasmine.objectContaining({
      format: 'mcq',
      explanation: 'Casque',
      rubric: {
        options: ['Gilet', 'Casque', 'Gants'],
        correct_answers: ['Casque'],
      },
    }));
  });

  it('should save eliminatory questions and multiple correct QCM answers', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: null });

    component.form.controls.format.setValue('mcq');
    component.form.controls.title.setValue('Controle EPI');
    component.form.controls.text.setValue('Quels EPI sont obligatoires ?');
    component.form.controls.choice_options_text.setValue('Gilet\nCasque\nSandales');
    component.form.controls.correct_answers_text.setValue('Gilet\nCasque');
    component.form.controls.is_eliminatory.setValue(true);

    component.save();

    const [, dto] = storeMock.createInPool.calls.mostRecent().args;
    expect(dto).toEqual(jasmine.objectContaining({
      is_eliminatory: true,
      explanation: 'Gilet\nCasque',
      rubric: {
        options: ['Gilet', 'Casque', 'Sandales'],
        correct_answers: ['Gilet', 'Casque'],
      },
    }));
  });

  it('should load and save editable rating bounds from rubric', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: 'q99' });

    const [, cb] = storeMock.loadOne.calls.mostRecent().args;
    cb({
      id: 'q99',
      poolId: 'p1',
      format: 'rating',
      title: 'Note conduite',
      text: 'Noter la conduite',
      explanation: '',
      rubric: { scoring: 'rating', min: 1, max: 5 },
      is_mandatory: false,
      is_eliminatory: false,
      points: 5,
      difficulty: 'easy',
      order: 0,
      createdAt: '',
      updatedAt: '',
    });

    expect(component.form.controls.rating_min.value).toBe(1);
    expect(component.form.controls.rating_max.value).toBe(5);

    component.form.controls.rating_min.setValue(0);
    component.form.controls.rating_max.setValue(10);
    component.save();

    const [, dto] = storeMock.update.calls.mostRecent().args;
    expect(dto).toEqual(jasmine.objectContaining({
      format: 'rating',
      rubric: { scoring: 'rating', min: 0, max: 10 },
    }));
  });

  it('back() should navigate to /pools/:poolId', () => {
    const { component, routerMock } = setup({ poolId: 'p9', questionId: null });

    component.back();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/pools', 'p9']);
  });

  it('save() should mark touched and do nothing when form is invalid', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: null });

    component.form.controls.text.setValue(''); // invalid (required + minLength)
    component.save();

    expect(component.form.touched).toBeTrue();
    expect(storeMock.createInPool).not.toHaveBeenCalled();
    expect(storeMock.update).not.toHaveBeenCalled();
  });

  it('save() should call store.createInPool in create mode', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: null });

    component.form.controls.format.setValue('mcq');
    component.form.controls.title.setValue('  T  ');
    component.form.controls.text.setValue('  Hello world  ');
    component.form.controls.explanation.setValue('  Exp  ');
    component.form.controls.is_mandatory.setValue(true);
    component.form.controls.points.setValue(10);
    component.form.controls.difficulty.setValue('easy');
    component.form.controls.order.setValue(2);

    component.save();

    expect(storeMock.createInPool).toHaveBeenCalledTimes(1);

    const [poolId, dto] = storeMock.createInPool.calls.mostRecent().args;
    expect(poolId).toBe('p1');

    expect(dto).toEqual({
      format: 'mcq',
      title: 'T',
      text: 'Hello world',
      explanation: 'Exp',
      rubric: {},
      is_mandatory: true,
      is_eliminatory: false,
      points: 10,
      difficulty: 'easy',
      order: 2,
    });
  });

  it('save() should create a scored free-text question', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: null });

    component.form.controls.format.setValue('free_text');
    component.form.controls.title.setValue('Observation manager');
    component.form.controls.text.setValue('Decrire la manoeuvre effectuee par le candidat');
    component.form.controls.points.setValue(20);
    component.form.controls.difficulty.setValue('intermediate');

    component.save();

    const [, dto] = storeMock.createInPool.calls.mostRecent().args;
    expect(dto).toEqual(jasmine.objectContaining({
      format: 'free_text',
      points: 20,
      rubric: jasmine.objectContaining({ scoring: 'manual' }),
    }));
  });

  it('saveAndAddAnother() should save, reset the form and stay on the same pool', () => {
    const { component, storeMock, routerMock } = setup({ poolId: 'p1', questionId: null });

    component.form.controls.format.setValue('free_text');
    component.form.controls.title.setValue('Observation manager');
    component.form.controls.text.setValue('Decrire la manoeuvre effectuee par le candidat');
    component.form.controls.points.setValue(20);

    component.saveAndAddAnother();

    expect(storeMock.createInPool).toHaveBeenCalledTimes(1);
    const [, , cb] = storeMock.createInPool.calls.mostRecent().args;
    expect(cb).toEqual(jasmine.any(Function));

    cb?.({
      id: 'q-new',
      poolId: 'p1',
      format: 'free_text',
      title: 'Observation manager',
      text: 'Decrire la manoeuvre effectuee par le candidat',
      explanation: '',
      rubric: { scoring: 'manual' },
      is_mandatory: false,
      is_eliminatory: false,
      points: 20,
      difficulty: 'intermediate',
      order: 0,
      createdAt: '',
      updatedAt: '',
    });

    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.form.controls.text.value).toBe('');
    expect(component.form.controls.points.value).toBe(10);
    expect(component.tab()).toBe('editor');
  });

  it('save() should call store.update in edit mode', () => {
    const { component, storeMock } = setup({ poolId: 'p1', questionId: 'q1' });

    component.form.controls.format.setValue('practical');
    component.form.controls.title.setValue('  Title  ');
    component.form.controls.text.setValue('  Some text  ');
    component.form.controls.explanation.setValue('   ');
    component.form.controls.is_mandatory.setValue(false);
    component.form.controls.points.setValue(5);
    component.form.controls.difficulty.setValue('intermediate');
    component.form.controls.order.setValue(0);

    component.save();

    expect(storeMock.update).toHaveBeenCalledTimes(1);

    const [qid, dto] = storeMock.update.calls.mostRecent().args;
    expect(qid).toBe('q1');

    expect(dto).toEqual({
      format: 'practical',
      title: 'Title',
      text: 'Some text',
      explanation: '',
      rubric: { scoring: 'manual', criteria: [] },
      is_mandatory: false,
      is_eliminatory: false,
      points: 5,
      difficulty: 'intermediate',
      order: 0,
    });
  });
});
