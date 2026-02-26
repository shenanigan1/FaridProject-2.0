import { Injectable, signal, computed } from '@angular/core';
import { QuestionPool } from '@pools/models/question-pool.model';

@Injectable({ providedIn: 'root' })
export class PoolsService {
  // Mock data (replace by HTTP later)
  private readonly _pools = signal<QuestionPool[]>([
    {
      id: 'b6f0b8a6-4d0a-4c9f-a6b5-1a4a2c4df001',
      code: 'DRIVING_CORE',
      name: 'Driving Core',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'b6f0b8a6-4d0a-4c9f-a6b5-1a4a2c4df002',
      code: 'SAFETY_RULES',
      name: 'Safety Rules',
      updatedAt: new Date().toISOString(),
    },
  ]);

  readonly pools = computed(() => this._pools());

  getById(id: string): QuestionPool | undefined {
    return this._pools().find(p => p.id === id);
  }

  // Later we’ll add create/update/delete with API
}
