// features/test-templates/services/test-templates.api.ts
import { Injectable, inject } from '@angular/core'; /**/
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  TemplateListItem,
  TemplateDifficulty,
  TemplateDetailDto,
  TemplateUpsertPayload,
} from '@features/test-templates/models/test-templates.model';

export interface TemplatesListQuery {
  search?: string;
  difficulty?: TemplateDifficulty;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TemplatesApi {
  private readonly http = inject(HttpClient); /**/
  private readonly baseUrl = '/api/templates';

  list(query: TemplatesListQuery = {}): Observable<TemplateListItem[]> { /**/
    let params = new HttpParams();

    if (query.search) params = params.set('search', query.search);
    if (query.difficulty) params = params.set('difficulty', query.difficulty);
    if (query.isActive !== undefined) params = params.set('is_active', String(query.isActive));

    return this.http.get<TemplateListItem[]>(`${this.baseUrl}/`, { params });
  }

  get(id: number): Observable<TemplateDetailDto> {
    return this.http.get<TemplateDetailDto>(`${this.baseUrl}/${id}/`);
  }

  create(payload: TemplateUpsertPayload): Observable<TemplateDetailDto> {
    return this.http.post<TemplateDetailDto>(`${this.baseUrl}/`, payload);
  }

  update(id: number, payload: Partial<TemplateUpsertPayload>): Observable<TemplateDetailDto> {
    return this.http.patch<TemplateDetailDto>(`${this.baseUrl}/${id}/`, payload);
  }
}
