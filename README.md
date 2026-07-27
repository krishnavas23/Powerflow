<div align="center">

# ⚡ POWERFLOW
### *UPI for Power – A Peer-to-Peer Renewable Energy Trading Platform*

![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![Python](https://img.shields.io/badge/ML-Python-3776AB)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF)

A full-stack renewable energy marketplace that enables users to securely buy and sell surplus solar energy using AI-powered forecasting, digital wallets, and secure online payments.

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
- Project Documentation
- Installation
- Environment Variables
- Running the Project
- Project Structure
- Future Improvements
- Contributors
- License

---

# 🌍 Overview

POWERFLOW is a decentralized peer-to-peer renewable energy trading platform that allows solar energy producers to sell excess electricity directly to consumers without depending entirely on traditional electricity providers.

The platform combines modern web technologies with Machine Learning and IoT concepts to provide secure, intelligent, and transparent energy trading.

---

# ❗ Problem Statement

Traditional electricity grids are highly centralized, making it difficult for individual solar producers to monetize surplus energy efficiently.

POWERFLOW solves this problem by providing:

- ⚡ Direct Producer-to-Consumer Energy Trading
- 🤖 AI-based Energy Forecasting
- 📧 Email Notifications & Automated PDF Receipts – Automatic transaction confirmations with downloadable PDF receipts.
- 💳 Secure Digital Wallets
- 🔒 KYC Verification
- 📈 Admin Analytics Dashboard

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
- PDF Bill Generation
- Email Notifications
- Stripe Wallet Recharge

---

## 🛠 Admin Features

- Admin Dashboard
- User Management
- KYC Verification
- Transaction Monitoring
- Analytics Dashboard
- Platform Configuration
- Pricing Management

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

---

## Machine Learning

- Python
- Django
- Scikit-Learn
- XGBoost
- OpenWeather API

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
```
https://www.youtube.com/watch?v=pTH78iPjIZI
```

# 🚀 Installation

## Prerequisites

- Node.js 18+
- pnpm
- Python 3.10+
- MongoDB Atlas (or local MongoDB)

---

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/POWERFLOW.git
cd POWERFLOW
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

# 🔑 Environment Variables

Create a `.env` file inside the backend.

Example:

```env
PORT=
MONGO_URI=

JWT_SECRET=

ADMIN_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

EMAIL_USER=
EMAIL_PASS=

FRONTEND_URL=
```

Create `.env` for both frontends.

```env
VITE_BACKEND_BASE_URL=
REACT_STRIPE_PUBLISHABLE_KEY=
```

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
POWERFLOW
│
├── powerflow-backend/
│
├── powerflow-frontend/
│
├── admin-frontend/
│
├── energy1/
│
│
├── docs/
│
└── README.md
```

---

# ⚠ Important Notes

- Configure all environment variables before running.
- Use your own MongoDB Atlas database.
- Use Stripe Test Keys during development.
- Add your own Gmail App Password for email services.
- Obtain an OpenWeather API Key for AI predictions.
- Ensure all five services are running simultaneously.

---

# 🚀 Future Improvements

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
