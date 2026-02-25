import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SkillQuestion } from '@features/questions/models/skill-question.model';

export type UpdateSkillQuestionDto = Partial<Pick<SkillQuestion, 'prompt' | 'type' | 'isMandatory' | 'minScore' | 'maxScore'>>;

@Injectable({ providedIn: 'root' })
export class SkillQuestionsApiService {
  private readonly http = inject(HttpClient);

  listByPool(poolId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/questionpools/${poolId}/questions/`);
  }

  update(id: string, dto: UpdateSkillQuestionDto): Observable<any> {
    return this.http.patch<any>(`/api/skillquestions/${id}/`, dto);
  }
}
