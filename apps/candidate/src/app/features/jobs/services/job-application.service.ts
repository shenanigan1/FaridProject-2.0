import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

export interface JobApplicationPayload {
  positionId: number;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  motivation: string;
}

interface JobApplicationApiResponse {
  id: number;
  candidate: number;
  position: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationResult {
  id: number;
  candidate: number;
  position: number;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class JobApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/jobapplications/`;

  applyToOffer(payload: JobApplicationPayload): Observable<JobApplicationResult> {
    const requestBody = {
      candidate: payload.candidateId,
      position: payload.positionId,
      status: 'applied',
    };

    return this.http.post<JobApplicationApiResponse>(this.baseUrl, requestBody).pipe(
      map((response) => ({
        id: response.id,
        candidate: response.candidate,
        position: response.position,
        status: response.status,
      })),
    );
  }
}
