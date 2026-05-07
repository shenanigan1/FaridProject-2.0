import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  JobOffer,
  JobOfferFilters,
} from '@jobs/models/job-offer.model';
import { PublicJobOfferDto, PaginatedResponseDto } from '@jobs/models/job-offer.dto';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class JobPublicApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/public/positions/`;

  getJobOffers(
    filters: Partial<JobOfferFilters>,
  ): Observable<PaginatedResponseDto<JobOffer>> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.location) {
      params = params.set('location', filters.location);
    }

    return this.http
      .get<PublicJobOfferDto[]>(this.baseUrl, { params })
      .pipe(
        map((items) => ({
          count: items.length,
          next: null,
          previous: null,
          results: items.map((dto) => this.mapDtoToModel(dto)),
        })),
      );
  }

  private mapDtoToModel(dto: PublicJobOfferDto): JobOffer {
    return {
      id: dto.id,
      title: dto.title,
      location: dto.location,
      contractType: dto.contract_type,
      description: dto.description,
      department: dto.department,
      salary: dto.salary,
      createdAt: dto.created_at,
    };
  }

  getOfferById(id: number): Observable<JobOffer> {
    return this.http
      .get<PublicJobOfferDto>(`${this.baseUrl}${id}/`)
      .pipe(
        map((response) => this.mapDtoToModel(response))
      );
  }
}
