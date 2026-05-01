import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

interface Paginated<T> {
  results: T[];
  next?: string | null;
}

export type ManagerEvaluationStatus = 'in_progress' | 'completed' | 'validated' | string;

export interface ManagerEvaluationDto {
  id: number;
  subject: number;
  application: number | null;
  position: number | null;
  template_version: number;
  assigned_to: number | null;
  status: ManagerEvaluationStatus;
  subject_comment: string;
  internal_comment?: string;
  template_name: string;
  subject_full_name: string;
  subject_email: string;
  position_title: string;
  assigned_to_full_name: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  validated_at: string | null;
}

export interface ManagerTestItem {
  id: number;
  status: ManagerEvaluationStatus;
  candidateName: string;
  candidateEmail: string;
  positionTitle: string;
  templateName: string;
  updatedAt: string;
  createdAt: string;
  completedAt: string | null;
  validatedAt: string | null;
}

export type ManagerQuestionFormat = 'mcq' | 'true_false' | 'practical' | string;
export type ManagerQuestionRubric = Record<string, unknown> | unknown[] | null;

export interface ManagerQuestionnaireQuestion {
  question_id: number;
  format: ManagerQuestionFormat;
  title: string;
  text: string;
  explanation: string;
  is_mandatory: boolean;
  points: number;
  difficulty: string;
  rubric: ManagerQuestionRubric;
  candidate_answer: string;
  manager_comment: string;
  score: number | null;
}

export interface ManagerQuestionnaire {
  evaluation_id: number;
  template_name: string;
  questions: ManagerQuestionnaireQuestion[];
}

function isPaginatedPayload<T>(value: unknown): value is Paginated<T> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Array.isArray((value as Paginated<T>).results);
}

@Injectable({ providedIn: 'root' })
export class ManagerTestsService {
  private readonly http = inject(HttpClient);
  private readonly evaluationsUrl = '/api/evaluations/';

  listAssignedTests(): Observable<ManagerTestItem[]> {
    return this.fetchAllPages<ManagerEvaluationDto>(this.evaluationsUrl).pipe(
      map((rows) => rows.map((row) => this.toItem(row))),
      map((items) => items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))),
    );
  }

  getAssignedTest(evaluationId: number): Observable<ManagerTestItem> {
    return this.http
      .get<ManagerEvaluationDto>(`${this.evaluationsUrl}${evaluationId}/`)
      .pipe(map((row) => this.toItem(row)));
  }

  getQuestionnaire(evaluationId: number): Observable<ManagerQuestionnaire> {
    return this.http.get<ManagerQuestionnaire>(
      `${this.evaluationsUrl}${evaluationId}/questionnaire/`,
    );
  }

  saveQuestionnaire(
    evaluationId: number,
    answers: {
      question_id: number;
      candidate_answer: string;
      manager_comment: string;
      score: number | null;
    }[],
  ): Observable<ManagerQuestionnaire> {
    return this.http.post<ManagerQuestionnaire>(
      `${this.evaluationsUrl}${evaluationId}/questionnaire/`,
      { answers },
    );
  }

  private fetchAllPages<T>(url: string): Observable<T[]> {
    return this.http.get<T[] | Paginated<T>>(url).pipe(
      expand((payload) => {
        if (!isPaginatedPayload<T>(payload) || !payload.next) {
          return EMPTY;
        }
        return this.http.get<T[] | Paginated<T>>(payload.next);
      }),
      map((payload) => (isPaginatedPayload<T>(payload) ? payload.results : payload)),
      reduce((allRows, pageRows) => [...allRows, ...pageRows], [] as T[]),
    );
  }

  private toItem(row: ManagerEvaluationDto): ManagerTestItem {
    return {
      id: row.id,
      status: row.status,
      candidateName: row.subject_full_name || row.subject_email || String(row.subject),
      candidateEmail: row.subject_email,
      positionTitle: row.position_title,
      templateName: row.template_name,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      validatedAt: row.validated_at,
    };
  }
}
