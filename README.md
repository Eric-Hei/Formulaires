# Formulaires — Surcouche formulaires pour Docs (Suite Numérique)

Outil de création de sondages et d'enquêtes (inspiré de Tally.so / Typeform) construit **en surcouche de [Docs](https://github.com/suitenumerique/docs)**, sans modifier son code upstream.

---

## Relation avec Docs (Suite Numérique)

Formulaires s'appuie sur Docs à deux niveaux :

### 1. Stockage des documents

Chaque formulaire **est** un document Docs, enrichi de blocs personnalisés (`formShortText`, `formMultipleChoice`, etc.). Formulaires appelle l'API REST de Docs pour lister, créer et mettre à jour ces documents :

```
NEXT_PUBLIC_DOCS_API_URL → GET/POST/PATCH /api/v1.0/documents/
```

Les contenus des documents (structure des blocs BlockNote) sont stockés et versionnés par Docs. Seules les **réponses** des répondants sont stockées dans la base PostgreSQL de Formulaires.

### 2. Authentification

Formulaires ne gère pas ses propres utilisateurs. Toute action d'édition est authentifiée via le **token Bearer** émis par Docs (OIDC / ProConnect). Le backend Formulaires valide chaque token en appelant `/api/v1.0/users/me/` sur l'instance Docs :

```
requête frontend → Bearer <token docs> → backend Formulaires
                                              ↓
                                  GET /api/v1.0/users/me/ (Docs)
                                              ↓
                                   identité confirmée → traitement
```

La page publique de réponse (`/f/:id`) est accessible sans authentification.

### Mode développement sans Docs

Pour développer sans instance Docs, le backend embarque une **API mock** (`DEBUG=True` uniquement) qui expose `/api/v1.0/documents/` et `/api/v1.0/users/me/` en local. Un token de bypass est utilisé à la place de l'OIDC réel. Voir la section [Bypass OIDC](#bypass-oidc-développement).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Docs (Suite Numérique)                                      │
│  Django API · Next.js · BlockNote · Yjs · OIDC/ProConnect   │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API + Bearer token
          ┌────────────┴──────────────┐
          │                           │
┌─────────▼──────────┐    ┌───────────▼───────────────────────┐
│  Forms Backend     │    │  Forms Frontend                   │
│  Django + DRF      │    │  Next.js 14 + BlockNote étendu    │
│  PostgreSQL        │    │  Tailwind CSS                     │
│  Auth via Docs API │    │  Blocs formulaire personnalisés   │
└────────────────────┘    └───────────────────────────────────┘
```

**Flux en production :**
1. L'utilisateur se connecte via Docs (OIDC/ProConnect) et obtient un token
2. Le frontend Formulaires utilise ce token pour appeler Docs (liste et contenu des documents) et le backend Formulaires (paramètres, réponses)
3. Les répondants accèdent à `/f/:id` sans authentification

---

## Fonctionnalités

- **Éditeur** basé sur BlockNote — mêmes blocs que Docs + blocs formulaire spécifiques
- **Pagination** du formulaire avec sauts de page (à la Tally.so)
- **Logique conditionnelle** : afficher/masquer des blocs ou des pages entières selon les réponses
- **Champs obligatoires** avec mise en évidence des champs manquants
- **Partage** par lien public (aucune authentification requise pour répondre)
- **Accessibilité RGAA** : barre de progression, `role="alert"`, `aria-invalid`, navigation clavier

---

## Prérequis

- [Node.js](https://nodejs.org/) 20+
- [Python](https://www.python.org/) 3.12+
- [Docker](https://www.docker.com/) *(uniquement pour le mode avec Docs réel)*

---

## Démarrage rapide — développement local (sans Docs)

Ce mode utilise l'API mock intégrée au backend. Aucune instance Docs n'est nécessaire.

### 1. Configurer l'environnement

```powershell
git clone https://github.com/Eric-Hei/Formulaires.git
cd Formulaires

Copy-Item env.example .env
# Éditer .env : vérifier que DEBUG=True et DEV_BYPASS_TOKEN est défini

Copy-Item frontend\env.example frontend\.env.local
# Vérifier que NEXT_PUBLIC_DEV_MODE=true
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8080
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev        # http://localhost:3001
```

### 4. Script de lancement automatique (Windows)

```powershell
.\start.ps1        # Ouvre backend (port 8080) et frontend (port 3001) dans deux fenêtres séparées
```

| Service | URL |
|---|---|
| Formulaires Frontend | http://localhost:3001 |
| Formulaires Backend (API) | http://localhost:8080 |
| API mock Docs (intégrée) | http://localhost:8080/api/v1.0 |

---

## Démarrage avec Docs réel (Docker)

Ce mode connecte Formulaires à une instance Docs existante via le réseau Docker `lasuite-network`.

### Prérequis

- Une instance [Docs](https://github.com/suitenumerique/docs) lancée sur le réseau `lasuite-network`
- Le réseau Docker `lasuite-network` doit exister : `docker network create lasuite-network`

### Lancement

```bash
docker-compose up -d
```

| Service | URL |
|---|---|
| Formulaires Frontend | http://localhost:3001 |
| Formulaires Backend (API) | http://localhost:8082 |
| PostgreSQL (Formulaires) | localhost:5434 |
| Docs Backend | http://localhost:8071 *(instance externe)* |
| Docs Frontend | http://localhost:3000 *(instance externe)* |

Dans ce mode, `DOCS_API_URL` doit pointer vers le service Docs sur le réseau Docker (ex. `http://impress:8000/api/v1.0`) et `DEV_BYPASS_TOKEN` doit être laissé vide.

---

## Bypass OIDC (développement)

Permet de développer sans OIDC ni instance Docs. **Ne jamais activer en production.**

**`.env` (backend) :**
```
DEBUG=True
DEV_BYPASS_TOKEN=dev-bypass-token
```

**`frontend/.env.local` :**
```
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_DEV_BYPASS_TOKEN=dev-bypass-token
```

Le token est injecté automatiquement dans toutes les requêtes. Le backend retourne un utilisateur fictif (`dev@localhost`) sans contacter Docs. Le bypass est automatiquement désactivé si `DEBUG=False` ou si `DEV_BYPASS_TOKEN` est vide.

---

## Variables d'environnement

Copier `env.example` en `.env` à la racine.

### Backend (`.env`)

| Variable | Description | Défaut |
|---|---|---|
| `SECRET_KEY` | Clé secrète Django | *(à changer en prod)* |
| `DEBUG` | Mode debug — active le mock API et le bypass OIDC | `True` |
| `DATABASE_URL` | URL PostgreSQL | SQLite local si absent |
| `DOCS_API_URL` | URL de l'API Docs upstream | `http://localhost:8071/api/v1.0` |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées (séparées par des virgules) | `http://localhost:3001` |
| `DEV_BYPASS_TOKEN` | Token de bypass OIDC (dev uniquement, vide = désactivé) | vide |

### Frontend (`frontend/.env.local`)

| Variable | Description | Défaut |
|---|---|---|
| `NEXT_PUBLIC_DOCS_API_URL` | URL de l'API Docs (ou du mock en dev) | `http://localhost:8071/api/v1.0` |
| `NEXT_PUBLIC_FORMS_API_URL` | URL du backend Formulaires | `http://localhost:8080` |
| `NEXT_PUBLIC_APP_URL` | URL publique du frontend | `http://localhost:3001` |
| `NEXT_PUBLIC_DEV_MODE` | Active le bypass OIDC côté frontend | `false` |
| `NEXT_PUBLIC_DEV_BYPASS_TOKEN` | Token de bypass (doit correspondre au backend) | — |

---

## Blocs formulaire disponibles

Dans l'éditeur, taper `/` pour insérer un bloc depuis le menu slash.

| Type | Description |
|---|---|
| `formShortText` | Texte court (une ligne) |
| `formLongText` | Texte long (paragraphe) |
| `formMultipleChoice` | Choix unique (boutons radio) |
| `formCheckbox` | Choix multiple (cases à cocher) |
| `formRating` | Notation par étoiles |
| `formDate` | Sélecteur de date / date-heure |
| `formDropdown` | Liste déroulante |
| `formDivider` | Séparateur visuel de section |
| `formPageBreak` | Saut de page (pagination Tally.so-style) |

Chaque bloc de saisie supporte : champ obligatoire, texte d'aide, affichage conditionnel.

---

## API du backend Formulaires

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/forms/:id/settings/` | Non | Paramètres du formulaire |
| `POST` | `/api/forms/:id/settings/` | Oui (token Docs) | Créer les paramètres |
| `PUT` | `/api/forms/:id/settings/` | Oui (token Docs) | Mettre à jour les paramètres |
| `POST` | `/api/forms/:id/responses/` | Non | Soumettre une réponse |
| `GET` | `/api/forms/:id/responses/` | Oui (token Docs) | Lister les réponses |
| `GET` | `/api/forms/:id/stats/` | Oui (token Docs) | Statistiques agrégées |

---

## Structure du projet

```
Formulaires/
├── env.example                    # Template des variables d'environnement
├── docker-compose.yml             # Formulaires + PostgreSQL (se connecte à lasuite-network)
├── start.ps1                      # Script de lancement local (Windows)
├── backend/                       # Django + DRF
│   ├── forms/
│   │   ├── models.py              # FormSettings, FormResponse, MockDocument
│   │   ├── views.py               # Vues API REST
│   │   ├── serializers.py
│   │   ├── authentication.py      # DocsTokenAuthentication + bypass dev
│   │   ├── docs_mock_views.py     # Mock API Docs (DEBUG=True uniquement)
│   │   └── urls.py
│   ├── forms_backend/             # Config Django (settings, urls, wsgi)
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/                      # Next.js 14 + Tailwind CSS
    └── src/
        ├── app/
        │   ├── page.tsx                    # Liste des formulaires
        │   ├── editor/[documentId]/        # Éditeur (authentifié)
        │   ├── f/[documentId]/             # Page publique répondant
        │   └── dashboard/[documentId]/     # Analytique (authentifié)
        ├── blocks/                         # Blocs BlockNote personnalisés
        │   ├── ConditionEditor.tsx         # UI de logique conditionnelle
        │   └── Form*.tsx                   # Un fichier par type de bloc
        ├── components/
        │   ├── editor/FormEditor.tsx       # Éditeur BlockNote étendu
        │   └── renderer/FormRenderer.tsx   # Rendu formulaire + navigation
        └── lib/
            ├── docs-api.ts                 # Client API Docs
            └── forms-api.ts               # Client API Formulaires backend
```
