import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TemplateListItem, TemplateDifficulty } from 'src/app/features/test-templates/models/test-templates.model';

export interface TemplatesListQuery {
  search?: string;
  difficulty?: TemplateDifficulty; // omit for "all"
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TemplatesApi {
  private readonly baseUrl = '/api/templates';

  constructor(private readonly http: HttpClient) {}

  list(query: TemplatesListQuery): Observable<TemplateListItem[]> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.difficulty) params = params.set('difficulty', query.difficulty);
    if (query.isActive !== undefined) params = params.set('is_active', String(query.isActive));
    return this.http.get<TemplateListItem[]>(`${this.baseUrl}/`, { params });
  }

  get(id: number): Observable<TemplateListItem> {
    return this.http.get<TemplateListItem>(`${this.baseUrl}/${id}/`);
  }

  create(payload: Pick<TemplateListItem, 'name' | 'is_active'>): Observable<TemplateListItem> {
    return this.http.post<TemplateListItem>(`${this.baseUrl}/`, payload);
  }

  update(id: number, payload: Partial<Pick<TemplateListItem, 'name' | 'is_active'>>): Observable<TemplateListItem> {
    return this.http.patch<TemplateListItem>(`${this.baseUrl}/${id}/`, payload);
  }
}
