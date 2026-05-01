# SRE & Reliability Documentation | VMS

## 📈 Service Level Objectives (SLOs)
- **Availability**: 99.9% (Measured by successful status codes on `/api/health`).
- **Latency**: < 200ms for p95 of all auth and registration requests.
- **Data Integrity**: Zero-loss of visitor audit logs.

## 🛡️ Observability
- **Audit Logging**: Every sensitive action (Status Update, Approval, Blacklisting) is logged in the `logs` collection with:
  - `timestamp`
  - `event` (e.g., "GATE_IN_SUCCESS")
  - `actor` (The User ID who performed the action)
  - `subject` (The Visitor ID)
- **Health Endpoint**: The backend serves a `/api/health` heartbeat.

## 🚀 Scalability & Performance
- **Stateless Backend**: The Node.js server is completely stateless, allowing horizontal scaling behind a Load Balancer (Nginx/Vercel).
- **Database Optimization**:
  - Indexed `visitor_code` for O(1) pass lookups.
  - Periodic archival strategies for old logs (recommended for high-traffic sites).
- **Frontend Performance**:
  - Image assets are lazy-loaded.
  - Bundle size minimized via Next.js tree-shaking.
  - SVGs used for all noise textures and logos to maintain crispness at zero bandwidth cost.

## 🔧 Disaster Recovery
- **MongoDB Atlas**: Automatic cross-region backups and point-in-time recovery enabled.
- **Failover**: Environment variables are managed centrally via Vercel/Docker Secrets to allow rapid redeployment to new regions.

## 🛠️ Operational Tasks
- **Staff Updates**: Automated CSV/Excel processing in `AdminPanel` prevents manual entry errors.
- **Environment Rotations**: `JWT_SECRET` and `MONGODB_URI` should be rotated quarterly.
