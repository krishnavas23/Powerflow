# POWERFLOW

### UPI for Power

**Peer-to-peer renewable energy trading** â€” connect solar producers with homes, companies, NGOs, and hospitals through a digital marketplace for electricity.

[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20Django%20%7C%20MongoDB-0a0e1a.svg)](#tech-stack)
[![Status](https://img.shields.io/badge/status-hackathon%20ready-success.svg)](#getting-started)

---

## About

POWERFLOW is a full-stack P2P energy trading platform. Producers (rooftop solar owners and micro-generators) list surplus kilowatt-hours; buyers purchase or receive donated energy; wallets settle in INR and energy credits; and an AI service forecasts consumption and recommends trades.

Think of it as **UPI for power** â€” simple transfers, transparent pricing, and a live pool of available energy.

| Audience | What they do |
| --- | --- |
| **Producers** | Upload surplus energy, set price, get paid |
| **Buyers** | Browse listings, buy kWh, top up wallet |
| **Admins** | Verify users, monitor trades, tune platform config |
| **NGOs / hospitals** | Receive donated energy credits |

---

## Screenshots

### User dashboard
![POWERFLOW dashboard](docs/screenshots/dashboard.png)

### Buy energy marketplace
![Buy energy marketplace](docs/screenshots/buy-energy.png)

### Admin console
![Admin dashboard](docs/screenshots/admin-dashboard.png)

---

## Features

- **Energy marketplace** â€” list, browse, and buy surplus renewable energy
- **Dual wallet** â€” INR balance + energy credits with Stripe top-ups
- **AI forecast & recommend** â€” Django/ML service for consumption and trade suggestions
- **Donate energy** â€” route credits to causes and institutions
- **KYC / profile verification** â€” unlock higher limits
- **Admin panel** â€” users, verifications, transactions, reports, platform config
- **Monorepo layout** â€” frontend, admin, API, and AI services in one repo

---

## Repository structure

```
Powerflow/
â”œâ”€â”€ powerflow-frontend/   # User web app (React + Vite)        â†’ :8080
â”œâ”€â”€ admin-frontend/       # Admin console (React + Vite)       â†’ :8081
â”œâ”€â”€ powerflow-backend/    # REST API (Express + MongoDB)       â†’ :4000
â”œâ”€â”€ energy1/              # AI / forecast service (Django)     â†’ :8000
â””â”€â”€ docs/screenshots/     # README images
```

---

## Tech stack

| Layer | Tech |
| --- | --- |
| User & admin UI | React, Vite, TypeScript, Tailwind CSS |
| API | Node.js, Express, JWT, Stripe |
| Database | MongoDB (Mongoose) |
| AI / ML | Django REST, scikit-learn, XGBoost, pandas |
| Payments | Stripe |

---

## Prerequisites

Install these before running locally:

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **MongoDB** running locally (or a MongoDB Atlas URI)
- **Git**

Optional: a Stripe test key pair and an OpenWeatherMap API key for live weather-aware forecasts.

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/krishnavas23/Powerflow.git
cd Powerflow
```

### 2. Backend API (`powerflow-backend`)

```bash
cd powerflow-backend
cp .env.example .env
# Edit .env â€” set MONGO_URI, JWT_SECRET, ADMIN_KEY, Stripe keys if needed
npm install
npm run dev
```

API listens on **http://localhost:4000**.

### 3. AI service (`energy1`)

```bash
cd energy1
cp .env.example .env
# Edit .env â€” set DJANGO_SECRET_KEY (and OPENWEATHER_API_KEY if you have one)
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

AI service listens on **http://127.0.0.1:8000**.

### 4. User frontend (`powerflow-frontend`)

```bash
cd powerflow-frontend
cp .env.example .env
# Defaults point at local backend (:4000) and AI (:8000)
npm install
npm run dev
```

Open **http://localhost:8080**.

### 5. Admin frontend (`admin-frontend`)

```bash
cd admin-frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:8081**.

---

## Environment variables

Copy each `.env.example` to `.env`. Secrets stay local â€” they are gitignored.

### `powerflow-backend/.env`

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Auth token signing secret |
| `ADMIN_KEY` | Key required for admin registration |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `FRONTEND_URL` | CORS / redirects (default `http://localhost:8080`) |

### `powerflow-frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_BASE_URL` | API base URL |
| `VITE_AI_BASE_URL` | Django AI service URL |
| `VITE_ADMIN_URL` | Admin app URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### `admin-frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_BASE_URL` | API base URL |

### `energy1/.env`

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret |
| `DEBUG` / `ALLOWED_HOSTS` | Dev settings |
| `OPENWEATHER_API_KEY` | Optional weather data |

---

## Quick start checklist

1. Start **MongoDB**
2. Start **backend** on `:4000`
3. Start **energy1** on `:8000`
4. Start **user frontend** on `:8080`
5. Start **admin frontend** on `:8081` (optional)

```text
MongoDB  â†’  Backend :4000  â†’  Frontend :8080
                â†‘
           energy1 :8000
                â†‘
           Admin :8081
```

---

## Typical user flows

1. **Register / log in** on the user app  
2. **Verify profile** (KYC) for higher limits  
3. **Add funds** to the INR wallet (Stripe)  
4. **Buy energy** from marketplace listings â€” or **upload** surplus as a producer  
5. Check **AI forecast** for consumption / recommendations  
6. **Donate** energy credits to supported causes  

Admins use the admin console to verify accounts, review transactions, and adjust platform settings.

---

## Scripts reference

| Package | Dev | Production |
| --- | --- | --- |
| `powerflow-backend` | `npm run dev` | `npm start` |
| `powerflow-frontend` | `npm run dev` | `npm run build` â†’ `npm start` |
| `admin-frontend` | `npm run dev` | `npm run build` â†’ `npm start` |
| `energy1` | `python manage.py runserver 8000` | Use a WSGI/ASGI server (e.g. gunicorn) |

---

## Contributing

Issues and pull requests are welcome. For substantial changes, open an issue first so we can align on scope.

1. Fork the repo  
2. Create a feature branch (`git checkout -b feature/your-idea`)  
3. Commit and push  
4. Open a pull request  

---

<p align="center">
  <strong>POWERFLOW</strong> Â· UPI for Power<br/>
  Built for peer-to-peer renewable energy trading
</p>

