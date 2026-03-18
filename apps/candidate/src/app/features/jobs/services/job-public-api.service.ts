import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { JobOffer } from '@jobs/models/job-offer.model';
import {
  PaginatedResponseDto,
  PublicJobOfferDto,
} from '@jobs/models/job-offer.dto';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root',
})
export class JobPublicApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/positions';

  getJobOffers(params?: {
    search?: string;
    location?: string;
    employmentType?: string;
    priority?: string;
    page?: number;
  }): Observable<PaginatedResponse<JobOffer>> {
    let httpParams = new HttpParams();

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params?.location) {
      httpParams = httpParams.set('location', params.location);
    }

    if (params?.employmentType) {
      httpParams = httpParams.set('employment_type', params.employmentType);
    }

    if (params?.priority) {
      httpParams = httpParams.set('priority', params.priority);
    }

    if (params?.page) {
      httpParams = httpParams.set('page', params.page);
    }

    return this.http
      .get<PaginatedResponseDto<PublicJobOfferDto>>(`${this.baseUrl}/`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          count: response.count,
          next: response.next,
          previous: response.previous,
          results: response.results.map((dto) => this.mapDtoToModel(dto)),
        })),
      );
  }

  private mapDtoToModel(dto: PublicJobOfferDto): JobOffer {
    return {
      id: dto.id,
      title: dto.title,
      location: dto.location,
      employmentType: dto.employment_type,
      contractType: dto.contract_type,
      category: dto.category,
      priority: dto.priority,
      status: dto.status,
      shortDescription: dto.short_description,
      applicantsCount: dto.applicants_count,
      postedAt: dto.posted_at,
      closingDate: dto.closing_date,
      companyName: dto.company_name,
    };
  }
}
