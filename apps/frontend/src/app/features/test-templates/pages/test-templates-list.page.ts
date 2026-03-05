import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';

import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
import type { TemplateListItem, TemplateDifficulty } from '@features/test-templates/models/test-templates.model';

import { UiTabsComponent, UiTabItem } from '@shared/ui/tabs/tabs.component';
import { UiBadgeComponent, UiBadgeTone } from '@shared/ui/badge/badge.component';
import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';
import { UiTextInputComponent } from '@shared/ui/text-input/text-input.component';

type DifficultyFilter = 'all' | TemplateDifficulty;

@Component({
  selector: 'app-test-templates-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UiTabsComponent,
    UiBadgeComponent,
    UiButtonPrimaryComponent,
    UiTextInputComponent
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

  /// Header Modif
  /**/
  // ✅ Build a typed stream from the form + signal filters, then convert to a Signal.
  // No `toSignal` overload issues, no unused types, no `any`.
  private readonly filters$ = combineLatest([
    this.searchCtrl.valueChanges.pipe(
      startWith(this.searchCtrl.value),
      debounceTime(250),
      distinctUntilChanged()
    ),
    toObservable(this.difficulty),
  ]);
  /**/
  /// End Modif

  /// Header Modif
  /**/
  // ✅ `templates()` is a Signal<TemplateListItem[]> (same API as you already use in HTML).
  readonly templates = toSignal(
    this.filters$.pipe(
      switchMap(([search, difficulty]) =>
        this.api.list({
          search: search.trim() || undefined,
          difficulty: difficulty === 'all' ? undefined : difficulty,
        })
      )
    ),
    { initialValue: [] as TemplateListItem[] }
  );
  /**/
  /// End Modif

  /// Header Modif
  /**/
  // ✅ Optional but nice: keeps "( {{ templates().length }} )" readable and avoids recalculations in template.
  readonly templatesCount = computed(() => this.templates().length);
  /**/
  /// End Modif

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
    const v: TemplateDifficulty = (d ?? 'medium') as TemplateDifficulty;
    if (v === 'easy') return 'success';
    if (v === 'hard') return 'danger';
    return 'warning';
  }
}
