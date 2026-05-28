# FleetFlow UI Book

Ce UI Book est la source de vérité pour les interfaces FleetFlow/DriverRecruit.
Il doit être utilisé avant de créer une page, un composant partagé ou une variante locale.

## Fondations

### Couleurs

| Token | Usage | Variable |
| --- | --- | --- |
| Background | Fond applicatif principal | `--ff-color-background` |
| Header | App bar, top bar, zones de navigation | `--ff-color-header` |
| Surface 1 | Cards, panels, rows | `--ff-color-surface-1` |
| Surface 2 | Surfaces actives, contrôles, menus | `--ff-color-surface-2` |
| Surface 3 | Inputs et champs profonds | `--ff-color-surface-3` |
| Primary | CTA, navigation active, progress | `--ff-color-primary-500` |
| Success | Succès, validation, réponse correcte | `--ff-color-success` |
| Warning | Attention, test à traiter | `--ff-color-warning` |
| Error | Erreur, refus, action destructive | `--ff-color-error` |
| Info | Information neutre | `--ff-color-info` |

### Rayons et ombres

Le style produit doit rester B2B, pas “soft UI”.

| Usage | Variable |
| --- | --- |
| Petit badge / petit contrôle | `--ff-radius-sm` |
| Input / bouton | `--ff-radius-control` |
| Card métier | `--ff-radius-card` |
| Panel / modal / sheet | `--ff-radius-panel` |
| Chip / progress | `--ff-radius-pill` |

Ombres autorisées :

- `--ff-shadow-card-soft` pour les cards courantes;
- `--ff-shadow-card` pour modales/sheets seulement;
- `--ff-shadow-primary` pour CTA principal.

## Primitives CSS

### Layout

| Classe | Usage |
| --- | --- |
| `ff-app-screen` | Fond de page applicatif |
| `ff-app-container` | Largeur max de contenu |
| `ff-app-stack` | Stack verticale standard |
| `ff-app-header` | Titre + actions de page |
| `ff-mobile-appbar` | Header mobile/desktop simple |
| `ff-decision-bar` | Barre sticky de décision en bas |
| `ff-workflow-screen` | Écran workflow sombre pour tests/jobs/modules |
| `ff-workflow-shell` | Conteneur workflow responsive |
| `ff-page-bar` | Bandeau haut retour/titre/actions |
| `ff-workflow-hero` | Bloc titre compact pour parcours métier |
| `ff-filter-stack` | Espacement standard titre/recherche/filtres |

### Cards et surfaces

| Classe | Usage |
| --- | --- |
| `ff-card` | Card standard |
| `ff-card-elevated` | Card plus forte pour zone principale |
| `ff-data-card` | Ligne/card de données |
| `ff-kpi-grid` | Grille de métriques |
| `ff-kpi-card` | KPI compact |
| `ff-table-card` | Conteneur table |
| `ff-question-card` | Question dans test/template |
| `ff-section-accordion` | Section ouvrable dans détails de test |
| `ff-score-panel` | Score global ou score de module |
| `ff-module-grid` | Grille responsive de modules/templates |
| `ff-module-card` | Module/template sélectionnable |

Variantes d’accent :

- `ff-accent-marker`
- `ff-accent-success`
- `ff-accent-warning`
- `ff-accent-danger`
- `ff-accent-info`
- `ff-accent-orange`

### Actions

| Classe | Usage |
| --- | --- |
| `ff-btn ff-btn-primary` | Action principale |
| `ff-btn ff-btn-secondary` | Action secondaire |
| `ff-btn ff-btn-ghost` | Action discrète |
| `ff-btn ff-btn-danger` | Refus/suppression |
| `ff-btn ff-btn-success` | Validation positive secondaire |
| `ff-btn ff-btn-warning` | Action d’attention |
| `ff-btn-sm` / `ff-btn-lg` | Taille contrôlée |
| `ff-btn-full` | Largeur complète |
| `ff-btn-icon-only` | Bouton icône accessible |

Règle : un écran ne doit pas afficher deux CTA primaires concurrents dans la même zone.

### Utilitaires autorisés

Les pages ne doivent pas utiliser de `style="..."` inline. Utiliser uniquement ces utilitaires si une primitive existante ne suffit pas :

- `ff-u-mt-sm`, `ff-u-mt-md`, `ff-u-mt-lg`, `ff-u-mt-xl`
- `ff-u-mb-md`
- `ff-u-between`, `ff-u-end`
- `ff-u-block`, `ff-u-full`, `ff-u-min-0`, `ff-u-text-left`
- `ff-u-max-form`, `ff-u-select-sm`, `ff-u-divided-top`, `ff-u-pre-wrap`

### Formulaires

| Classe | Usage |
| --- | --- |
| `ff-field` | Bloc champ |
| `ff-field-label` | Label visible |
| `ff-field-error` | Erreur liée par `aria-describedby` |
| `ff-field-hint` | Aide courte |
| `ff-input` | Input/select/textarea |
| `ff-input-error` | Champ invalide |
| `ff-form-grid` | Formulaire vertical |
| `ff-form-grid--two` | Grille responsive |

Message requis standard : `Champ obligatoire`.

### Navigation et filtres

| Classe | Usage |
| --- | --- |
| `ff-segmented` | Tabs internes |
| `ff-segmented__item` | Bouton de tab |
| `ff-segmented__item--active` | Tab active |
| `ff-chip-row` | Filtres horizontaux |
| `ff-chip` | Chip filtre |
| `ff-chip--active` | Filtre actif |
| `ff-search-box` | Recherche avec icône |

### Feedback

| Classe | Usage |
| --- | --- |
| `ff-alert` + variante | Alerte dans formulaire/page |
| `ff-alert-inline` | Message informatif dans une card |
| `ff-empty` | Empty state |
| `ff-toast` | Toast neutre |
| `ff-toast--success` | Toast succès |
| `ff-toast--danger` | Toast erreur |
| `ff-modal-scrim` | Fond de modal/sheet |
| `ff-modal-card` | Dialog |
| `ff-bottom-sheet` | Sheet mobile |

## Composants Angular partagés

| Composant | Sélecteur | Usage |
| --- | --- | --- |
| Button primary | `app-ui-button-primary` | CTA principal |
| Button secondary | `app-ui-button-secondary` | Action secondaire |
| Card | `app-ui-card` | Surface partagée avec `variant` et `tone` |
| Badge | `app-ui-badge` | Statut court |
| Text input | `app-ui-text-input` | Input CVA accessible |
| Select | `app-ui-select` | Select CVA accessible |
| Textarea | `app-ui-textarea` | Textarea CVA accessible |
| Tabs | `app-ui-tabs` | Tabs internes |
| Progress bar | `app-ui-progress-bar` | Progression avec ARIA |
| Empty state | `app-ui-empty-state` | État vide |
| Modal | `app-ui-modal` | Dialog accessible |
| Toast | `app-ui-toast-container` | Notifications |

## Exemples de code

### Card métier

```html
<app-ui-card variant="data" tone="success">
  <div class="ff-row-title">Jean Dupont</div>
  <p class="ff-row-meta">Test conduite - terminé</p>
</app-ui-card>
```

### KPI

```html
<section class="ff-kpi-grid" aria-label="Indicateurs recrutement">
  <article class="ff-kpi-card ff-accent-marker">
    <p class="ff-kpi-label">Tests en cours</p>
    <strong class="ff-kpi-value">8</strong>
    <p class="ff-kpi-help">Évaluations ouvertes</p>
  </article>
</section>
```

### Question

```html
<article class="ff-question-card">
  <header class="ff-question-card__header">
    <h3 class="ff-row-title">Inspection visuelle</h3>
    <span class="ff-status-pill">10 pts</span>
  </header>

  <div class="ff-choice-list">
    <label class="ff-choice ff-choice--correct">
      <input type="checkbox" />
      Vérifie les pneus avant départ
    </label>
  </div>
</article>
```

### Section de test ouvrable

```html
<section class="ff-section-accordion">
  <button class="ff-section-accordion__button" type="button" aria-expanded="false">
    <span class="ff-row-title">Conduite de nuit</span>
    <span class="ff-status-pill">80%</span>
  </button>
  <div class="ff-section-accordion__body">
    <!-- réponses, commentaires, scores -->
  </div>
</section>
```

### Barre de décision

```html
<footer class="ff-decision-bar" aria-label="Actions de validation">
  <button class="ff-btn ff-btn-secondary" type="button">Relancer un test</button>
  <button class="ff-btn ff-btn-danger" type="button">Refuser</button>
  <button class="ff-btn ff-btn-primary" type="button">Valider</button>
</footer>
```

## États obligatoires

Chaque composant interactif doit documenter et tester :

- état par défaut;
- hover/focus visible;
- disabled;
- loading si action async;
- erreur si formulaire/API;
- empty state si liste;
- rôle ARIA si modal/progress/table.

## Règles RGAA

- Les champs ont toujours un label visible.
- Les erreurs sont textuelles et liées au champ.
- Les boutons sont de vrais `<button>`, les navigations de vrais `<a>`.
- La couleur seule ne suffit jamais à expliquer un statut.
- Les modales utilisent `role="dialog"`, `aria-modal="true"` et un titre.
- Le focus visible est obligatoire.
- La motion respecte `prefers-reduced-motion`.

## Règles produit

- Pas de placeholder métier dans les pages finales.
- Empty state propre si l’API ne renvoie aucune donnée.
- Admin/RH/Direction voient les données globales autorisées.
- Manager voit uniquement ses sections assignées.
- Candidat voit uniquement ses candidatures/tests.
