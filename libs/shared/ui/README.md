# FleetFlow Shared UI

Les composants de ce dossier appliquent le UI Book FleetFlow.

Reference complete :
`docs/ui-book/fleetflow-ui-book.md`

## Regle d'usage

Avant de creer du CSS local dans une page :

1. Chercher une classe `ff-*` existante dans `libs/shared/styles`.
2. Chercher un composant Angular dans `libs/shared/ui`.
3. Ajouter une variante partagee si le besoin revient sur plusieurs pages.
4. Garder le CSS page uniquement pour l'assemblage specifique de la page.
5. Ne pas utiliser de `style="..."` inline dans les templates : ajouter un utilitaire `ff-u-*` partage.

## Composants principaux

- `app-ui-button-primary`
- `app-ui-button-secondary`
- `app-ui-card`
- `app-ui-badge`
- `app-ui-text-input`
- `app-ui-select`
- `app-ui-textarea`
- `app-ui-tabs`
- `app-ui-progress-bar`
- `app-ui-empty-state`
- `app-ui-modal`

## Primitives workflow

Pour les pages metier type tests, relance, assessment et lancement :

- `ff-workflow-screen`
- `ff-workflow-shell`
- `ff-page-bar`
- `ff-workflow-hero`
- `ff-filter-stack`
- `ff-module-grid`
- `ff-module-card`
- `ff-score-panel`
- `ff-section-accordion`
- `ff-decision-bar`

Pour les pages catalogue/listing type jobs, contacts et pools :

- `ff-app-container--compact`
- `ff-toolbar-panel`
- `ff-card-grid`
- `ff-card-foot`
- `ff-stat-strip`
- `ff-stat-mini`

Utilitaires autorises : `ff-u-mt-*`, `ff-u-mb-md`, `ff-u-between`, `ff-u-end`, `ff-u-full`, `ff-u-min-0`, `ff-u-max-form`, `ff-u-select-sm`, `ff-u-divided-top`, `ff-u-pre-wrap`.

## Variantes de card

```html
<app-ui-card variant="default">...</app-ui-card>
<app-ui-card variant="elevated">...</app-ui-card>
<app-ui-card variant="data" tone="success">...</app-ui-card>
<app-ui-card variant="question" tone="warning">...</app-ui-card>
```

Tons disponibles :
`neutral`, `primary`, `success`, `warning`, `danger`, `info`, `orange`.

## Checklist accessibilite

- Label visible sur chaque champ.
- `aria-describedby` pour erreur/hint.
- `aria-invalid="true"` quand erreur.
- `role="dialog"` + `aria-modal="true"` sur modale.
- `role="progressbar"` sur progression.
- Focus visible clavier.
