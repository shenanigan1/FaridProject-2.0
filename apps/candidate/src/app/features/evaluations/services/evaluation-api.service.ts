import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  EvaluationAnswerInput,
  EvaluationQuestion,
  EvaluationSummary,
  SubmitAnswersResponse,
} from '@features/evaluations/models/evaluation.model';
import { environment } from '@env/environment';

interface EvaluationDto {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: number | null;
  subject: number;
  position: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class EvaluationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/evaluations`;

  listMyEvaluations(): Observable<EvaluationSummary[]> {
    return this.http.get<EvaluationDto[]>(`${this.baseUrl}/`).pipe(
      map((items) => items.map((item) => this.mapEvaluationDto(item))),
    );
  }

  getEvaluationQuestions(evaluationId: number): Observable<EvaluationQuestion[]> {
    return this.http.get<EvaluationQuestion[]>(`${this.baseUrl}/${evaluationId}/questions/`);
  }

  submitAnswers(
    evaluationId: number,
    answers: EvaluationAnswerInput[],
  ): Observable<SubmitAnswersResponse> {
    return this.http.post<SubmitAnswersResponse>(`${this.baseUrl}/${evaluationId}/submit-answers/`, {
      answers,
    });
  }

  private mapEvaluationDto(dto: EvaluationDto): EvaluationSummary {
    return {
      id: dto.id,
      status: dto.status,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      assignedTo: dto.assigned_to,
      subject: dto.subject,
      position: dto.position,
    };
  }
}
