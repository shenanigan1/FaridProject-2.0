# FaridProject‑2.0  
### *Rebuild from Scratch • Monorepo • Test Driven Development • Clean Architecture*

FaridProject‑2.0 est la nouvelle version entièrement repensée du projet FARID.  
Ce dépôt adopte une approche **ultra‑propre**, **scalable** et **maintenable**, basée sur :

- **Test Driven Development (TDD)**
- **Clean Architecture**
- **Monorepo** (Frontend + Backend dans un seul repo)
- **Séparation claire des responsabilités**
- **Préparation au stockage externe (OSS / MinIO / Aliyun)**
- **Préparation aux modèles dynamiques (JSON Schema + Interfaces)**

L’objectif est de reconstruire l’application FARID depuis zéro, avec une base saine, testée, et évolutive.

---

## 📦 Architecture du Monorepo

```
FaridProject-2.0/
│
├── apps/
│   ├── frontend/                         # Application Angular (Admin + Candidat)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/                 # Services globaux, interceptors, guards
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── http/
│   │   │   │   │   ├── guards/
│   │   │   │   │   └── interceptors/
│   │   │   │   │
│   │   │   │   ├── shared/               # UI réutilisable
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── directives/
│   │   │   │   │   └── pipes/
│   │   │   │   │
│   │   │   │   ├── features/             # Modules fonctionnels
│   │   │   │   │   ├── auth/             # Login / Register
│   │   │   │   │   ├── admin/            # Interface Admin
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── candidates/
│   │   │   │   │   │   ├── positions/
│   │   │   │   │   │   ├── templates/
│   │   │   │   │   │   ├── tests/
│   │   │   │   │   │   ├── evaluations/
│   │   │   │   │   │   └── users/
│   │   │   │   │   ├── candidate/        # Interface Candidat
│   │   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── jobs/
│   │   │   │   │   │   └── evaluations/
│   │   │   │   │
│   │   │   │   ├── types/                # Types TypeScript
│   │   │   │   ├── utils/                # Helpers frontend
│   │   │   │   └── environments/
│   │   │   │
│   │   │   ├── tests/                    # Tests Angular (TDD)
│   │   │   │   ├── unit/
│   │   │   │   ├── integration/
│   │   │   │   └── factories/
│   │   │   │
│   │   │   └── index.html
│   │   └── package.json
│   │
│   ├── backend/                          # API Django REST Framework
│   │   ├── core/                         # Settings, middlewares, utils
│   │   ├── users/                        # Auth, rôles, permissions
│   │   │   ├── models/
│   │   │   ├── serializers/
│   │   │   ├── views/
│   │   │   ├── routes/
│   │   │   └── tests/
│   │   ├── candidates/
│   │   │   ├── models/
│   │   │   ├── serializers/
│   │   │   ├── views/
│   │   │   ├── routes/
│   │   │   └── tests/
│   │   ├── positions/
│   │   ├── templates/                    # Templates dynamiques (JSON Schema)
│   │   ├── evaluations/
│   │   ├── storage/                      # Futur OSS / MinIO
│   │   ├── utils/
│   │   ├── tests/                        # Tests globaux (pytest)
│   │   ├── manage.py
│   │   └── requirements.txt
│   │
│   └── api-gateway/                      # (Optionnel futur) Gateway Node/Nginx
│
├── packages/
│   └── shared/                           # Code partagé (types, utils)
│       ├── src/
│       │   ├── types/
│       │   ├── utils/
│       │   └── config/
│       └── package.json
│
├── docs/                                 # Documentation projet
│   ├── architecture/
│   ├── api/
│   ├── tdd/
│   └── roadmap.md
│
├── .github/
│   ├── workflows/                        # CI/CD (tests, lint)
│   └── ISSUE_TEMPLATE/
│
├── package.json                          # Workspace monorepo
├── tsconfig.json                          # Config TS globale
└── README.md
```

---

## 🚀 Objectifs du projet

- Repartir sur une architecture propre et maîtrisée  
- Développer chaque fonctionnalité **en TDD** (tests avant le code)  
- Construire un MVP minimal mais solide  
- Préparer l’intégration future du stockage externe (OSS)  
- Préparer un système de **modèles dynamiques** (JSONField + interfaces Angular)  
- Garantir un code testable, maintenable et évolutif  

---

## 🧪 Test Driven Development (TDD)

Le projet suit strictement le cycle :

1. **RED** → écrire un test qui échoue  
2. **GREEN** → écrire le minimum de code pour le faire passer  
3. **REFACTOR** → nettoyer le code sans casser les tests  

### 🔹 Backend (Django)

- pytest  
- pytest‑django  
- factory_boy  
- faker  
- APIClient  
- Tests unitaires  
- Tests API  
- Tests permissions  

### 🔹 Frontend (Angular)

- Jasmine  
- Karma  
- Angular Testing Utilities  
- HttpTestingController  
- Spies  
- Mocks  
- Factories  
- Assertions  

---

## 🧱 Technologies utilisées

### Backend
- Python 3  
- Django REST Framework  
- PostgreSQL  
- Pytest  
- Factory Boy  

### Frontend
- Angular  
- TypeScript  
- Jasmine / Karma  
- Angular Testing Utilities  

---

## 🧩 Fonctionnalités du MVP

Le MVP se concentre sur un socle minimal mais propre :

### ✔ Page de connexion  
### ✔ Interface Admin  

Pages prévues :

- Home  
- Candidats  
- Postes  
- Templates de tests  
- Tests  
- Évaluations  
- Utilisateurs  

🎯 **Objectif : un socle fonctionnel, testé, sans Docker pour l’instant.**

---

## 📦 Stockage externe (prévu mais non activé dans le MVP)

Le projet prévoit l’intégration future d’un système de stockage externe (Aliyun OSS / MinIO) pour :

- stocker des documents hors BDD  
- générer des URLs signées  
- gérer des fichiers volumineux  

Cette partie sera intégrée **après stabilisation du MVP**.

---

## 🧩 Modèles dynamiques (prévu)

Le projet prévoit un système de **templates dynamiques** basé sur :

### Backend  
- `JSONField` pour stocker les schémas  
- Génération dynamique des champs  

### Frontend  
- Interfaces TypeScript  
- Reactive Forms dynamiques  
- Génération automatique des champs depuis le schéma  

🎯 **Objectif : créer des grilles d’évaluation sans coder.**

---

## 🛠 Installation

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sous Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

---

## 🧪 Lancer les tests

### Backend (pytest)

```bash
cd backend
pytest
```

### Frontend (Jasmine/Karma)

```bash
cd frontend
npm test
```

---

## 🧭 Roadmap

### Phase 1 — Setup propre
- Backend Django  
- Frontend Angular  
- Authentification JWT  
- Routing + Interceptors  

### Phase 2 — TDD Auth
- Tests backend  
- Tests frontend  
- Login + Guards  

### Phase 3 — Interface Admin
- Layout  
- Navigation  
- Permissions  

### Phase 4 — Candidats / Postes
- CRUD complet  
- Tests unitaires  

### Phase 5 — Templates / Tests / Évaluations
- MVP simple  
- Tests unitaires  

### Phase 6 — Features avancées
- Stockage OSS  
- Modèles dynamiques  
- Dashboard  

---

## 🎯 Philosophie du projet

> **Code propre, testé, évolutif.  
> Pas de features inutiles.  
> Pas de dette technique.  
> TDD avant tout.**

FaridProject‑2.0 est conçu pour être un projet professionnel, structuré, et maintenable sur le long terme.
