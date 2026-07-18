<div align="center">

# ⚡ POWERFLOW
### *UPI for Power – A Peer-to-Peer Renewable Energy Trading Platform*

![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![Python](https://img.shields.io/badge/ML-Python-3776AB)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF)

A full-stack renewable energy marketplace that enables users to securely buy and sell surplus solar energy using AI-powered forecasting, smart meter validation, digital wallets, and secure online payments.

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
- 📊 Smart Meter Validation
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
- Smart Meter Dashboard
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

## Smart Meter Service

- Django REST Framework

---

# 🏗 System Architecture

> Replace the image below with your architecture diagram.

<p align="center">

<img src="screenshots/architecture.png" width="900"/>

</p>

---

# 📸 Project Preview

## Home Page

<img src="screenshots/home.png"/>

---

## Marketplace

<img src="screenshots/marketplace.png"/>

---

## Wallet

<img src="screenshots/wallet.png"/>

---

## Forecast Dashboard

<img src="screenshots/forecast.png"/>

---

## Smart Meter

<img src="screenshots/meter.png"/>

---

## Admin Dashboard

<img src="screenshots/admin-dashboard.png"/>

---

## KYC Verification

<img src="screenshots/kyc.png"/>

---

# 🎥 Demo Video

Watch the complete walkthrough of POWERFLOW here:

👉 **YouTube Demo**

```
https://www.youtube.com/watch?v=pTH78iPjIZI
```

---

# 📄 Project Documentation

Complete project report explaining:

- Motivation
- Objectives
- Research
- Working
- Architecture
- Modules
- APIs
- Database Design
- Future Scope

📄 **PDF**

```
docs/POWERFLOW_Project_Report.pdf
```

or

```
https://drive.google.com/.....
```

---

# 🚀 Installation

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

Runs on

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

Runs on

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

Runs on

```
http://localhost:5173
```

---

## 5. Machine Learning Service

```bash
cd energy1

python -m venv venv

pip install -r requirements.txt

python manage.py runserver 8000
```

Runs on

```
http://localhost:8000
```

---

## 6. Smart Meter Service

```bash
cd meterr

python -m venv venv

pip install -r requirements.txt

python manage.py runserver 8001
```

Runs on

```
http://localhost:8001
```

---

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
3. Smart Meter Service
4. ML Service
5. User Frontend
6. Admin Frontend

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
├── meterr/
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

# 👨‍💻 Contributors

**Krishna Vashisht**

Feel free to contribute by opening Issues or Pull Requests.

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps others discover the project!

---

<div align="center">

### ⚡ POWERFLOW
### *Empowering Renewable Energy Trading Through Technology.*

</div>
