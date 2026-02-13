# 📙 Spécifications Fonctionnelles — Projet FARID

## 1. 🎯 Contexte
Le secteur du transport souffre d’une pénurie de conducteurs.  
FARID souhaite une application interne pour :
- évaluer candidats et salariés,
- uniformiser les critères,
- centraliser les entretiens,
- faciliter la collaboration RH / responsables / direction.

---

## 2. 🎯 Objectifs
- Centraliser les évaluations  
- Standardiser les grilles  
- Rechercher des profils selon critères  
- Suivre l’évolution des salariés  

---

## 3. 📌 Périmètre Fonctionnel
Deux cas principaux :
1. **Évaluation d’un candidat externe**  
2. **Évaluation d’un salarié interne**

Fonctionnalités couvertes :
- gestion utilisateurs  
- gestion candidats  
- gestion postes  
- gestion grilles  
- processus d’évaluation  
- supervision  

---

## 4. 👥 Utilisateurs & Rôles

| Rôle | Description | Droits |
|------|-------------|--------|
| RH | Gère candidats, postes, grilles | CRUD + évaluations |
| Direction | Supervision | Lecture + stats |
| Responsable | Hard skills | Remplissage grille |
| Responsable Opérationnel | Hard skills | Remplissage grille |
| Administrateur | Gestion utilisateurs | CRUD utilisateurs |

---

## 5. 🧩 Fonctionnalités

### 5.1 Gestion des candidats
- Création / modification  
- Consultation fiche  
- Recherche  
- Filtrage  

### 5.2 Gestion des postes
- CRUD postes  
- Consultation détail  
- Association grilles  

### 5.3 Grilles d’évaluation
- Création / modification  
- Consultation  
- Association à un poste  

### 5.4 Processus d’évaluation
- Démarrage  
- Soft skills  
- Hard skills  
- Validation  
- Synthèse  
- Historique  

### 5.5 Gestion utilisateurs
- CRUD utilisateurs  
- Attribution / retrait rôles  
- Désactivation  

### 5.6 Supervision
- Statistiques  
- Évaluations terminées  
- Évaluations en cours  

---

## 6. 🧭 Parcours Utilisateurs

### Candidat
- Accès portail  
- Consultation profil  
- Suivi évaluation  
- Historique  

### RH
- Gestion candidats  
- Gestion postes  
- Gestion grilles  
- Lancement évaluations  
- Validation  

### Responsable
- Évaluations techniques  
- Commentaires  
- Soumission  

### Administrateur
- Gestion utilisateurs  
- Permissions  
- Maintenance  

### Direction
- Dashboard  
- Synthèses  
- Décisions  

---

## 7. 📏 Règles de Gestion
- Un candidat ne peut exister plusieurs fois  
- Une évaluation = un candidat + un évaluateur  
- Les responsables ne voient que leurs évaluations  
- Direction & Admin voient tout  
- Une grille utilisée ne peut être supprimée  
- Un utilisateur ne peut être supprimé  
- Chaque évaluateur doit donner un avis  

---

## 8. 📌 Contraintes
- Web responsive  
- PostgreSQL  
- Auth sécurisée  
- Compatibilité Chrome / Edge / Firefox  

---

## 9. 📦 Livrables
- Application web  
- Documentation technique + fonctionnelle  
- Grilles préconfigurées  
- Base initiale  
- Rapport de tests  

---

## 10. ✔ Critères de Validation
- Auth OK  
- Évaluations OK  
- Recherche OK  
- Données sécurisées  
- Interface claire  

