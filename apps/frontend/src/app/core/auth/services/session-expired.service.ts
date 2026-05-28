import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SessionExpiredService {
  private readonly expiredSubject = new Subject<string>();
  readonly expired$ = this.expiredSubject.asObservable();

  notify(message = 'Session expirée, reconnectez-vous.'): void {
    this.expiredSubject.next(message);
  }
}
