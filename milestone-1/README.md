# Milestone 1 — Technical Audit pack

THE CITY OF VAEL · August 2026 · PRD Milestone 1

Print-ready HTML lives in `html/`. Generated PDFs live in `pdf/` (dark gold cover + paper interior; VAEL medallion on every cover).

| PDF | PRD deliverable | Term |
|-----|-----------------|------|
| `00-owner-brief.pdf` | How to read the audit | Inspection Report |
| `01-framing.pdf` | Repository and architecture review | Framing |
| `02-foundation.pdf` | Data model and Supabase review | Foundation |
| `03-doors-and-locks.pdf` | Auth and RLS review | Doors & Locks |
| `04-utilities.pdf` | APIs and integrations review | Utilities |
| `05-punch-list.pdf` | Defects and gaps | Punch List |
| `06-blueprint.pdf` | Prioritized finish list | Blueprint |

Method: read-only inspection of the live tree on 25 August 2026. No product code was changed. No backend was connected.

To regenerate PDFs (macOS, Google Chrome installed):

```bash
./print-pdfs.sh
```
