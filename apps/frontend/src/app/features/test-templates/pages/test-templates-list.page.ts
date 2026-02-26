import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';

import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
import type { TemplateListItem, TemplateDifficulty } from '@features/test-templates/models/test-templates.model';

import { UiTextInputComponent } from '@shared/ui/text-input/text-input.component';
import { UiTabsComponent, UiTabItem } from '@shared/ui/tabs/tabs.component';
import { UiBadgeComponent, UiBadgeTone } from '@shared/ui/badge/badge.component';
import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';

type DifficultyFilter = 'all' | TemplateDifficulty;

@Component({
  selector: 'app-test-templates-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UiTextInputComponent,
    UiTabsComponent,
    UiBadgeComponent,
    UiButtonPrimaryComponent,
  ],
  templateUrl: './test-templates-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesListPage {
  private readonly api = inject(TemplatesApi);
  private readonly router = inject(Router);

  /** Reactive search */
  readonly searchCtrl = new FormControl('', { nonNullable: true });

  /** Difficulty uses signals + ui-tabs */
  readonly difficulty = signal<DifficultyFilter>('all');

  readonly difficultyTabs: UiTabItem<DifficultyFilter>[] = [
    { key: 'all', label: 'All' },
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' },
  ];

  readonly templates = toSignal(
    combineLatest([
      this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value), debounceTime(250), distinctUntilChanged()),
      toObservable(this.difficulty),
    ]).pipe(
      switchMap(([search, difficulty]) =>
        this.api.list({
          search: search.trim() || undefined,
          difficulty: difficulty === 'all' ? undefined : difficulty,
        })
      )
    ),
    { initialValue: [] as TemplateListItem[] }
  );

  setDifficulty(value: DifficultyFilter): void {
    this.difficulty.set(value);
  }

  openCreate(): void {
    void this.router.navigate(['/templates/new']);
  }

  openView(t: TemplateListItem): void {
    void this.router.navigate(['/templates', t.id]);
  }

  trackById(_: number, item: TemplateListItem): number {
    return item.id;
  }

  badgeTone(d: TemplateDifficulty | null | undefined): UiBadgeTone {
    const v = (d ?? 'medium') as TemplateDifficulty;
    if (v === 'easy') return 'success';
    if (v === 'hard') return 'danger';
    return 'warning';
  }
}
