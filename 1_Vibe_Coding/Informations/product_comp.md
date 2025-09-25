# PRD — AI‑Driven Commercial Proposal Platform (infigital.net)
**Owner:** Fabio Hartmann Fernandes (Metamentes / In‑Digital World)  
**Version:** v1.0 (Initial Draft)  
**Date:** 2025-09-25  
**Status:** Draft for review

---

## 0) Context & Vision

Create a **secure, AI‑powered web platform** to build, import, edit, host, share and close **commercial proposals**.  
The platform integrates with third‑party design tools (e.g., Canva, Gamma) to **import the base graphic structure**, allows **interactive client review** in a private area, and **auto‑generates a contract for e‑signature**. After signature, it **notifies internal teams (email + WhatsApp/Telegram)** and **fires production**. Each proposal gets an **auto‑provisioned subdomain**: `proposal-<id>.infigital.net` on AWS.

**North Star Metric:** Proposal → Signed Contract conversion rate (and time‑to‑close).

---

## 1) Goals & Non‑Goals

### 1.1 Goals
- **G1. Import:** Pull a proposal’s base layout/content from **third‑party editors** (Canva, Gamma) into our platform, preserving **structure, texts, images** as faithfully as possible.
- **G2. Edit:** Allow **inline editing** (texts, images, links, video blocks), **AI assistance** for rewriting, summarization, tone adjustments, and **image generation/edition** via “nano banana” (image/video AI) integration.
- **G3. Share Privately:** Publish each proposal in a **private, password‑protected** space (password auto‑generated), with **commenting and change‑request** workflow.
- **G4. Close:** Generate a **contract** from final proposal content; enable **digital signature**; upon success, **notify** stakeholders and **trigger production**.
- **G5. Automate Subdomains:** Auto‑create **unique subdomains** per proposal under **infigital.net**.
- **G6. Analytics & Audit:** Track views, comments, time‑to‑close, version history, and maintain audit logs (LGPD compliant).

### 1.2 Non‑Goals (v1)
- Full DTP feature parity with Canva/Gamma.  
- Real‑time collaborative multi‑cursor editing (v1 supports sequential edits + comment threads; live co‑editing is a v2+ item).  
- In‑platform payment processing (optional stretch).

---

## 2) Target Users & Personas

- **Founder/AE (Internal):** Creates/imports proposals, edits content, publishes links, manages revisions, sends to client, closes deals.  
- **Client Reviewer (External):** Receives private link + password, **reviews**, **comments**, **requests changes**, **approves**.  
- **Legal/Operations (Internal):** Reviews final doc, **generates contract**, validates data, handles **signature** and **production kickoff**.  
- **Admin (Internal):** Manages users, templates, domains, roles, audit.

---

## 3) Key User Stories

1. **Import from Canva/Gamma**  
   - As an AE, I paste a **share/export link** and the system **fetches and reconstructs** the layout (texts, images, styles) as close as technically possible.  
   - Acceptance: ≥ 90% structural fidelity on supported blocks; unsupported elements downgraded gracefully with an alert.
2. **AI‑Augmented Editing**  
   - As an AE, I select a text block and ask AI to “make it more executive/shorter/Portuguese→English,” with change‑preview and one‑click apply.  
   - As an AE, I select an image block and request **variations/edits** via “nano banana” with prompts; result replaces or adds a new block.
3. **Private Publishing with Auth**  
   - As an AE, I publish to a **private URL** `https://proposal-123.infigital.net`, with an **auto‑generated password**, optional **expiry**, and **view tracking**.  
   - As a Client, I enter the password, **add comments**, **upload reference files**, and **request changes**.
4. **Contract Generation & e‑Signature**  
   - As Ops/Legal, I click **“Generate Contract”**; the system merges content into a **juridical template** (pt‑BR), outputs **PDF**, and sends for **e‑signature**.  
   - As an AE, when signed, I receive **email + WhatsApp/Telegram** notifications and a **production checklist** is opened automatically.
5. **Subdomain Automation**  
   - As an Admin, each new proposal gets a **unique subdomain** with a valid TLS cert and CDN config automatically.
6. **Auditability & LGPD**  
   - As Admin/Legal, I can export an **audit trail** including who viewed, what was edited, when, and by whom; **PII minimized** and access‑controlled.

---

## 4) Functional Requirements

### 4.1 Import Pipelines (Canva, Gamma)
- **Inputs:** Share/export link (prefer “export to HTML/JSON” when available).  
- **Strategies:**  
  1) **Official export APIs** (preferred) → HTML/JSON + media assets.  
  2) **Headless fetcher** (browser automation) for authenticated export jobs when APIs are limited; store result as normalized HTML/JSON.  
  3) **Fallback**: PDF import → structured OCR + layout inference (reduced fidelity).  
- **Constraints:** Respect TOS/licensing; store only necessary assets. Show **import summary** with unsupported blocks and manual fix prompts.

### 4.2 Proposal Editor
- **Block‑based editor** (Rich text, Image, Video, Gallery, Button/Links, Columns/Sections, Pricing Table, Timeline/Roadmap, FAQ).  
- **AI Features:** rewrite, translate (pt‑BR↔en), tone shift, summarize, **auto‑generate sections**, **extract scope to SOW**, **detect inconsistencies**.  
- **Media:** Upload, URL embed, **AI image/video** via nano banana; drag‑drop; alt‑text; basic crop/resize.  
- **Versioning:** Auto‑save, named versions, diff view, rollback.  
- **Comments & Tasks:** Inline comments, resolve, assign, due dates, simple Kanban per proposal.

### 4.3 Publishing & Access Control
- **Visibility:** Private by default (password auto‑generated). Option: whitelist emails, **magic link**, or **One‑Time Passcode (OTP)** by email/SMS/WhatsApp.  
- **Expiry & Revocation:** Set expiration date; revoke anytime.  
- **Client Workspace:** Comment thread, attachments, request changes, approve sections, **final approve**.  
- **Analytics:** Unique visits, total time, last seen, section heatmap (v2).

### 4.4 Contract Generation & Signature
- **Templates:** DOCX/Markdown contract templates with variables (Company, Scope, SLAs, Price, Payment terms, LGPD clauses).  
- **Merge Engine:** Populate fields from proposal data; export to **PDF**.  
- **Signature:** Integrate with **Brazil‑friendly providers** (e.g., Clicksign/Autentique) or DocuSign; fallback simple e‑sign module (draw/type).  
- **Post‑Signature:** Webhooks → **notify** via Email (SES) + WhatsApp (Cloud API/Twilio/360dialog) + Telegram Bot → **open Production Checklist** (Tasks).

### 4.5 Subdomain Provisioning (AWS)
- **Pattern:** `proposal-<ULID>.infigital.net` (kebab case).  
- **Route 53:** Create A/AAAA or CNAME records via API.  
- **TLS:** **ACM** wildcard (`*.infigital.net`) + **ALB/CloudFront**.  
- **Isolation:** Each proposal renders from a multi‑tenant app with **routing by host**; static assets in **S3**; caching via **CloudFront**.  
- **Automation:** Background job creates DNS + waits for cert validation (if needed) + warms cache.

### 4.6 Notifications
- **Email:** Amazon SES (DKIM, SPF).  
- **WhatsApp:** WhatsApp Cloud API (Meta) or Twilio/360dialog.  
- **Telegram:** Telegram Bot API.  
- **Event Map:** `proposal.published`, `proposal.viewed`, `proposal.comment.added`, `proposal.approved`, `contract.generated`, `contract.signed`, `production.kickoff`.

### 4.7 Admin & Settings
- Roles: **Owner, Admin, AE, Legal/Ops, Client (external)**.  
- Organization settings, branding (logo, colors), legal templates, AI policies, data retention.  
- **Audit log** export (CSV/JSON/PDF).

---

## 5) Non‑Functional Requirements

- **Security:** TLS 1.3; **OWASP ASVS**; JWT w/ short TTL + refresh; **RBAC**; secrets via **AWS Secrets Manager**; least‑privilege IAM.  
- **Privacy (LGPD):** Lawful basis; explicit consent for PII; DSR endpoints (access/delete); data minimization; regional data residency (São Paulo, `sa-east-1`).  
- **Performance:** P95 TTFB < 300ms CDN; image lazy‑load; server render + hydration; import jobs async.  
- **Availability:** 99.9% (v1); multi‑AZ; backups (RPO 1h, RTO 4h).  
- **Scalability:** Stateless app on **ECS Fargate** or **EKS**; queues via **SQS**; jobs via **EventBridge** + **Lambda**.  
- **Observability:** CloudWatch + structured logs; tracing (X‑Ray/OpenTelemetry); error budgets & alerts.  
- **Compliance:** Access logs; audit trails; retention policies; vendor contracts.

---

## 6) System Architecture (Proposed)

- **Frontend:** Next.js/Remix (TypeScript), SSR + ISR; Tailwind; TipTap/Block editor; Uploads to S3 (pre‑signed).  
- **Backend:** Node.js (NestJS/Fastify).  
- **Data:** PostgreSQL (RDS Aurora Serverless v2); Redis for cache/queues.  
- **Storage/CDN:** S3 + CloudFront; image transforms via Lambda@Edge/CloudFront Functions.  
- **Auth:** Passwordless (magic link/OTP) + optional password; **bcrypt/argon2** for hashes.  
- **AI Layer:**  
  - **Text:** OpenAI Chat Completions/Responses API (gpt‑4/“fast‑cheap” alternates selectable).  
  - **Images/Video:** “nano banana” API for generative edit/variation; webhook callbacks.  
- **Imports:** Import Service (microservice) handles API calls, headless browser jobs (Playwright) and conversion to normalized blocks.  
- **Subdomain Router:** Host‑based routing at ALB/NGINX; tenant resolution by host header.

---

## 7) Data Model (Draft)

**Organizations**(id, name, cnpj, branding, plan)  
**Users**(id, org_id, role, name, email, phone, auth_provider, status)  
**Proposals**(id, org_id, title, status, client_org, client_contact, password_hash, visibility, subdomain, expires_at)  
**Blocks**(id, proposal_id, type, content_json, order)  
**Comments**(id, proposal_id, block_id?, author_id, text, status, created_at)  
**Tasks**(id, proposal_id, title, assignee_id, due_at, status)  
**Contracts**(id, proposal_id, template_id, pdf_url, status, signed_at, signer_meta)  
**Templates**(id, org_id, type, name, variables_json, file_url)  
**Events**(id, proposal_id, type, meta_json, created_at)  
**Media**(id, org_id, url, type, meta_json, created_at)

---

## 8) API Surface (Illustrative)

- POST /api/import → { link, provider } → jobId  
- GET /api/import/:jobId → status + summary  
- POST /api/proposals → create (title, client, …)  
- PUT /api/proposals/:id → update meta  
- POST /api/proposals/:id/publish → { visibility, password?, expiresAt? }  
- GET /view (tenant by host) → public/private renderer  
- POST /api/proposals/:id/comments  
- POST /api/proposals/:id/approve  
- POST /api/contracts/:id/generate  
- POST /api/contracts/:id/send-for-signature  
- POST /api/webhooks/signature (provider callback)  
- POST /api/notify (SES/WhatsApp/Telegram abstraction)  
- POST /api/subdomain (internal) → Route53/ACM/CFN pipeline

All endpoints **RBAC‑guarded**; client view uses **scoped tokens** + password/OTP.

---

## 9) Integrations

- **Canva / Gamma:** Prefer official **export APIs** (HTML/JSON + assets). If missing, use **automated export** via headless browser under user’s auth; honor TOS.  
- **OpenAI:** Text edits, rewrite, summarize, translation, extraction to SOW; safety filters; cost guardrails.  
- **“nano banana” (Image/Video):** Prompt‑based edits, upscales, background removal, video insert points; webhook for job completion.  
- **Signature Providers:** Clicksign/Autentique (Brazil), DocuSign (global).  
- **Notifications:** SES; WhatsApp (Cloud API/Twilio/360dialog), Telegram Bot.  
- **Identity:** Magic link/OTP (email/WhatsApp); optional OAuth (Google/Microsoft) for internal users.

---

## 10) Security, Privacy & Compliance

- **LGPD:** Consent logs; purpose limitation; DSR endpoints; data encryption at rest (SSE‑S3, RDS AES‑256) and in transit (TLS 1.3).  
- **Secrets:** AWS Secrets Manager; rotation policy.  
- **RBAC:** Org isolation; tenant boundary checks on every query.  
- **Audit:** Immutable event store for critical actions (publish, share, contract, sign).  
- **Backups/DR:** Automated backups; cross‑AZ; tested restore playbooks.  
- **PenTest:** Before GA; fix critical issues.  
- **Logging:** PII‑aware redaction; SOC2‑style controls (best‑effort).

---

## 11) UX Flows (Happy Paths)

1) **Import → Edit → Publish → Review → Approve → Contract → Sign → Notify → Production**  
- Clear left‑nav: Overview, Editor, Comments, Tasks, Contract, Publish.  
- Client view: clean, distraction‑free, with **Request Changes** & **Approve** buttons.

2) **Comment‑to‑Task**  
- Any comment can become a task with assignee + due date; status mirrors on both sides.

3) **AI Co‑Pilot**  
- Sidebar with quick prompts: “Make executive,” “Correct grammar,” “Create timeline,” “Estimate budget,” “Draft contract clause,” “Generate hero image.”

---

## 12) Rollout Plan & Milestones

- **M1 — Foundation (4–6 weeks):** Auth, orgs, proposals CRUD, block editor (text/image), SES email, basic RBAC, S3+CloudFront, RDS.  
- **M2 — Import v1 (3–5 weeks):** Canva/Gamma import via API or headless export; normalization; fidelity report.  
- **M3 — Publishing & Private Access (2–3 weeks):** Password, magic link/OTP, analytics MVP, subdomain automation.  
- **M4 — AI v1 (2–3 weeks):** Text assist (rewrite/translate/summarize), image edit via nano banana; prompts library.  
- **M5 — Contracts & Signature (3–4 weeks):** Template merge, PDF export, Clicksign/DocuSign integration, webhooks, notifications incl. WhatsApp/Telegram.  
- **M6 — Ops & Production Kickoff (2 weeks):** Production checklist, tasks, dashboards, audit logs, LGPD pack.  
- **Beta (2 weeks):** Bugfix, perf, security hardening.  
**Target GA:** ~16–23 weeks total (modules can run in parallel).

---

## 13) KPIs & Analytics

- Conversion rate Proposal→Signature; average time‑to‑close; # review cycles; section heatmap (v2); client NPS; import fidelity score; AI usage; signature success rate; notification deliverability; perf SLOs.

---

## 14) Risks & Mitigations

- **R1. Import Fidelity Limits:** APIs/exports may not reproduce 100%. → Mitigate with **fidelity report**, manual fix tools, supported‑block list, and partner contacts.  
- **R2. Vendor Lock/TOS:** Ensure compliance; **abstraction layer** for imports; legal review.  
- **R3. Signature Provider Downtime:** Multi‑provider fallback; cached PDFs and retries.  
- **R4. WhatsApp Template Approval:** Pre‑approve templates; keep Telegram/Email fallback.  
- **R5. Cost Spikes (AI/Traffic):** Quotas, caching, batch jobs, model selection (“fast/cheap” default), usage caps.  
- **R6. Security/Data Leaks:** Strict RBAC, tenant checks, encryption, audits, regular pen‑tests, least privilege IAM.

---

## 15) Open Questions

1. Preferred **signature provider** for Brazil (Clicksign vs Autentique vs DocuSign)?  
2. Minimum import **fidelity threshold** to accept a conversion automatically (e.g., 90%)?  
3. **Payment**/invoice integration post‑signature (optional v1.1)?  
4. **Branding per proposal** (CNAME per client?) vs standardized theme only?  
5. Required **languages** (pt‑BR default; en optional?).

---

## 16) Acceptance Criteria (v1)

- Import from at least **one** third‑party (Canva or Gamma) with ≥90% fidelity on supported blocks; report shown for rest.  
- Editor supports **text, image, video, links**, versioning, comments→tasks.  
- Private publish with **password** + **magic link/OTP**; basic analytics work.  
- Contract generator merges variables → outputs **PDF**; e‑signature flow completes; post‑signature **email + WhatsApp/Telegram** sent; **Production checklist** created.  
- Subdomain auto‑provisioning on **AWS** with **TLS** and CDN; renders tenant by host.  
- LGPD controls (consent, DSR, audit log) implemented; security baselines in place.

---

## 17) Appendix — Implementation Notes

- **Subdomains:** Prefer wildcard cert (`*.infigital.net`) on ACM + ALB/CloudFront; dynamic route entries via Route 53 API.  
- **PDF Generation:** DOCX/Markdown → Pandoc/DocxTemplater → PDF (headless) or provider API.  
- **Headless Import:** Playwright in Lambda/ECS; asset download & remap URLs; store normalized block JSON for consistent rendering.  
- **AI Guardrails:** Prompt templates, system instructions, PII filters, profanity/brand safety checks; partial **RAG** for clause libraries.  
- **Cost Control:** Model switcher (fast/cheap by default), image/video job queues, nightly archiving, CDN caching.  
- **Brazil Ops:** `sa-east-1` primary region; SES sandbox exit; WhatsApp business verification; LGPD DPO contact noted in footer.

---

**End of PRD v1.0**
