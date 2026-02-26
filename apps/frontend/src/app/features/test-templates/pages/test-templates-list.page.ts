// src/app/templates/pages/templates-list/templates-list.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { TemplatesApi } from 'src/app/features/test-templates/services/test-templates.api';
import { TemplateListItem, TemplateDifficulty } from 'src/app/features/test-templates/models/test-templates.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

type DifficultyFilter = 'all' | TemplateDifficulty;

@Component({
  selector: 'app-templates-list',
  templateUrl: './test-templates-list.page.html',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesListComponent {
  readonly search$ = new BehaviorSubject<string>('');
  readonly difficulty$ = new BehaviorSubject<DifficultyFilter>('all');

  readonly templates$ = combineLatest([
    this.search$.pipe(debounceTime(250), distinctUntilChanged()),
    this.difficulty$,
  ]).pipe(
    switchMap(([search, difficulty]) =>
      this.api.list({
        search: search.trim() || undefined,
        difficulty: difficulty === 'all' ? undefined : difficulty,
      })
    )
  );

  constructor(
    private readonly api: TemplatesApi,
    private readonly router: Router
  ) {}

  setSearch(value: string): void {
    this.search$.next(value ?? '');
  }

  setDifficulty(value: DifficultyFilter): void {
    this.difficulty$.next(value);
  }

  openCreate(): void {
    void this.router.navigate(['/templates/new']);
  }

  openView(t: TemplateListItem): void {
    console.log('Navigating to template view with ID:', t.id);
    void this.router.navigate(['/templates', t.id]);
  }

  openEdit(t: TemplateListItem, ev: MouseEvent): void {
    ev.stopPropagation(); // prevents card click navigation
    void this.router.navigate(['/templates', t.id, 'edit']);
  }

  trackById(_: number, item: TemplateListItem): number {
    return item.id;
  }
}
