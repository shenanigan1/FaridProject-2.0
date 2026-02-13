# 📘 Spécifications Techniques — Projet FARID

## 1. 🎯 Objectifs Techniques
L’application FARID vise à fournir un système fiable d’évaluation des candidats et salariés selon des critères objectifs.  
Les objectifs techniques principaux sont :
- garantir la scalabilité,
- assurer la sécurité des données,
- maintenir une architecture claire et modulaire,
- permettre une évolution future sans dette technique.

---

## 2. 🏗️ Architecture du Système

### Vue d’ensemble
L’application repose sur une architecture **client–serveur** :

- **Frontend** : Angular  
- **Backend** : Django REST Framework  
- **Base de données** : PostgreSQL  
- **Authentification** : JWT  
- **Déploiement** : Docker + Linux  

### Schéma général
Frontend → API REST → Backend → PostgreSQL  
(Architecture conteneurisée via Docker)

---

## 3. 🛠️ Technologies et Outils

| Catégorie | Technologie | Rôle |
|----------|-------------|------|
| Frontend | Angular | Interface utilisateur |
| Backend | Django REST Framework | API REST sécurisée |
| Base de données | PostgreSQL | Stockage relationnel |
| Auth | JWT | Sessions sécurisées |
| Déploiement | Docker | Conteneurisation |
| Versioning | Git / GitHub | Suivi du code |
| Langages | Python, TypeScript | Développement |

---

## 4. 🗄️ Modèle de Données

### Tables principales
- **Personne** : identité de base  
- **Utilisateur** : rôles et permissions  
- **Candidat** : statut, poste visé  
- **Employé** : salarié interne  
- **Entreprise** : structure employeur  
- **Poste** : description + service + contrat  
- **GrilleEvaluation** : structure d’évaluation  
- **Critere** : questions / critères  
- **Evaluation** : résultats + commentaires  
- **Flag** : indicateurs (ex : permis PL)  
- **Recherche** : liens personne ↔ critère  

Chaque table est décrite dans le document original.

---

## 5. 🧩 Modules Applicatifs

### Module 1 — Gestion des Utilisateurs
- Authentification JWT  
- Gestion des rôles : Admin, RH, Direction, Responsable  
- CRUD utilisateurs  

### Module 2 — Gestion des Candidats
- Création / modification  
- Recherche / filtrage  
- Consultation détaillée  

### Module 3 — Gestion des Postes
- CRUD postes  
- Association à des grilles  

### Module 4 — Grilles d’Évaluation
- Création / modification  
- Critères et catégories  
- Association à un poste  

### Module 5 — Processus d’Évaluation
- Soft skills  
- Hard skills  
- Validation  
- Synthèse  

### Module 6 — Supervision
- Statistiques globales  
- Suivi des évaluations  

---

## 6. 📡 Documentation API (extraits)

### Auth
- POST `/api/auth/login/`
- POST `/api/auth/register/`
- GET `/api/auth/me/`

### Candidats
- POST `/api/candidats/`
- GET `/api/candidats/`
- GET `/api/candidats/{id}/`

### Évaluations
- POST `/api/evaluations/`
- GET `/api/evaluations/`

---

## 7. 🚀 Installation & Déploiement

### Prérequis
- Python ≥ 3.10  
- Node ≥ 24  
- PostgreSQL ≥ 18  
- Docker  

### Installation
```bash
git clone <repo>
docker-compose up --build
```

---

## 8. 🔐 Sécurité
- JWT  
- Permissions par rôle  
- Hashage mots de passe  
- CORS / CSRF  

---

## 9. 🔧 Maintenance & Évolutions
- Documentation interne  
- Tests unitaires (pytest / Jasmine)  
- Possibles évolutions : notifications, BI, dashboard avancé  

