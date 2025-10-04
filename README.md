<div align="center">

# 💼 SmartExpense
### Automate Expense Approvals. Simplify Reimbursements.

AI-powered expense management with OCR receipt capture, intelligent parsing, multi-level approvals, rich analytics, and a modern UX for every role in your organization.

<p>
	<a href="#"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
	<a href="#tech-stack"><img alt="Stack" src="https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20MongoDB-green" /></a>
	<img alt="Version" src="https://img.shields.io/badge/version-0.1.0--alpha-orange" />
	<a href="#contributing"><img alt="Contributions" src="https://img.shields.io/badge/contributions-welcome-success" /></a>
</p>

<p>
	<a href="#demo"><strong>🚀 View Demo</strong></a> ·
	<a href="#features">Features</a> ·
	<a href="#architecture">Architecture</a> ·
	<a href="#getting-started">Setup</a> ·
	<a href="#api-overview">API</a> ·
	<a href="#roadmap">Roadmap</a>
</p>

</div>

---

## 🎥 Demo <a id="demo"></a>

> Add your animated GIF or recording here.

![Demo Placeholder](./screenshots/demo.gif)

<div align="center">
	<a href="https://example.com" target="_blank"><img src="https://img.shields.io/badge/Live_Demo-Visit-indigo" alt="Live Demo" /></a>
</div>

---

## ✨ Features <a id="features"></a>

- 🤖 **AI / OCR Extraction** – Upload a receipt; the system parses amount, currency, date & merchant automatically.
- 🔄 **Multi-Level Approvals** – Manager → Finance → Director (configurable escalation coming soon).
- 💱 **Currency Awareness** – Normalize spend with company base currency (FX API ready).
- 👥 **Role-Based Dashboards** – Focused views for Employees, Managers, and Admins.
- 📊 **Analytics & Insights** – Category totals, velocity metrics, approval time averages & leaderboards.
- 🔔 **Smart Notifications** – Real-time surface of new submissions & status changes (UI layer now; websockets planned).
- 🗂 **Structured Storage** – Receipts stored per-user for audit traceability.
- 🛡 **Secure Auth** – JWT-based, role gated endpoints, company scoping.
- 🌙 **Modern UI/UX** – TailwindCSS + subtle animations (Framer Motion ready) + dark mode.
- 🧪 **Resilient Parsing** – Fallback heuristics & filename inference when OCR fails.

---

## 🧱 Tech Stack <a id="tech-stack"></a>

| Frontend | Backend | Database | Integrations / APIs | Tooling & Utilities |
|----------|---------|----------|---------------------|---------------------|
| React (Vite), TailwindCSS, Framer Motion | Node.js, Express | MongoDB (Mongoose) | OCR.space (optional), Exchange Rates (planned), Gemini (experimental) | JWT Auth, Multer, axios, jsPDF, Tesseract (alt path) |

---

## 🏗 Architecture Overview <a id="architecture"></a>

<img width="642" height="486" alt="_- visual selection" src="https://github.com/user-attachments/assets/5a6eb163-afac-434b-b30c-f708f9ebf13a" />


Approval Flow (current baseline):
```
Employee → Manager (approve/reject)
				↳ (future) Finance → Director escalation layers
```

---

## 📂 Repository Structure

```
backend/
	controllers/        # Business logic (expenses, auth, analytics)
	models/             # Mongoose schemas
	routes/             # API route definitions
	middleware/         # Auth / role guards
	uploads/            # Stored receipt assets (per-user dirs)
frontend/
	src/components/     # Reusable UI & context
	src/pages/          # Role dashboards, landing, auth
	src/api.js          # Axios instance
```

---

## ⚙️ Getting Started <a id="getting-started"></a>

### 1. Clone & Install

```bash
git clone https://github.com/your-org/smartexpense.git
cd smartexpense
cd backend && npm install && cd ../frontend && npm install
```

### 2. Environment Variables

Create a `backend/.env` file:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret

# Local uploads configuration
UPLOAD_DIR=uploads

# OCR.space configuration (optional)
OCR_API_URL=https://api.ocr.space/parse/image
OCR_API_KEY=your_ocr_space_api_key
OCR_LANGUAGE=eng

# Gemini (experimental)
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash
OCR_DEBUG=false
```

### 3. Run Dev Servers (concurrently suggestion)

```bash
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev
```

Backend default: `http://localhost:5000` (adjust if defined).  
Frontend default: `http://localhost:5173` (Vite).

### 4. Seed / Create Users
Register via signup endpoint/UI. Elevate roles manually in MongoDB (set `role` to `manager` or `admin` and optionally assign `manager` field for employees).

---

## 🧪 Receipt Processing & OCR

1. Client uploads via `POST /api/expenses/receipt` (field: `file`).
2. Backend stores file: `/uploads/<userId>/<timestamp>.<ext>`.
3. If OCR configured, text extracted → heuristic parsing → structured object.
4. Response: `{ receiptUrl, ocrText, ocrData }` where `ocrData` may include:
	 - `amount` (Number)
	 - `currency` (ISO 3)
	 - `date` (ISO string)
	 - `merchant` (String)
5. User reviews / edits then submits final expense via `POST /api/expenses`.

Fallback Heuristics (if OCR fails): filename pattern mining for amount, date & currency keywords.

---

## 🔐 Roles & Permissions

| Role      | Capabilities |
|-----------|--------------|
| Employee  | Submit & view own expenses |
| Manager   | Approve/reject direct reports, view scoped analytics |
| Admin     | Global visibility, company-wide analytics, (future) manage assignments |

Manager scoping enforces: only employees whose `manager` field equals the manager's user id (plus manager's own expenses) are visible.

---

## 📡 API Overview <a id="api-overview"></a>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Register user | Public |
| POST | /api/auth/login | Login / JWT issue | Public |
| POST | /api/expenses/receipt | Upload receipt & OCR | Employee+ |
| POST | /api/expenses | Create expense | Employee+ |
| GET  | /api/expenses/mine | My expenses | Employee+ |
| GET  | /api/expenses/team | Manager team (scoped) | Manager/Admin |
| GET  | /api/expenses/team/summary | Aggregated scoped metrics | Manager/Admin |
| PUT  | /api/expenses/:id/status | Approve / Reject | Manager/Admin |
| GET  | /api/expenses/all | All expenses | Admin |
| GET  | /api/expenses/all/summary | Global analytics | Admin |

> Full request/response examples can be added to a dedicated `/docs` folder (future enhancement).

---

## 🧮 Analytics Implemented

- Category aggregation
- Monthly trend (rolling 12 months)
- Top employees by spend (scoped)
- Pending count
- Approval SLA (avg hours)
- Velocity (current 7d vs previous 7d)

Planned: anomaly detection, per-category budgets, burn alerts.

---

## 🛤 Roadmap <a id="roadmap"></a>

- [ ] Configurable multi-stage approval chains
- [ ] Real-time WebSocket notifications
- [ ] Budget policies & threshold alerts
- [ ] Bulk CSV import
- [ ] Mobile-friendly PWA enhancements
- [ ] i18n & multi-currency normalization
- [ ] Admin UI for manager assignment
- [ ] Automated test suite & CI badges
- [ ] AI categorization (LLM powered)

---

## 🤝 Contributing <a id="contributing"></a>

Contributions, issues & feature requests are welcome!  
Feel free to open an issue or submit a PR following conventional commits.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m "feat: add amazing thing"`
4. Push branch & open PR

---

## 📜 License

MIT © 2025 — SmartExpense Project Maintainers

---

## 🙏 Acknowledgements

- OCR.space for optional OCR API
- Open source libraries: React, Express, Mongoose, TailwindCSS
- Hackathon community & reviewers

---

## 🐛 Support / Questions

Create an issue or reach out via Discussions tab. For security concerns, please disclose privately first.

---

> This README is optimized for hackathon judging & open-source presentation. Tailor deployment and security hardening notes before production.

