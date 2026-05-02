#  NG-VMS | Next Generation Visitor Management System

[![Framework: Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![UI: visionOS Style](https://img.shields.io/badge/UI-visionOS--Style-0071e3?style=flat-square)](https://developer.apple.com/visionos/)

A high-performance, production-ready Visitor Management System (NG-VMS) featuring a premium **Apple visionOS-inspired Liquid Glass UI**. Built for security, speed, and seamless user interaction.

---

## ✨ Features

- **Liquid Glass UI**: High-blur spatial depth, spectral edge lighting, and smooth Framer Motion transitions.
- **Smart Registration**: Multi-step flow with identity verification for returning visitors.
- **Biometric Capture**: Face and ID Document capture with client-side canvas compression.
- **Digital Identity Pass**: Real-time polling passes with QR-based gate authentication.
- **RBAC Security**: Role-based access control for **Admins**, **Security Guards**, and **Employees**.
- **Live Dashboard**: Real-time visitor tracking and activity trends using Recharts.
- **Audit Logs**: Full system transparency with automated event logging.

---

## 🏗️ System Architecture

Refer to the [System Architecture Documentation](./docs/ARCHITECTURE.md) for a deep dive into the tech stack and data flow.

- **Frontend**: Next.js (App Router), Framer Motion, Recharts, Lucide.
- **Backend**: Node.js, Express, JWT, MongoDB Atlas.
- **Integration**: RESTful API with Secure Bearer Token Auth.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas Account (or local MongoDB)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repo-url>
   cd VMS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env with MONGODB_URI and JWT_SECRET
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../my-app
   npm install
   # Create .env.local with NEXT_PUBLIC_API_BASE
   npm run dev
   ```

---

## 🛡️ SRE & Reliability

Designed for 99.9% availability.
- **Health Checks**: Instrumented endpoint at `/api/health`.
- **Database Scaling**: Optimized MongoDB queries with secondary indexing.
- **Observability**: Centralized audit logging for every sensitive system action.
- See the [SRE & Documentation](./docs/SRE.md) for more.

---

## 👨‍💻 Contributing

Built with ❤️ by Antigravity.
