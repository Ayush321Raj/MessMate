# 🌿 MessMate — AI-Powered Hostel Mess Management System

A full-stack MERN application with a Python/FastAPI AI forecasting microservice for digitizing hostel/college mess operations: meal subscriptions, QR/RFID entry, inventory, billing, and analytics.

---

## 📁 Project Structure

```
MessMate-AI/
├── client/          # React (Vite) frontend
├── server/          # Node.js / Express backend
├── ai-service/      # Python FastAPI forecasting microservice
└── package.json     # Root scripts
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Python | ≥ 3.10 |
| pip | ≥ 23.x |
| MongoDB Atlas | Free tier |

---

### 1. Clone & Install

```bash
git clone https://github.com/your-org/messmate-ai.git
cd MessMate-AI

# Install Node dependencies for both server and client
npm run install:all
```

---

### 2. Configure Environment Variables

#### Server (`server/.env`)

```bash
cp server/.env.example server/.env
```

Fill in:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/messmate
JWT_SECRET=supersecret_change_this
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=MessMate <no-reply@messmate.app>

AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173

# Optional student assistant provider; omit the key to use grounded fallback replies
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
# OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

> 💡 For Gmail, create an [App Password](https://myaccount.google.com/apppasswords) (not your regular password).

#### AI Service (`ai-service/.env`)

```bash
cp ai-service/.env.example ai-service/.env
# PORT=8000 (default)
```

---

### 3. Python AI Service Setup

```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

### 4. Seed the Database

```bash
npm run seed
```

This creates:
- 1 Admin, 1 Kitchen Staff, 10 Students (all with preset passwords)
- 37 days of meals (29 past + 7 future)
- ~700 opt-in records and ~600 attendance records
- 10 inventory items
- Feedback for the last 10 days

**Demo login credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@messmate.app | Admin@123 |
| Kitchen | kitchen@messmate.app | Kitchen@123 |
| Student | arjun@student.edu | Student@123 |

---

### 5. Run All Three Services

Open **3 terminal windows**:

**Terminal 1 — Node backend:**
```bash
npm run dev:server
# Server: http://localhost:5000
```

**Terminal 2 — React frontend:**
```bash
npm run dev:client
# App: http://localhost:5173
```

**Terminal 3 — FastAPI AI microservice:**
```bash
npm run dev:ai
# AI API: http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

---

## 🏗️ Architecture

```
Browser (React/Vite)
        │
        │ HTTP/WebSocket
        ▼
Node/Express API (:5000)
        │              │
        │ Mongoose      │ HTTP (axios)
        ▼              ▼
MongoDB Atlas    FastAPI AI Service (:8000)
                       │
                  Ridge Regression
                  (scikit-learn)
```

**Real-time:** Socket.io pushes live headcount updates to kitchen/admin dashboards and successful scan billing entries to the signed-in student's billing screen.

---

## 🔑 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | 🔒 | Get current user |
| PUT | `/api/auth/profile` | 🔒 | Update profile |
| PUT | `/api/auth/change-password` | 🔒 | Change password |

### Meals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/meals` | 🔒 | List meals (filter by date/type) |
| GET | `/api/meals/:id` | 🔒 | Single meal |
| POST | `/api/meals` | Admin | Create meal |
| PUT | `/api/meals/:id` | Admin | Update meal |
| DELETE | `/api/meals/:id` | Admin | Delete meal |
| POST | `/api/meals/:id/optin` | Student | Opt in (generates QR) |
| POST | `/api/meals/:id/optout` | Student | Opt out |

### Passes & Scanning
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/passes/generate` | Student | Regenerate QR pass |
| POST | `/api/passes/validate` | Kitchen/Admin | Validate QR or RFID |
| GET | `/api/passes/my` | Student | List my active passes |

### Inventory
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/inventory` | Admin/Kitchen | List all items |
| GET | `/api/inventory/low-stock` | Admin/Kitchen | Items below threshold |
| POST | `/api/inventory` | Admin | Create item |
| PUT | `/api/inventory/:id` | Admin | Update item |
| DELETE | `/api/inventory/:id` | Admin | Delete item |
| POST | `/api/inventory/:id/restock` | Admin | Add stock quantity |

### Billing
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/billing/:studentId` | Student/Admin | Get bills |
| GET | `/api/billing/ledger/:studentId` | Student owner/Admin | Get itemized running month ledger |
| POST | `/api/billing/generate` | Admin | Generate monthly bills |
| GET | `/api/billing/:studentId/download` | Student/Admin | Download PDF/Excel |
| PUT | `/api/billing/:billId/mark-paid` | Admin | Mark bill as paid |

### Feedback
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/feedback` | Student | Submit feedback |
| GET | `/api/feedback/meal/:mealId` | Admin/Kitchen | Meal feedback aggregate |
| GET | `/api/feedback/my` | Student | My feedback history |
| GET | `/api/feedback/summary` | Admin | Top/bottom dishes |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/overview` | Admin | Dashboard summary cards |
| GET | `/api/analytics/attendance` | Admin/Kitchen | Daily attendance trend |
| GET | `/api/analytics/caterer` | Admin/Kitchen | Upcoming meal demand and dish-quality recommendations |
| GET | `/api/analytics/wastage` | Admin | Food waste % |
| GET | `/api/analytics/cost-per-meal` | Admin | Cost per meal |
| GET | `/api/analytics/reports/attendance` | Admin | Download Excel report |

### Waste, Assistant, And Announcements
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/waste` | Admin/Kitchen | List recent categorized waste records |
| POST | `/api/waste` | Admin/Kitchen | Record measured waste and segregation |
| POST | `/api/assistant/chat` | Student | Ask about today's menu or personal billing |
| GET | `/api/announcements` | Authenticated | List published announcements |
| POST | `/api/announcements` | Admin | Publish an announcement |

### Forecast
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/forecast/:mealId` | Admin/Kitchen | Get AI forecast for a meal |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List users (filter/search) |
| PUT | `/api/admin/users/:id` | Admin | Update user |
| DELETE | `/api/admin/users/:id` | Admin | Deactivate user |

---

## 🤖 AI Forecasting Service

**Endpoint:** `POST /forecast`

**How it works:**
1. Node backend collects the last 30 days of historical opt-in + attendance data for the same meal type
2. Sends it to the FastAPI microservice along with current opt-ins and special day flag
3. FastAPI trains a Ridge Regression model on the fly using engineered features:
   - Current opt-in count
   - Day of week (one-hot)
   - Meal type (one-hot)
   - Rolling 7-day mean & std of attendance
   - Historical attendance rate
   - Special day flag
4. Falls back to a weighted heuristic when < 5 data points are available
5. Returns `forecasted_headcount`, `confidence` (0–1), and `model_used`

**Demo endpoint:** `GET /forecast/demo` — runs a forecast on pre-loaded mock data (no DB needed).

### Student Assistant

The student assistant uses the authenticated student's published menu and own attendance-derived billing data as context. Set `OPENAI_API_KEY` on the server to enable natural-language responses through the configured chat-completions provider. Without a key, the assistant still answers supported menu and running-bill questions using deterministic responses. The model must not be treated as the source of prices or attendance facts.

---

## 📱 User Roles & Views

### 🎓 Student (mobile-first)
- **Home** — greeting, today's meal status, opt-in count
- **Menu** — 7-day weekly view, opt in/out per meal before cutoff
- **Passes** — QR code view (tap to expand), used/active status
- **Billing** — monthly bill, PDF/Excel download
- **Feedback** — per-dish star ratings, comments

### 🍳 Kitchen Staff
- **Dashboard** — today's meals, live headcount, AI forecast, "served/forecast/remaining"
- **Scanner** — webcam QR scanner (html5-qrcode), RFID manual input, clear PASS/FAIL/DUPLICATE states
- **Stock** — read-only inventory with progress bars, low-stock highlights

### 🔧 Admin
- **Dashboard** — summary cards, quick action links
- **Meals** — create/delete meals, view headcounts
- **Inventory** — CRUD, restock modal, low-stock banner
- **Users** — search/filter, edit roles/RFID/room, activate/deactivate
- **Billing** — generate monthly bills, view per-student, mark paid, download
- **Analytics** — attendance trend (line chart), forecast vs actual (bar), waste pie, top dishes (horizontal bar)

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /dist to Vercel (set VITE_API_URL env var to your Render backend URL)
```

### Backend → Render (Node)
- Point Render to `server/` directory
- Set all `.env` variables as Render environment variables
- Start command: `node src/index.js`

### AI Service → Render (Python)
- Point Render to `ai-service/` directory
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Database → MongoDB Atlas
- Create a free M0 cluster
- Add your Render IP range to the allowlist (or use `0.0.0.0/0` for dev)
- Paste the connection string into `MONGO_URI`

---

## 🛡️ Security Notes

- All secrets are in `.env` files — **never commit them**
- JWTs expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- Passwords hashed with bcrypt (12 rounds)
- Role-based protection on every API route and React route
- QR tokens are single-use: once scanned, `qrTokenUsed = true` prevents replay
- Input validated with express-validator on all endpoints

---

## 📦 Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, Redux Toolkit, Recharts |
| Backend | Node.js, Express.js, JWT + bcrypt, Socket.io |
| Database | MongoDB + Mongoose (Atlas) |
| AI Service | Python, FastAPI, scikit-learn (Ridge Regression), Pandas |
| QR | qrcode (npm), html5-qrcode |
| Email | Nodemailer |
| Reports | pdfkit, exceljs |
| Real-time | Socket.io |
| Deployment | Vercel + Render + MongoDB Atlas |

---

## 📄 License

MIT — free for academic and personal use.
