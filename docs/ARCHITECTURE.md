# System Architecture | NG-VMS

## 🛰️ Overview
The Next Generation Visitor Management System (NG-VMS) is designed as a decoupled full-stack application. It emphasizes high-fidelity UI performance and secure, role-based backend operations.

## 🎨 Frontend: Next.js (App Router)
The frontend utilizes **Next.js** for its robust routing and server-side optimization capabilities.

### Key Components:
- **Spatial UI Engine**: Located in `components/ClientWrapper.jsx`, this engine manages mouse-tracking variables (`--mouse-x`, `--mouse-y`) and page transitions using `Framer Motion`.
- **RBAC Guard**: The `ProtectedRoute` component intercepts navigation to sensitive routes (`/admin`, `/guard`, `/host`) and validates local storage tokens against required roles.
- **Data Visuals**: `Recharts` is used for the Admin Dashboard to provide real-time SVG-based activity analysis.
- **Image Processing**: `CameraCapture` uses a client-side `HTML5 Canvas` to downscale and compress images (max-width: 400px) before base64 encoding to keep MongoDB document sizes optimal.

---

## ⚡ Backend: Node.js / Express / MongoDB
The backend is a RESTful API built on **Express.js** and **TypeScript**.

### Layers:
1. **Routing Layer**: `api.ts` defines the contract for all visitor, auth, and gate operations.
2. **Middleware Layer**: `authMiddleware` validates JWTs and enforces role constraints (`ADMIN`, `GUARD`, `EMPLOYEE`).
3. **Controller Layer**: Business logic for registration, status updates, and staff directory management.
4. **Persistence Layer**: **MongoDB Atlas** serves as the primary datastore.
   - **Visitor Schema**: Tracks metadata, host relations, and audit history.
   - **Log Schema**: Captures every state change for security audits.

---

## 🔐 Security Model
- **Authentication**: JWT (JSON Web Tokens) with a 24h expiration.
- **Authorization**: Granular RBAC.
  - `ADMIN`: Full system control and staff directory management.
  - `GUARD`: Gate-level check-in/check-out and capacity tracking.
  - `EMPLOYEE`: Visitor approval and meeting status updates.
- **ID Verification**: Returning visitors are matched via `Name + Phone` hash, enabling one-click check-ins for repeat guests.

---

## 🔄 Data Flow (Visitor Registration)
1. **Visitor** enters details via `frontend/visitor`.
2. **Frontend** captures photo and ID via `react-webcam`, compresses on-the-fly.
3. **Backend** validates data, creates a `PENDING` visitor record, and returns a unique `visitor_code`.
4. **Employee** receives request on `frontend/host`, approves/denies.
5. **Visitor Pass** updates in real-time via polling.
6. **Security Guard** scans/verifies the `DigitalPass` at the gate.
