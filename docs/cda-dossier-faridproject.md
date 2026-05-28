# Dossier de projet CDA - FaridProject 2.0

Auteur : à compléter  
Session : à compléter  
Projet : FaridProject 2.0  
Application : plateforme web d'évaluation de candidats, conducteurs et salariés

## Note de méthode

Ce dossier a été rédigé à partir du dépôt FaridProject 2.0 et des éléments de contexte fournis par le porteur du projet. Les informations techniques proviennent du code, des fichiers de configuration, des tests et de la documentation présents dans le projet. Les éléments de déroulement personnel, notamment le passage d'un projet à trois personnes vers un projet solo, la phase de recherche et l'organisation en tickets Kanban, proviennent du retour d'expérience donné pour ce dossier.

Les points non visibles dans le dépôt ne sont pas présentés comme des fonctionnalités déjà implémentées. Par exemple, Docker est décrit comme un sujet de recherche et d'apprentissage, tandis que le déploiement actuellement visible dans le dépôt s'appuie sur Render pour le backend et Vercel pour les applications Angular.

## Sommaire

1. Compétences du référentiel couvertes par le projet  
2. Résumé du projet  
3. Cahier des charges  
4. Gestion de projet  
5. Déroulement du projet  
6. Spécifications techniques  
7. Architecture applicative et base de données  
8. Sécurité  
9. Tests, TDD et CI/CD  
10. Réalisation et extraits de code significatifs  
11. Jeu d'essai représentatif  
12. Difficultés rencontrées  
13. Déploiement gratuit  
14. Perspectives d'évolution  
15. Conclusion

## 1. Compétences du référentiel couvertes par le projet

### 1.1 Maquetter une application

FaridProject 2.0 contient plusieurs éléments de conception qui structurent l'interface avant le développement complet des fonctionnalités. Le dépôt contient notamment des spécifications fonctionnelles, des spécifications techniques, une roadmap MVP, des documents liés à l'interface et une bibliothèque de composants partagés.

La maquette applicative ne se limite pas à un écran isolé : elle organise plusieurs parcours utilisateurs autour de rôles distincts. L'application interne Angular propose des routes protégées pour les profils RH, administrateur, direction, manager, employé et conducteur. Une application candidate séparée expose un portail orienté offres d'emploi, candidatures, tableau de bord, applications et tests.

Le travail de maquettage fonctionnel repose donc sur :

- une séparation entre application interne et portail candidat ;
- une navigation par rôle ;
- des écrans dédiés aux candidats, postes, grilles, pools de questions, tests, rôles et profils ;
- une bibliothèque UI partagée dans `libs/shared/ui`, utilisée pour uniformiser les composants.

### 1.2 Développer une interface utilisateur web statique et adaptable

Le frontend est développé en Angular et TypeScript. Le dépôt contient deux applications Angular :

- `apps/frontend`, destinée à l'usage interne ;
- `apps/candidate`, destinée au portail candidat.

Les deux applications utilisent Angular, le routage, des composants, des services, des fichiers de style SCSS et Tailwind. La présence de composants séparés, de pages dédiées et de routes lazy-loaded montre une volonté de construire une interface maintenable et adaptable.

L'application candidate contient des écrans autour de la liste d'offres, du détail d'une offre, du dépôt de candidature et des pages candidates. L'application interne contient des vues de gestion pour les candidats, postes, templates de tests, questions, pools, évaluations, rôles, manager et tableaux de bord.

### 1.3 Développer une interface utilisateur web dynamique

L'interface est dynamique car les écrans Angular consomment une API REST Django. Les données affichées ne sont pas figées dans le HTML : elles sont récupérées via des services Angular, puis présentées dans les pages et composants.

Exemples visibles dans le dépôt :

- service d'authentification Angular appelant `/api/auth/login/`, `/api/auth/me/`, `/api/auth/refresh/` et `/api/auth/logout/` ;
- intercepteur HTTP ajoutant le jeton JWT dans l'en-tête `Authorization` ;
- guard d'authentification vérifiant la session avant d'ouvrir les routes protégées ;
- role guard limitant l'accès aux pages selon le rôle de l'utilisateur ;
- services dédiés aux candidats, postes, templates, pools, questions et tests.

### 1.4 Créer une base de données

La base de données est relationnelle et pensée autour de PostgreSQL. Le backend Django contient plusieurs applications métier avec migrations :

- `users` pour les utilisateurs et les rôles ;
- `companies` pour les entreprises ;
- `candidates` pour les candidats ;
- `employees` pour les salariés ;
- `positions` pour les postes ;
- `recruitment` pour les candidatures ;
- `templates_grid` pour les grilles, sections, questions, pools et versions ;
- `evaluations` pour les évaluations, réponses, commentaires et affectations.

Les modèles Django définissent les relations entre les entités : un candidat est lié à un utilisateur, une candidature relie un candidat à un poste, une évaluation est liée à un sujet, une candidature, un poste et une version de template.

### 1.5 Développer les composants d'accès aux données

Le projet utilise Django REST Framework pour exposer les données via des ViewSets, serializers et routes API. Le fichier de routes principal enregistre les ressources suivantes :

- entreprises ;
- postes ;
- postes publics ;
- candidats ;
- employés ;
- candidatures ;
- pools de questions ;
- questions ;
- templates ;
- sections de templates ;
- règles de pools ;
- évaluations ;
- utilisateurs.

Les composants d'accès aux données existent aussi côté frontend, sous forme de services Angular spécialisés qui appellent l'API. Cette séparation permet de garder les pages et composants centrés sur l'interface, tandis que l'accès HTTP reste isolé dans des services.

### 1.6 Développer la partie back-end d'une application web

Le backend est une API Django REST Framework. Il gère :

- l'authentification par email et mot de passe ;
- la génération de tokens JWT ;
- le refresh token ;
- le logout avec blacklist du refresh token ;
- les permissions par rôle ;
- les CRUD métier ;
- le lancement et le suivi des évaluations ;
- la sauvegarde des questionnaires d'évaluation ;
- la mise à jour de statuts d'évaluation et de candidature.

L'architecture backend est séparée par modules métier, avec un dossier par domaine fonctionnel. Le README du projet présente explicitement la reconstruction du projet sur une base TDD, Clean Architecture, monorepo et séparation claire des responsabilités.

## 2. Résumé du projet

FaridProject 2.0 est une application web destinée à centraliser et standardiser l'évaluation de candidats, conducteurs et salariés. Le projet répond à un besoin métier lié au recrutement et au suivi des compétences dans le secteur du transport.

L'objectif principal est de fournir une plateforme permettant :

- la gestion des utilisateurs et des rôles ;
- la gestion des candidats ;
- la gestion des postes ;
- la gestion des candidatures ;
- la création de grilles et templates de tests ;
- le lancement d'évaluations ;
- le remplissage de questionnaires ;
- la validation ou le rejet des évaluations ;
- la consultation des données selon les droits de chaque rôle.

Le projet est une reconstruction propre de l'application FARID. Le README indique que cette nouvelle version repart de zéro avec une approche TDD, une architecture plus maintenable, un monorepo et une séparation claire entre frontend et backend.

## 3. Cahier des charges

### 3.1 Cible et objectif

L'application vise plusieurs profils utilisateurs :

- RH ;
- administrateur ;
- direction ;
- manager ;
- conducteur ;
- candidat ;
- salarié.

Le besoin principal est de structurer le processus d'évaluation. Les RH et administrateurs peuvent gérer les candidats, postes, grilles, utilisateurs et tests. Les managers peuvent intervenir sur les évaluations qui leur sont attribuées. Les candidats et salariés ne consultent que les informations qui les concernent.

### 3.2 Fonctionnalités attendues et visibles dans le projet

Les fonctionnalités visibles dans le dépôt couvrent :

- authentification ;
- routes protégées ;
- rôles et restrictions d'accès ;
- gestion utilisateurs ;
- gestion candidats ;
- gestion entreprises ;
- gestion postes ;
- offres publiques côté candidat ;
- candidatures ;
- templates de tests ;
- pools de questions ;
- questions de compétences ;
- évaluations ;
- affectation de sections d'évaluation ;
- commentaires internes ou visibles par le sujet ;
- validation ou rejet d'une évaluation ;
- tests automatisés backend et frontend.

### 3.3 Périmètre fonctionnel actuel

Le projet est orienté MVP. Certaines fonctionnalités sont présentes sous forme de base technique ou de parcours partiel. La documentation interne mentionne par exemple des incréments futurs autour de l'alignement complet des contrats d'authentification, du durcissement des permissions, du portail candidat complet, du workflow manager et de la stabilisation finale.

Cela montre que l'application n'est pas présentée comme un produit terminé à 100 %, mais comme une base solide construite progressivement avec une méthode TDD.

## 4. Gestion de projet

### 4.1 Organisation agile

Le projet a été organisé avec une logique agile. Le suivi s'est fait à partir d'un backlog GitHub, découpé en tickets et organisé en Kanban. Cette méthode a permis de transformer les besoins généraux en tâches plus petites, priorisables et testables.

Chaque ticket correspondait à un incrément fonctionnel ou technique : authentification, tests backend, routes frontend, sécurisation, déploiement, configuration CI/CD, modèles de données, correction d'erreurs, amélioration des évaluations.

La présence d'une branche `dev`, d'une branche `main`, d'un historique de commits et de workflows GitHub Actions montre une organisation par versions successives. La CI s'exécute sur `main`, `dev`, les pull requests et les lancements manuels.

### 4.2 Backlog et Kanban

Le backlog a permis de classer le travail en colonnes de type :

- à faire ;
- en cours ;
- en test ;
- terminé.

Cette organisation a été utile pour garder une vision claire du projet, notamment après le passage d'un projet prévu à trois personnes vers un projet mené seul. Le Kanban a servi à limiter la dispersion et à prioriser les tâches critiques : socle backend, authentification, tests, sécurité, puis déploiement.

### 4.3 Gestion de version

Le dépôt est hébergé sur GitHub. La branche active du projet est `dev`. L'historique récent contient notamment des commits liés à l'authentification, au déploiement, à l'intercepteur frontend, à Ruff et aux évaluations.

Le workflow CD fusionne automatiquement `dev` vers `main` lorsque la CI réussit sur la branche `dev`. Cette automatisation oblige à conserver un état stable avant intégration.

## 5. Déroulement du projet

### 5.1 Phase de recherche et de découverte

Le projet a commencé par une phase de recherche et de tests techniques difficile. Pendant environ trois mois, il a fallu découvrir plusieurs technologies en même temps :

- Docker et la logique de conteneurisation ;
- le backend avec Django et Django REST Framework ;
- le frontend avec Angular ;
- la séparation frontend/backend ;
- les APIs REST ;
- les tests automatisés ;
- la mise en place d'un déploiement gratuit ;
- les contraintes de sécurité autour de JWT et des rôles.

Cette phase n'a pas seulement servi à produire du code : elle a aussi permis de comprendre les limites de la première approche et de décider de repartir sur un projet propre.

### 5.2 Passage d'un projet à trois vers un projet solo

Le projet était initialement prévu pour être réalisé à trois. Le passage à une réalisation solo a eu un impact direct sur l'organisation. Il a fallu réduire le périmètre, prioriser les fonctionnalités les plus importantes et se concentrer sur une base fiable plutôt que sur une accumulation rapide de fonctionnalités.

Ce changement explique le choix d'une reconstruction propre, structurée par tests, afin de garder un projet maintenable malgré une charge de travail plus lourde pour une seule personne.

### 5.3 Reconstruction propre du projet

FaridProject 2.0 a été créé comme une nouvelle base, distincte d'une approche expérimentale. Le README le décrit comme un rebuild from scratch, en monorepo, avec TDD et Clean Architecture.

Les priorités de cette reconstruction ont été :

- créer un backend Django REST Framework propre ;
- séparer les domaines métier ;
- créer deux applications Angular ;
- mettre en place une authentification JWT ;
- protéger les routes côté frontend ;
- protéger les endpoints côté backend ;
- ajouter des tests automatisés ;
- configurer la CI/CD ;
- préparer le déploiement.

## 6. Spécifications techniques

### 6.1 Vue d'ensemble

L'architecture est de type client-serveur :

- frontend : Angular et TypeScript ;
- backend : Django REST Framework ;
- base de données : PostgreSQL ;
- authentification : JWT avec refresh token ;
- hébergement frontend : Vercel ;
- hébergement backend : Render ;
- base de données externe : PostgreSQL via `DATABASE_URL`, utilisée dans le déploiement gratuit avec Neon ;
- CI/CD : GitHub Actions.

Le dépôt est organisé en monorepo :

- `apps/backend` pour l'API Django ;
- `apps/frontend` pour l'application interne ;
- `apps/candidate` pour l'application candidate ;
- `libs/shared` pour les composants et styles partagés ;
- `docs` pour la documentation ;
- `.github/workflows` pour la CI/CD.

### 6.2 Backend

Le backend utilise :

- Python ;
- Django ;
- Django REST Framework ;
- Simple JWT ;
- django-cors-headers ;
- django-filter ;
- dj-database-url ;
- psycopg ;
- gunicorn ;
- whitenoise ;
- pytest ;
- pytest-django ;
- factory_boy ;
- Faker ;
- Ruff.

Le backend expose les routes sous `/api/`. Les routes d'authentification sont séparées sous `/api/auth/`.

### 6.3 Frontend interne

L'application interne utilise :

- Angular 21 ;
- TypeScript ;
- Angular Router ;
- Angular Forms ;
- RxJS ;
- Jasmine/Karma pour les tests ;
- ESLint ;
- Prettier ;
- Tailwind ;
- lucide-angular ;
- ngx-quill et Quill.

Les routes internes sont protégées par un guard d'authentification et un guard de rôle. Les sections principales couvrent dashboard, candidats, postes, pools, templates, tests, rôles, contact, jobs, manager et profil.

### 6.4 Portail candidat

L'application candidate est une seconde application Angular. Elle contient :

- une page de liste des offres ;
- une page de détail d'offre ;
- un flux de candidature ;
- un tableau de bord candidat ;
- une page applications ;
- une page tests ;
- une authentification propre au portail candidat.

Cette séparation permet de distinguer l'usage interne de l'usage candidat.

## 7. Architecture applicative et base de données

### 7.1 Modèle utilisateur et rôles

Le modèle `User` remplace l'authentification Django standard par un utilisateur basé sur l'email. Il contient les champs :

- email ;
- prénom ;
- nom ;
- téléphone ;
- rôle principal ;
- date d'anonymisation ;
- statut actif ;
- statut staff ;
- dates de création et de mise à jour.

Les rôles présents dans le code sont :

- admin ;
- hr ;
- manager ;
- director ;
- driver ;
- candidate ;
- employee.

### 7.2 Candidats, postes et candidatures

Le modèle `Candidate` est lié à un utilisateur. Il possède un statut, un poste cible et un indicateur `flag`. Le modèle `Position` représente un poste avec entreprise, titre, description, département, type de contrat, localisation, salaire et statut actif.

Le modèle `JobApplication` relie un candidat à un poste. Une contrainte d'unicité empêche un même candidat de postuler plusieurs fois au même poste.

### 7.3 Grilles, questions et templates

Le module `templates_grid` structure les tests et grilles d'évaluation. Il contient des templates, sections, questions, pools et versions. Le modèle `Template` contient notamment :

- nom ;
- statut actif ;
- difficulté ;
- durée ;
- score minimal de réussite.

La version de template permet de figer un état de la grille au moment de l'évaluation.

### 7.4 Évaluations

Le modèle `Evaluation` relie :

- un sujet évalué ;
- une candidature optionnelle ;
- un poste ;
- une version de template ;
- un utilisateur assigné ;
- un statut ;
- un commentaire visible par le sujet ;
- un commentaire interne.

Les statuts d'évaluation sont :

- in progress ;
- completed ;
- validated ;
- rejected.

Le backend contient un endpoint de lancement d'évaluation et un endpoint questionnaire qui construit le payload selon le rôle de l'utilisateur.

## 8. Sécurité

### 8.1 Authentification JWT

L'authentification repose sur Simple JWT. Lors du login, le backend retourne :

- un access token ;
- un refresh token ;
- les informations utilisateur.

La durée de vie de l'access token est de 15 minutes. La durée de vie du refresh token est de 7 jours. La rotation des refresh tokens est activée et les anciens tokens sont blacklistés après rotation.

### 8.2 Refresh token et logout

Le endpoint `/api/auth/refresh/` permet d'obtenir un nouvel access token à partir du refresh token. Le endpoint `/api/auth/logout/` tente de blacklister le refresh token transmis.

Des tests automatisés vérifient :

- que le login retourne bien `access`, `refresh` et `user` ;
- que `/api/auth/me/` exige une authentification ;
- que le refresh fonctionne ;
- que le logout invalide le refresh token.

### 8.3 Permissions backend

Par défaut, Django REST Framework exige une authentification sur les endpoints. Des permissions par rôle sont ensuite appliquées dans les ViewSets.

Exemples :

- les candidats peuvent créer leur profil mais la liste et la modification sont réservées aux rôles RH, administrateur ou direction ;
- les utilisateurs ne sont gérés que par des rôles autorisés ;
- les évaluations sont filtrées selon le rôle : RH/admin/direction voient tout, manager voit les évaluations assignées, candidat/conducteur/salarié voit ses propres évaluations.

### 8.4 Sécurité frontend

Côté frontend, un intercepteur HTTP ajoute l'en-tête `Authorization: Bearer <token>` sur les requêtes protégées. En cas de réponse 401, l'intercepteur tente un refresh. Si le refresh échoue, les tokens sont supprimés et la session est considérée expirée.

Les routes Angular sont protégées par :

- `AuthGuard` pour vérifier la session ;
- `RoleGuard` pour vérifier le rôle attendu par la route.

### 8.5 Headers et configuration production

Les fichiers `vercel.json` des deux applications Angular configurent des headers de sécurité :

- Content-Security-Policy ;
- Referrer-Policy ;
- X-Content-Type-Options ;
- X-Frame-Options ;
- Permissions-Policy.

Côté Django, le fichier settings configure également :

- `SECURE_CONTENT_TYPE_NOSNIFF` ;
- `X_FRAME_OPTIONS = "DENY"` ;
- `SECURE_REFERRER_POLICY` ;
- cookies secure selon l'environnement ;
- HSTS hors mode debug ;
- vérification des variables critiques en production.

## 9. Tests, TDD et CI/CD

### 9.1 Méthode TDD

Le projet suit la méthode TDD :

1. RED : écrire un test qui échoue ;
2. GREEN : écrire le minimum de code pour le faire passer ;
3. REFACTOR : améliorer le code sans casser les tests.

Cette règle est documentée dans `docs/tdd/README.md` et reprise dans le README principal.

### 9.2 Tests automatisés

Le dépôt contient :

- 21 fichiers de tests backend dans `apps/backend/farid_tests` ;
- 47 fichiers de tests frontend dans `apps/frontend/src` ;
- 12 fichiers de tests candidate dans `apps/candidate/src`.

Les tests backend couvrent notamment :

- l'authentification ;
- les paramètres de sécurité ;
- les CRUD candidats, entreprises, employés, postes, candidatures, évaluations, templates ;
- les rôles d'administration ;
- les modèles et serializers.

Les tests frontend couvrent des composants, guards, interceptors, services et pages.

### 9.3 CI GitHub Actions

Le workflow CI contient trois grands jobs :

- lint et format backend avec Ruff ;
- tests backend Django avec PostgreSQL 16 en service GitHub Actions ;
- tests frontend et candidate avec installation npm, lint, typecheck, tests unitaires et build production.

Le workflow CD attend la réussite de la CI sur `dev`, puis fusionne automatiquement `dev` dans `main`. Cela met en place une chaîne d'intégration continue et une automatisation d'intégration vers la branche principale.

## 10. Réalisation et extraits de code significatifs

### 10.1 Configuration JWT

Le fichier `core/settings.py` configure Simple JWT avec :

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

Cet extrait montre le choix d'une session courte côté access token, complétée par un refresh token renouvelable et blacklisté après rotation.

### 10.2 Serializer de login

Le `LoginSerializer` authentifie l'utilisateur par email et mot de passe, refuse les comptes désactivés, puis crée un refresh token et un access token.

```python
refresh = RefreshToken.for_user(user)

return {
    "refresh": str(refresh),
    "access": str(refresh.access_token),
    "user": UserSerializer(user).data,
}
```

Cet extrait est représentatif du lien entre authentification Django, Simple JWT et réponse API consommée par Angular.

### 10.3 Filtrage des évaluations selon le rôle

Le ViewSet des évaluations adapte le queryset selon le rôle de l'utilisateur :

```python
if user.role in {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}:
    return queryset

if user.role == UserRoles.MANAGER:
    return queryset.filter(
        Q(assigned_to=user) | Q(section_assignments__assigned_to=user)
    ).distinct()

if user.role in {UserRoles.CANDIDATE, UserRoles.DRIVER, UserRoles.EMPLOYEE}:
    return queryset.filter(subject=user)
```

Cet extrait est important car il montre que la sécurité métier n'est pas limitée au frontend : le backend filtre les données retournées.

### 10.4 Intercepteur Angular

L'intercepteur Angular ajoute le token JWT aux requêtes protégées :

```typescript
const authReq =
  !isAuthEndpoint && accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : req;
```

En cas de 401, il tente de rafraîchir le token avant de rejouer la requête. Cette logique évite de déconnecter l'utilisateur à chaque expiration d'access token.

### 10.5 CI backend

La CI backend installe les dépendances, lance les checks Django, applique les migrations et exécute pytest :

```yaml
- name: Django checks + migrations
  run: |
    python manage.py check
    python manage.py migrate --noinput

- name: Run pytest
  run: |
    pytest -ra -q
```

Cet extrait montre que les migrations et les tests sont contrôlés automatiquement avant intégration.

## 11. Jeu d'essai représentatif

La fonctionnalité la plus représentative pour un jeu d'essai est l'authentification JWT, car elle conditionne l'accès à toute l'application.

### 11.1 Cas nominal : login

Précondition :

- un utilisateur actif existe en base ;
- son email et son mot de passe sont valides.

Étapes :

1. envoyer une requête POST sur `/api/auth/login/` avec email et mot de passe ;
2. vérifier que la réponse HTTP est 200 ;
3. vérifier la présence de `access`, `refresh` et `user` ;
4. utiliser l'access token dans l'en-tête `Authorization` ;
5. appeler `/api/auth/me/` ;
6. vérifier que l'API retourne les informations de l'utilisateur connecté.

Résultat attendu :

- l'utilisateur est authentifié ;
- le frontend peut stocker les tokens ;
- les routes protégées peuvent charger le profil utilisateur.

### 11.2 Cas d'erreur : mot de passe incorrect

Précondition :

- un utilisateur existe en base.

Étapes :

1. envoyer une requête POST sur `/api/auth/login/` avec un mauvais mot de passe ;
2. vérifier que la réponse est une erreur ;
3. vérifier que la réponse contient un détail d'erreur.

Résultat attendu :

- aucun token n'est fourni ;
- l'utilisateur n'accède pas à l'application.

### 11.3 Cas sécurité : refresh puis logout

Étapes :

1. se connecter ;
2. récupérer le refresh token ;
3. appeler `/api/auth/refresh/` ;
4. vérifier qu'un nouvel access token est retourné ;
5. appeler `/api/auth/logout/` avec le refresh token ;
6. rappeler `/api/auth/refresh/` avec le même refresh token.

Résultat attendu :

- le refresh fonctionne avant logout ;
- après logout, le refresh token est blacklisté ;
- une nouvelle tentative de refresh retourne une erreur.

Ces cas sont présents dans les tests backend.

## 12. Difficultés rencontrées

### 12.1 Technologies inconnues

La première difficulté a été la découverte simultanée de nombreuses technologies. Le projet demandait de comprendre à la fois le backend, le frontend, la base de données, les tokens JWT, le déploiement et les tests automatisés.

Cette montée en compétence a pris du temps, notamment parce qu'il fallait comprendre comment les couches communiquent :

- Angular appelle l'API ;
- l'API authentifie et autorise ;
- Django interroge PostgreSQL ;
- le frontend stocke et renouvelle les tokens ;
- les tests vérifient les contrats ;
- la CI rejoue les contrôles automatiquement.

### 12.2 Passage au travail solo

Le passage d'un projet à trois personnes vers un projet solo a changé la stratégie. Il n'était plus possible d'avancer en parallèle sur toutes les fonctionnalités. Il a fallu choisir une approche plus stricte, plus progressive, et donner la priorité aux fondations :

- architecture ;
- authentification ;
- sécurité ;
- tests ;
- CI/CD ;
- déploiement.

### 12.3 Difficulté du TDD

Le TDD a demandé un changement de méthode. Écrire les tests avant ou en même temps que le code impose de penser les comportements attendus avant l'implémentation. C'est plus long au départ, mais cela sécurise les évolutions et réduit les régressions.

### 12.4 Déploiement gratuit

La recherche d'un déploiement gratuit a aussi été une difficulté. Il fallait séparer les responsabilités :

- Vercel pour les applications Angular ;
- Render pour l'API Django ;
- Neon pour la base PostgreSQL ;
- variables d'environnement pour éviter les secrets dans le code ;
- `DATABASE_URL` pour connecter Django à une base externe ;
- `ALLOWED_HOSTS`, CORS et CSRF pour autoriser uniquement les origines prévues.

## 13. Déploiement gratuit

### 13.1 Backend Render

Le fichier `render.yaml` décrit le service backend :

- service web Python ;
- racine `apps/backend` ;
- installation des dépendances ;
- collecte des fichiers statiques ;
- migrations ;
- lancement avec Gunicorn ;
- variables d'environnement pour Django, la base de données, les hosts, CORS et CSRF.

Le fichier `Procfile` contient également la commande Gunicorn.

### 13.2 Frontend Vercel

Les applications Angular contiennent chacune un fichier `vercel.json` avec des headers de sécurité. Les fichiers d'environnement production pointent vers l'API Render :

```typescript
apiBaseUrl: 'https://faridproject-2-0.onrender.com'
```

### 13.3 Base de données Neon

Le backend est configuré pour utiliser PostgreSQL via la variable `DATABASE_URL`. Dans le déploiement gratuit présenté pour le projet, cette base externe correspond à Neon. Le code reste indépendant du fournisseur exact : Django lit l'URL de connexion et `dj-database-url` construit la configuration PostgreSQL.

## 14. Perspectives d'évolution

La roadmap interne du projet indique plusieurs axes d'amélioration :

- aligner totalement le contrat d'authentification entre backend, application interne et application candidate ;
- renforcer la couverture des permissions backend ;
- compléter le portail candidat ;
- finaliser le dashboard candidat avec candidatures et historique ;
- durcir le workflow d'évaluation manager ;
- améliorer la matrice de permissions de bout en bout ;
- stabiliser l'expérience UI ;
- compléter les tests de permissions et les parcours critiques.

Une évolution possible serait également d'ajouter des tests end-to-end pour valider les parcours complets depuis le navigateur, en complément des tests unitaires et d'intégration déjà présents.

## 15. Conclusion

FaridProject 2.0 est un projet de reconstruction applicative complet. Il couvre le frontend, le backend, la base de données, l'authentification, la sécurité, les tests et le déploiement.

Le point le plus important du projet est le changement de méthode : après une phase de recherche difficile et la découverte de technologies inconnues, le projet a été repris sur une base plus propre, en TDD, avec une CI/CD et une architecture monorepo. Le passage d'un projet prévu à trois personnes vers un projet solo a rendu nécessaire une organisation rigoureuse par backlog, tickets Kanban et priorisation.

Le résultat est une base applicative maintenable, testée et prête à évoluer progressivement vers un MVP complet.

