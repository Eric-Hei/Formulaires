# Forms — Surcouche formulaires pour docs (Suite Numérique)

Outil de création de sondages et d'enquêtes (à la Tally.so / Typeform) construit en surcouche de [docs](https://github.com/suitenumerique/docs), sans modifier son code upstream.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docs (upstream, image Docker officielle)           │
│  Django API · Next.js · BlockNote · Yjs             │
└────────────────────┬────────────────────────────────┘
                     │ API REST
┌────────────────────▼────────────────────────────────┐
│  Surcouche Forms                                    │
│                                                     │
│  frontend/          backend/                        │
│  Next.js 14         Django + DRF                    │
│  BlockNote étendu   PostgreSQL                      │
│  Tailwind CSS       Auth → docs API                 │
└─────────────────────────────────────────────────────┘
```

Un formulaire = un document docs enrichi de blocs personnalisés (`formShortText`, `formMultipleChoice`, etc.). Les réponses sont stockées dans la base PostgreSQL de la surcouche.

---

## Prérequis

- [Docker](https://www.docker.com/) et Docker Compose
- [Node.js](https://nodejs.org/) 20+ (développement frontend local)
- [Python](https://www.python.org/) 3.12+ (développement backend local)

---

## Démarrage rapide

### 1. Cloner et configurer l'environnement

```bash
git clone <url-du-repo>
cd Formulaires

cp env.example .env
# Éditer .env selon votre configuration
```

### 2. Lancer avec Docker Compose

```bash
docker-compose up
```

| Service | URL |
|---|---|
| Forms Frontend | http://localhost:3001 |
| Forms Backend (API) | http://localhost:8080 |
| Docs Backend | http://localhost:8071 |
| Docs Frontend | http://localhost:3000 |

---

## Développement local (sans Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Base de données SQLite pour le dev
python manage.py migrate
python manage.py runserver 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:3001
```

---

## Variables d'environnement

Copier `env.example` en `.env` à la racine et ajuster les valeurs.

### Backend

| Variable | Description | Défaut |
|---|---|---|
| `SECRET_KEY` | Clé secrète Django | *(à changer en prod)* |
| `DEBUG` | Mode debug | `True` |
| `DATABASE_URL` | URL PostgreSQL | SQLite local |
| `DOCS_API_URL` | URL de l'API docs | `http://localhost:8071/api/v1.0` |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées | `http://localhost:3001` |
| `DEV_BYPASS_TOKEN` | Token de bypass OIDC (dev uniquement) | vide |

### Frontend

| Variable | Description | Défaut |
|---|---|---|
| `NEXT_PUBLIC_DOCS_API_URL` | URL de l'API docs | `http://localhost:8071/api/v1.0` |
| `NEXT_PUBLIC_FORMS_API_URL` | URL du backend forms | `http://localhost:8080` |
| `NEXT_PUBLIC_APP_URL` | URL publique du frontend | `http://localhost:3001` |
| `NEXT_PUBLIC_DEV_MODE` | Active le bypass OIDC | `false` |
| `NEXT_PUBLIC_DEV_BYPASS_TOKEN` | Token de bypass (doit correspondre au backend) | — |

---

## Bypass OIDC (développement)

Par défaut, l'authentification passe par l'instance docs (OIDC/ProConnect). Pour développer sans instance docs configurée, activer le bypass :

**`.env` (backend) :**
```
DEBUG=True
DEV_BYPASS_TOKEN=dev-bypass-token
```

**`.env.local` (frontend) :**
```
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_DEV_BYPASS_TOKEN=dev-bypass-token
```

Le token de bypass est injecté automatiquement dans toutes les requêtes. Un utilisateur fictif (`dev@localhost`) est retourné par le backend sans aucun appel OIDC.

> Le bypass est inactif si `DEBUG=False` ou si `DEV_BYPASS_TOKEN` est vide.

---

## Blocs formulaire disponibles

| Type | Description |
|---|---|
| `formShortText` | Texte court |
| `formLongText` | Texte long |
| `formMultipleChoice` | Choix unique (radio) |
| `formCheckbox` | Choix multiple |
| `formRating` | Notation par étoiles |
| `formDate` | Sélecteur de date / date-heure |
| `formDropdown` | Liste déroulante |
| `formDivider` | Séparateur de section |

Dans l'éditeur, taper `/` pour insérer un bloc depuis le menu.

---

## API du backend forms

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/forms/:id/settings/` | Non | Paramètres du formulaire |
| `POST` | `/api/forms/:id/settings/` | Oui | Créer les paramètres |
| `PUT` | `/api/forms/:id/settings/` | Oui | Mettre à jour les paramètres |
| `POST` | `/api/forms/:id/responses/` | Non | Soumettre une réponse |
| `GET` | `/api/forms/:id/responses/` | Oui | Lister les réponses |
| `GET` | `/api/forms/:id/stats/` | Oui | Statistiques agrégées |

---

## Structure du projet

```
Formulaires/
├── env.example               # Variables d'environnement (template)
├── docker-compose.yml        # Docs + surcouche ensemble
├── env.d/
│   └── docs.env              # Config de l'instance docs
├── backend/                  # Django + DRF
│   ├── forms/                # App Django principale
│   │   ├── models.py         # FormSettings, FormResponse
│   │   ├── views.py          # Vues API REST
│   │   ├── serializers.py
│   │   ├── authentication.py # DocsTokenAuthentication + bypass dev
│   │   └── urls.py
│   ├── forms_backend/        # Config Django (settings, urls, wsgi)
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/                 # Next.js 14 + Tailwind CSS
    └── src/
        ├── app/              # Pages (App Router)
        │   ├── page.tsx               # Liste des formulaires
        │   ├── forms/new/             # Création
        │   ├── editor/[documentId]/   # Éditeur
        │   ├── f/[documentId]/        # Page publique (répondant)
        │   └── dashboard/[documentId]/# Analytics
        ├── blocks/           # Custom BlockNote blocks
        ├── components/
        │   ├── editor/       # FormEditor
        │   ├── renderer/     # FormRenderer (page publique)
        │   └── dashboard/    # Dashboard analytics
        └── lib/
            ├── docs-api.ts   # Client API docs
            └── forms-api.ts  # Client API forms backend
```

---

## Mise à jour de docs (upstream)

La surcouche ne fork pas docs — elle consomme son image Docker officielle.

```bash
# Mettre à jour l'image docs
docker-compose pull docs-backend docs-frontend
docker-compose up -d
```

En cas de changement d'API dans docs, seuls `src/lib/docs-api.ts` et éventuellement les blocs BlockNote sont à adapter.
