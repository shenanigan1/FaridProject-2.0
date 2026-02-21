# Revue d'architecture — FaridProject-2.0

## Vue d'ensemble

Le projet est bien parti sur une logique **monorepo** (`apps/frontend`, `apps/backend`, `packages/shared`) et une base **orientée TDD** avec des tests présents sur les domaines principaux backend.

## Points forts

- **Séparation frontend/backend claire** dans `apps/`.
- **Découpage backend par domaine métier** (`users`, `candidates`, `positions`, `templates_grid`).
- **Couverture de tests backend déjà significative** (CRUD, auth, permissions).
- **Préparation à la mutualisation** via `packages/shared`.

## Écarts observés entre cible et état actuel

- La cible “Clean Architecture” est annoncée, mais la logique métier est encore majoritairement dans les ViewSets.
- Le README décrit des dossiers futurs (ex: `storage`, `evaluations`, architecture frontend complète) qui ne sont pas encore matérialisés.
- Certaines implémentations ont des signaux techniques à traiter tôt (imports inutiles, conventions hétérogènes, routage implicite).

## Amélioration appliquée dans ce commit

Pour aller vers une architecture plus propre sans sur-ingénierie, la logique d'association `Position <-> Template` a été extraite du ViewSet vers une couche **service applicatif** (`positions/services`).

Bénéfices:

- responsabilité de la vue allégée ;
- logique métier réutilisable et testable indépendamment ;
- premier pas concret vers une structure “use-case/service” cohérente avec l'objectif Clean Architecture.

## Recommandations prioritaires (prochaines itérations)

1. **Standardiser une couche service** pour les cas métier non triviaux (`users`, `candidates`, `templates_grid`).
2. **Ajouter un lint Python (ruff/flake8)** dans CI pour capter imports morts et style incohérent.
3. **Aligner la documentation** sur l’état réel + roadmap explicite “existant / à venir”.
4. **Ajouter des tests de service unitaires** pour isoler les règles métier du framework DRF.
5. **Définir des conventions transverses** (naming, erreurs API, sérialisation) dans `docs/`.
