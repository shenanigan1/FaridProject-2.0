import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { SkillQuestionsStore } from './skill-questions.store';
import { SkillQuestionsApiService } from './skill-questions-api.service';
import { SkillQuestion, SkillQuestionDto } from 'src/app/features/questions/models/skill-question.model';
import { CreateSkillQuestionDto } from './skill-questions-api.service';

interface SkillQuestionsApiServiceMock {
  listByPool: jasmine.Spy<SkillQuestionsApiService['listByPool']>;
  createInPool: jasmine.Spy<SkillQuestionsApiService['createInPool']>;
  get: jasmine.Spy<SkillQuestionsApiService['get']>;
  update: jasmine.Spy<SkillQuestionsApiService['update']>;
  delete: jasmine.Spy<SkillQuestionsApiService['delete']>;
}

function makeApiMock(): SkillQuestionsApiServiceMock {
  return {
    listByPool: jasmine.createSpy('listByPool'),
    createInPool: jasmine.createSpy('createInPool'),
    get: jasmine.createSpy('get'),
    update: jasmine.createSpy('update'),
    delete: jasmine.createSpy('delete'),
  };
}

function makeDto(overrides: Partial<SkillQuestionDto> = {}): SkillQuestionDto {
  const now = new Date().toISOString();

  // NOTE: Si ton SkillQuestionDto a d'autres champs obligatoires, ajoute-les ici.
  // Ici on couvre ceux utilisés par le store.
  return {
    id: overrides.id ?? 'q1',
    pool: overrides.pool ?? 'p1',

    format: overrides.format ?? 'mcq',
    title: overrides.title ?? 'Title',
    text: overrides.text ?? 'Text',
    explanation: overrides.explanation ?? '',
    rubric: overrides.rubric ?? {},

    is_mandatory: overrides.is_mandatory ?? false,
    points: overrides.points ?? 10,
    difficulty: overrides.difficulty ?? 'intermediate',
    order: overrides.order ?? 0,

    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  } as SkillQuestionDto;
}

function httpError(status: number, errorBody: unknown): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    statusText: 'Error',
    url: '/api/test',
    error: errorBody,
  });
}

describe('SkillQuestionsStore', () => {
  const setup = () => {
    const apiMock = makeApiMock();

    TestBed.configureTestingModule({
      providers: [
        SkillQuestionsStore,
        { provide: SkillQuestionsApiService, useValue: apiMock },
      ],
    });

    const store = TestBed.inject(SkillQuestionsStore);
    return { store, apiMock };
  };

  it('loadByPool() should set items on success', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(
      of([makeDto({ id: '1', pool: 'p42' }), makeDto({ id: '2', pool: 'p42' })]),
    );

    store.loadByPool('p42');

    expect(apiMock.listByPool).toHaveBeenCalledOnceWith('p42');
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBeFalse();

    expect(store.items().length).toBe(2);
    expect(store.items()[0].id).toBe('1');
    expect(store.items()[0].poolId).toBe('p42');
  });

  it('loadByPool() should set error message on HttpErrorResponse with detail', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(
      throwError(() => httpError(400, { detail: 'Bad request' })),
    );

    store.loadByPool('p1');

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Bad request');
  });

  it('createInPool() should translate backend field validation errors for users', () => {
    const { store, apiMock } = setup();

    apiMock.createInPool.and.returnValue(
      throwError(() =>
        httpError(400, {
          rubric: ['Rubric is required for practical questions.'],
        }),
      ),
    );

    store.createInPool('p1', { format: 'practical', text: 'Controle pratique' });

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe("Grille d'evaluation : champ obligatoire");
  });

  it('loadByPool() should set network error message when status=0', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(throwError(() => httpError(0, null)));

    store.loadByPool('p1');

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Connexion impossible avec le serveur.');
  });

  it('loadOne() should call onSuccess with mapped entity', () => {
    const { store, apiMock } = setup();

    apiMock.get.and.returnValue(of(makeDto({ id: 'q99', pool: 'p9', text: 'Hello' })));

    const onSuccess = jasmine.createSpy('onSuccess') as jasmine.Spy<(row: SkillQuestion) => void>;

    store.loadOne('q99', onSuccess);

    expect(apiMock.get).toHaveBeenCalledOnceWith('q99');
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBeFalse();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    const row = onSuccess.calls.mostRecent().args[0];
    expect(row.id).toBe('q99');
    expect(row.poolId).toBe('p9');
    expect(row.text).toBe('Hello');
  });

  it('loadOne() should set error on failure', () => {
    const { store, apiMock } = setup();

    apiMock.get.and.returnValue(throwError(() => httpError(404, { detail: 'Not found' })));

    const onSuccess = jasmine.createSpy('onSuccess') as jasmine.Spy<(row: SkillQuestion) => void>;

    store.loadOne('missing', onSuccess);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Not found');
  });

  it('createInPool() should prepend created item and call onSuccess', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(of([makeDto({ id: 'old', pool: 'p1', text: 'Old' })]));
    store.loadByPool('p1');

    apiMock.createInPool.and.returnValue(of(makeDto({ id: 'new', pool: 'p1', text: 'New' })));

    const onSuccess = jasmine.createSpy('onSuccess') as jasmine.Spy<(row: SkillQuestion) => void>;

    const dto: CreateSkillQuestionDto = { text: 'x', pool: 'p1' };

    store.createInPool('p1', dto, onSuccess);

    expect(apiMock.createInPool).toHaveBeenCalledTimes(1);
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();

    expect(store.items().length).toBe(2);
    expect(store.items()[0].id).toBe('new');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('update() should replace item when it exists', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(of([makeDto({ id: 'q1', pool: 'p1', title: 'Before' })]));
    store.loadByPool('p1');

    apiMock.update.and.returnValue(of(makeDto({ id: 'q1', pool: 'p1', title: 'After' })));

    const onSuccess = jasmine.createSpy('onSuccess');

    store.update('q1', { title: 'After' }, onSuccess);

    expect(apiMock.update).toHaveBeenCalledOnceWith('q1', { title: 'After' });
    expect(store.items().length).toBe(1);
    expect(store.items()[0].title).toBe('After');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('update() should prepend item when it does not exist', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(of([makeDto({ id: 'q1', pool: 'p1' })]));
    store.loadByPool('p1');

    apiMock.update.and.returnValue(of(makeDto({ id: 'q2', pool: 'p1' })));

    store.update('q2', { title: 'X' });

    expect(store.items().length).toBe(2);
    expect(store.items()[0].id).toBe('q2');
  });

  it('delete() should remove item and call onSuccess', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(
      of([makeDto({ id: 'q1', pool: 'p1' }), makeDto({ id: 'q2', pool: 'p1' })]),
    );
    store.loadByPool('p1');

    apiMock.delete.and.returnValue(of(void 0));

    const onSuccess = jasmine.createSpy('onSuccess');

    store.delete('q1', onSuccess);

    expect(apiMock.delete).toHaveBeenCalledOnceWith('q1');
    expect(store.items().length).toBe(1);
    expect(store.items()[0].id).toBe('q2');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('delete() should set error on failure and keep items', () => {
    const { store, apiMock } = setup();

    apiMock.listByPool.and.returnValue(of([makeDto({ id: 'q1', pool: 'p1' })]));
    store.loadByPool('p1');

    apiMock.delete.and.returnValue(throwError(() => httpError(500, { detail: 'Boom' })));

    store.delete('q1');

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Boom');
    expect(store.items().length).toBe(1);
  });
});
