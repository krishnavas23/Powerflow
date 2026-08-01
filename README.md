<div align="center">

# ⚡ POWERFLOW
### *UPI for Power – A Peer-to-Peer Renewable Energy Trading Platform*

![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![Python](https://img.shields.io/badge/ML-Python-3776AB)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF)
![Power BI](https://img.shields.io/badge/Analytics-Power%20BI-F2C811)

A full-stack renewable energy marketplace that enables users to securely buy and sell surplus solar energy using AI-powered forecasting, digital wallets, secure online payments, and BI-ready admin analytics.

</div>

---

# 📖 Table of Contents

- Overview
- Problem Statement
- Features
- Tech Stack
- System Architecture
- Project Preview
- Demo Video
- PPT
- Installation
- Environment Variables
- Power BI Integration
- Running the Project
- Project Structure
- Future Improvements
- Support
- License

---

# 🌍 Overview

POWERFLOW is a decentralized peer-to-peer renewable energy trading platform that allows solar energy producers to sell excess electricity directly to consumers without depending entirely on traditional electricity providers.

The platform combines modern web technologies with Machine Learning and IoT concepts to provide secure, intelligent, and transparent energy trading — plus admin dashboards, exploratory KPI reporting, and Microsoft Power BI–ready datasets for advanced analytics.

---

# ❗ Problem Statement

Traditional electricity grids are highly centralized, making it difficult for individual solar producers to monetize surplus energy efficiently.

POWERFLOW solves this problem by providing:

- ⚡ Direct Producer-to-Consumer Energy Trading
- 🤖 AI-based Energy Forecasting
- 📧 Email Notifications & Automated PDF Receipts – Automatic transaction confirmations with downloadable PDF receipts
- 💳 Secure Digital Wallets
- 🔒 KYC Verification
- 📈 Admin Analytics Dashboard (Recharts)
- 📊 EDA & KPI Reporting with actionable insights
- 🧩 Microsoft Power BI integration via BI-ready REST/CSV APIs

---

# ✨ Features

## 👤 User Features

- User Authentication (JWT)
- Buyer & Producer Roles
- Digital INR Wallet
- Energy Credit System
- Buy & Sell Renewable Energy
- Energy Donation
- AI Energy Forecasting
- PDF Bill / Receipt Generation
- Email Notifications
- Stripe Wallet Recharge
- Wallet transaction export (Excel-compatible CSV)

---

## 🛠 Admin Features

- Admin Dashboard (live KPI cards + revenue/energy charts)
- User Management
- KYC Verification (approve/reject with email notifications)
- Transaction Monitoring
- **EDA & KPI Reporting** – period-over-period KPIs, trend charts, verification/txn breakdowns, actionable insights, Excel/CSV export, and email report
- **Power BI Hub** – live KPI preview, dataset catalog, CSV downloads, and Power Query setup for Desktop
- Platform Configuration
- Pricing Management

---

## 📊 Analytics & Power BI

- In-app analytics with **Recharts** (Dashboard + EDA & KPI Reporting)
- BI-ready REST/CSV datasets under `/api/admin/powerbi/*`
- Service-key auth for Power BI Desktop / scheduled refresh (`X-PowerBI-Key`)
- Datasets include KPIs, transactions, daily/monthly revenue, energy by source, hourly activity, meter daily, and verification summary
- Optional embed of a published Power BI report via `VITE_POWERBI_EMBED_URL`

---

## 🤖 AI Module

- Solar Energy Production Prediction
- Consumption Prediction
- Buy/Sell Recommendations
- Weather-based Forecasting using OpenWeather API

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router
- Framer Motion
- Three.js
- Recharts

---

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Stripe API
- Nodemailer
- PDFKit
- Power BI–ready analytics APIs (REST + CSV)

---

## Analytics

- Recharts (in-app dashboards)
- Microsoft Power BI Desktop (external BI reports)
- MongoDB aggregations for live KPIs and insights

---

## Machine Learning

- Python
- Django
- Scikit-Learn
- XGBoost
- OpenWeather API

---

# 📝 PPT

https://docs.google.com/presentation/d/1aICHWAa9ubrZVwWngMhZ9iOu4mRIuJ-9/edit?usp=sharing&ouid=100162484174154761176&rtpof=true&sd=true

---

# 🏗 System Architecture

<p align="center">

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/b1e98fae-d48e-4780-89da-584ebe81d515" />

</p>

---

# 📸 Project Preview

## Login Page

<img width="1595" height="986" alt="image" src="https://github.com/user-attachments/assets/da32fef4-de21-47ac-9c15-23731d0ef56f" />

---

## Home Page

<img width="1131" height="877" alt="Screenshot 2026-07-18 164028" src="https://github.com/user-attachments/assets/9d2f639f-361f-47f9-aa17-bd21f4c74bab" />

---

## Add Funds

<img width="1567" height="752" alt="Screenshot 2026-07-18 164040" src="https://github.com/user-attachments/assets/efbded34-9958-4a32-918e-f440db5ce479" />

---

## Marketplace

<img width="1545" height="881" alt="Screenshot 2026-07-18 171350" src="https://github.com/user-attachments/assets/1f16f3ca-22d8-4c33-9ede-fe9f8cc48c81" />

---

## Wallet

<img width="1688" height="645" alt="Screenshot 2026-07-18 164103" src="https://github.com/user-attachments/assets/5df22f73-ac77-483c-b652-bd0e354f88a7" />

---

## Upload energy

<img width="1611" height="661" alt="Screenshot 2026-07-18 164125" src="https://github.com/user-attachments/assets/136c9c36-b1ce-47af-a5f7-6dbcadba9408" />

---

## Forecast Dashboard

<img width="927" height="896" alt="Screenshot 2026-07-18 164213" src="https://github.com/user-attachments/assets/a922a20c-1532-4e22-97ff-0dacfb809a3f" />

---

## Donate Energy

<img width="1642" height="741" alt="Screenshot 2026-07-18 164337" src="https://github.com/user-attachments/assets/1c4207ec-37e6-4442-80e7-d94b88ceb5d4" />

---

## Profile Section

<img width="1522" height="637" alt="Screenshot 2026-07-18 164400" src="https://github.com/user-attachments/assets/19a5719c-755c-4d07-8224-ccfc809770ca" />

---

## Help & Support Section

<img width="1390" height="591" alt="Screenshot 2026-07-18 164427" src="https://github.com/user-attachments/assets/0d6f89f0-f410-473a-a112-ce6ee7925b9c" />

---

## Admin Dashboard

<img width="1885" height="862" alt="Screenshot 2026-07-18 170245" src="https://github.com/user-attachments/assets/dc02fecf-46f0-4702-bd23-424c880fd22b" />

---

## Transaction Management

<img width="1895" height="887" alt="Screenshot 2026-07-18 170341" src="https://github.com/user-attachments/assets/72a92434-4125-4632-af38-a2980315c1d8" />

---

## KYC Verification

<img width="1901" height="870" alt="Screenshot 2026-07-18 170515" src="https://github.com/user-attachments/assets/d1797880-e643-47f9-a4c9-776fca5ba57a" />

---

# 🎥 Demo Video

Watch the complete walkthrough of POWERFLOW here:

👉 **YouTube Demo**  
https://www.youtube.com/watch?v=pTH78iPjIZI

---

# 🚀 Installation

## Prerequisites

- Node.js 18+
- pnpm
- Python 3.10+
- MongoDB Atlas (or local MongoDB)
- (Optional) Microsoft Power BI Desktop for external BI reports

---

## 1. Clone Repository

```bash
git clone https://github.com/krishnavas23/Powerflow.git
cd Powerflow
```

---

## 2. Backend

```bash
cd powerflow-backend

npm install

npm run dev
```

Runs on:

```
http://localhost:4000
```

---

## 3. User Frontend

```bash
cd powerflow-frontend

pnpm install

pnpm dev
```

Runs on:

```
http://localhost:8080
```

---

## 4. Admin Frontend

```bash
cd admin-frontend

pnpm install

pnpm dev
```

Runs on:

```
http://localhost:5173
```

---

## 5. AI Forecasting Service

```bash
cd energy1

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver 8000
```

Runs on:

```
http://localhost:8000
```

---

# 🔑 Environment Variables

Create a `.env` file inside `powerflow-backend`.

Example:

```env
PORT=4000
MONGO_URI=

JWT_SECRET=
JWT_EXPIRES_IN=7d
ADMIN_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

EMAIL_USER=
EMAIL_PASS=

FRONTEND_URL=http://localhost:8080

# Power BI Desktop / scheduled refresh (send as header: X-PowerBI-Key)
POWERBI_API_KEY=
```

Create `.env` for the admin frontend (`admin-frontend`):

```env
VITE_BACKEND_BASE_URL=http://localhost:4000

# Optional: embed a published Power BI Service report in Admin → Power BI
VITE_POWERBI_EMBED_URL=
```

Create `.env` for the user frontend (`powerflow-frontend`):

```env
VITE_BACKEND_BASE_URL=http://localhost:4000
REACT_STRIPE_PUBLISHABLE_KEY=
```

---

# 📊 Power BI Integration

POWERFLOW exposes BI-ready datasets so Microsoft Power BI Desktop can connect without rewriting backend analytics.

1. Start the backend with `POWERBI_API_KEY` set.
2. Open **Admin → Power BI** for:
   - Connection status + live KPI preview
   - Dataset URLs and CSV downloads
   - Sample Power Query / auth guidance
3. In Power BI Desktop, use **Get Data → Web** (or Power Query) against:

```
http://localhost:4000/api/admin/powerbi/kpis
```

Add HTTP header:

```
X-PowerBI-Key: <your POWERBI_API_KEY>
```

Other useful endpoints (same auth):

| Dataset | Endpoint |
|--------|----------|
| Catalog | `/api/admin/powerbi/` |
| KPIs | `/api/admin/powerbi/kpis` |
| Transactions | `/api/admin/powerbi/transactions` |
| Revenue (daily) | `/api/admin/powerbi/revenue-daily` |
| Revenue (monthly) | `/api/admin/powerbi/revenue-monthly` |
| Energy by source | `/api/admin/powerbi/energy-by-source` |
| Hourly activity | `/api/admin/powerbi/user-activity-hourly` |
| Meter daily | `/api/admin/powerbi/meter-daily` |
| Verification summary | `/api/admin/powerbi/verification-summary` |

Append `?format=csv` where supported for Excel / Power BI CSV import.

> **Note:** In-app Dashboard / EDA charts use **Recharts**. Power BI Desktop reports use **Microsoft Power BI visuals**. Both read live MongoDB aggregations from the backend.

---

# ▶ Running the Complete Project

Start services in the following order:

1. MongoDB
2. Backend
3. ML Service
4. User Frontend
5. Admin Frontend

---

# 📂 Project Structure

```
Powerflow
│
├── powerflow-backend/     # Express API, Stripe, KYC, analytics, Power BI datasets
├── powerflow-frontend/    # User marketplace, wallet, forecasting UI
├── admin-frontend/        # Admin dashboard, EDA/KPI, Power BI hub, KYC
├── energy1/               # Django + ML forecasting service
├── docs/                  # Extra documentation (if present)
└── README.md
```

---

# ⚠ Important Notes

- Configure all environment variables before running.
- Use your own MongoDB Atlas database.
- Use Stripe Test Keys during development.
- Add your own Gmail App Password for email services.
- Obtain an OpenWeather API Key for AI predictions.
- Set `POWERBI_API_KEY` before connecting Power BI Desktop.
- Never commit real `.env` files, API keys, or `.pbix` practice assets.
- Ensure all five services are running simultaneously for a full demo.
- “UPI for Power” is branding; wallet recharge uses **Stripe Checkout** (cards) in this codebase.
- Admin “Export Excel/CSV” downloads CSV (UTF-8 BOM) that Excel opens natively.

---

# 🚀 Future Improvements

- Publish Power BI reports to Power BI Service and embed via `VITE_POWERBI_EMBED_URL`
- Blockchain-based energy transactions
- Mobile Application
- Live IoT Smart Meter Integration
- Real-time Notifications
- Docker & Kubernetes Deployment
- CI/CD Pipeline
- Multi-language Support

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps others discover the project!

---

<div align="center">

### ⚡ POWERFLOW
### *Empowering Renewable Energy Trading Through Technology.*

</div>
