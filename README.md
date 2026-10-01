# ⚡ DataPulse

> **Intelligent Data Profiling, Automated Analytics & Visual Exploration Platform**

DataPulse is a full-stack, data analytics and visualization platform built with **FastAPI**, **PostgreSQL**, **React 19**, and **Tailwind CSS**. It transforms raw data files (CSV, Excel) into actionable insights with automated data profiling, data quality scoring, and smart chart recommendations.

---

## 🚀 Key Features

- **📁 High-Performance Ingestion**: Upload CSV, XLSX, and XLS datasets up to 50MB with instant schema detection, type inference, and sample previews.
- **🔍 Automated Data Profiling**: Instantly computes dataset health metrics:
  - Missing value counts & percentages
  - Duplicate row detection
  - Statistical summaries & distributions
  - Overall Data Quality Score (0–100%)
- **📊 Smart Chart Recommendations**: Automated visualization engine that scores and suggests optimal chart types (Bar, Line, Scatter, Area, Pie) based on column cardinality, data types, and correlation patterns.
- **🎨 Interactive Dashboard**: Dynamic data workspace featuring interactive Recharts visualizations, column filtering, and raw data browsing.
- **🔐 Secure Firebase Authentication**: Seamless user management, token verification, and per-user workspace isolation using Firebase Authentication & Firebase Admin SDK.
- **🛡️ Resilient Database Architecture**: Powered by PostgreSQL with SQLAlchemy 2.0 ORM and Alembic migrations, with automatic SQLite fallback for local development.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ORM & Migrations**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Database Driver**: [psycopg (binary)](https://www.psycopg.org/) & [psycopg2-binary](https://pypi.org/project/psycopg2-binary/)
- **Data Processing**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/), [OpenPyXL](https://openpyxl.readthedocs.io/)
- **Authentication**: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- **Server**: [Uvicorn](https://www.uvicorn.org/)

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Auth**: [Firebase Web SDK](https://firebase.google.com/docs/web/setup)

### Database & Tools
- **PostgreSQL 14+** / **pgAdmin 4**
- **SQLite** (Auto-fallback)

---

## 📂 Project Structure

```text
DataPulse/
├── backend/
│   ├── alembic/                 # Alembic migration configurations
│   ├── app/
│   │   ├── core/                # Config, database engine, auth & exceptions
│   │   ├── dependencies/        # FastAPI dependencies (user, auth)
│   │   ├── firebase/            # Firebase Admin SDK initialization
│   │   ├── models/              # SQLAlchemy database models
│   │   │   ├── user.py          # Users table
│   │   │   ├── dashboard.py     # Dashboards table
│   │   │   ├── dataset.py       # Datasets metadata table
│   │   │   ├── dataset_column.py# Dataset columns & types
│   │   │   ├── dataset_profile.py# Data quality & statistics
│   │   │   └── chart.py         # Recommended & saved charts
│   │   ├── repositories/        # Database query abstractions
│   │   ├── routes/              # FastAPI API route controllers
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic (profiling, chart recommender)
│   │   └── utils/               # Analytics, file validation & helpers
│   ├── migrations/              # Alembic migration revisions
│   ├── uploads/                 # Local directory for uploaded files
│   ├── .env.example             # Backend environment template
│   ├── data_pulse.sql           # Complete PostgreSQL DDL script for pgAdmin
│   ├── requirements.txt         # Python dependencies
│   └── alembic.ini              # Alembic configuration
│
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── api/                 # Axios API clients
│   │   ├── components/          # Reusable UI, layout & chart components
│   │   ├── context/             # React context (AuthContext, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Firebase web config & utilities
│   │   ├── pages/               # Application views
│   │   │   ├── LoginPage.jsx
│   │   │   ├── OverviewPage.jsx
│   │   │   ├── DatasetsPage.jsx
│   │   │   ├── DatasetWorkspacePage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── App.jsx              # Main router & routes
│   │   └── index.css            # Tailwind & theme styles
│   ├── .env.example             # Frontend environment template
│   ├── package.json             # Node dependencies & scripts
│   └── vite.config.js           # Vite dev server configuration
│
├── docs/                        # Project documentation
├── .gitignore                   # Production-grade Git ignore rules
└── README.md                    # Project documentation
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+ (npm 9+)
- **PostgreSQL**: 14+ (or pgAdmin)
- **Git**

---

### 2. Database Setup (pgAdmin / PostgreSQL)

1. Open **pgAdmin** and connect to your local PostgreSQL server.
2. Create a new database named **`datapulse`**:
   - Right-click **Databases** > **Create** > **Database...**
   - Database name: `datapulse` > Click **Save**.
3. Right-click on **`datapulse`** > Select **Query Tool**.
4. Open or copy the contents of [`backend/data_pulse.sql`](backend/data_pulse.sql) and execute the query (`F5` or ▶).
   This creates all required tables:
   - `users`
   - `dashboards`
   - `datasets`
   - `dataset_columns`
   - `dataset_profiles`
   - `charts`
   - `alembic_version`

---

### 3. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# On macOS/Linux: source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Set up environment variables
# Copy .env.example to .env
cp .env.example .env

# 5. Place your Firebase service account JSON in:
# backend/app/firebase-service-account.json

# 6. Start the FastAPI development server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend API will be running at:
- **Base API**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

### 4. Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Set up environment variables
# Copy .env.example to .env
cp .env.example .env
# Edit frontend/.env with your Firebase web configuration

# 4. Start the Vite development server
npm run dev
```

The frontend application will be running at:
- **Web App**: `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the application | `DataPulse` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/datapulse` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |
| `FIREBASE_CREDENTIAL_PATH` | Path to Firebase service account JSON | `app/firebase-service-account.json` |
| `UPLOAD_DIRECTORY` | Local storage directory for uploads | `uploads` |
| `MAX_UPLOAD_SIZE_MB` | Maximum allowed file upload size | `50` |

### Frontend (`frontend/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | *(Optional)* Firebase Storage Bucket |
| `VITE_API_BASE_URL` | *(Optional)* API base URL (defaults to Vite proxy `/api`) |

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/auth/me` | Fetch authenticated user profile |
| `GET` | `/dashboards/default` | Get default user dashboard |
| `POST` | `/datasets/upload` | Upload new dataset (CSV, XLSX) |
| `GET` | `/datasets/my` | List all datasets for the user |
| `GET` | `/datasets/{id}/preview` | Get dataset preview & column types |
| `GET` | `/datasets/{id}/data` | Fetch paginated raw data rows |
| `GET` | `/datasets/{id}/quality` | Get missing values, duplicates & health score |
| `GET` | `/charts/dataset/{id}` | Get automated chart recommendations |
| `POST` | `/charts/generate` | Generate custom visual from dataset |

---

## 🔒 Security & Git Notice

- **Secrets & Keys**: Never commit your `backend/.env`, `frontend/.env`, or `firebase-service-account.json` to source control.
- If `firebase-service-account.json` was previously tracked, untrack it using:
  ```bash
  git rm --cached backend/app/firebase-service-account.json
  git commit -m "Untrack Firebase credentials"
  ```
- All environment files and sensitive credentials are automatically protected by the root [`.gitignore`](.gitignore).

---

## 📄 License
This project is licensed under the MIT License.
