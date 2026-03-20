import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { JobApplicationPayload } from '@jobs/models/job-application.model';

@Injectable({
  providedIn: 'root',
})
export class JobApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/public/positions';

  submitApplication(jobId: number, payload: JobApplicationPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${jobId}/apply`, payload);
  }
}
