# THE CITY OF VAEL — Client demo journey

**Date:** 27 August 2026  
**Purpose:** First client demo. Clickable product journey in the existing React + Tailwind app.  
**Principle:** Continue, don’t rebuild. Local/mock only. No marketing site, slideshow, or invented backend.

---

## 1. Demo objective

Present VAEL through one story:

**Availability → VAEL → Match → Handshake → Connection → Message**

The client should leave understanding that a professional becomes visible, the City ranks opposite-side availability, a Handshake keeps the door closed until both people accept, and a private Connection is what opens conversation.

Do not use this walkthrough to sell Construction, Trucking, Residential, or Commercial as live markets. Those Rooms exist in this prototype on this browser only.

---

## 2. Demo persona

| | |
|---|---|
| Name | Alex Morgan |
| Handle | `alexmorgan` |
| Email (presentation) | `alex.morgan@example.com` |
| Role | Creative Director |
| District | Media & Technology |
| Availability (start) | Not visible / not available |
| Default VAEL | Veil In · Designer · Software · Atlanta · Remote · This cycle |

Counterpart on this device (not a second account): **Jordan Lee** (`jlee`), Product Designer, Veil Out.

---

## 3. Complete journey

```
City (signed out)
  → Sign In
  → City Home
  → Profile
  → Veil (not available)
  → Create VAEL
  → VAEL created
  → Matching Board
  → Filters
  → Match detail
  → Request Handshake
  → Handshake sent
  → Incoming Handshake (staged second-user view)
  → Accepted
  → Private Connection
  → Messaging
  → Connections
  → City (signed in)
```

Reset before every take: `/design-system` → **Reset Demo**, or open `/demo/reset`.

---

## 4–8. Screen-by-screen

| # | Screen | Purpose | Primary CTA | Next Screen | Status |
|---|---|---|---|---|---|
| 01 | City | Introduce product | Explore the City | Sign In | Pass |
| 02 | Sign In | Enter product | Sign In | City Home | Pass |
| 03 | City Home | Product context | Create VAEL | Profile | Pass |
| 04 | Profile | Establish identity | Create VAEL | Veil | Pass |
| 05 | Veil | Establish availability | Veil In | Create VAEL | Pass |
| 06 | Create VAEL | Define availability | Create VAEL | VAEL Created | Pass |
| 07 | VAEL Created | Confirm visibility | View Matches | Matching Board | Pass |
| 08 | Matching Board | Show value | View Match | Match Detail | Pass |
| 09 | Filters | Refine discovery | Apply (mobile drawer) | Matching Board | Pass |
| 10 | Match Detail | Explain fit | Request Handshake | Handshake | Pass |
| 11 | Handshake | Request connection | Send Handshake | Sent | Pass |
| 12 | Sent | Show pending state | View Connections | Incoming | Pass |
| 13 | Incoming | Second-user state | Accept | Accepted | Pass |
| 14 | Accepted | Confirm connection | Open Conversation | Connection | Pass |
| 15 | Connection | Private relationship | Open Conversation / Message | Messaging | Pass |
| 16 | Messaging | Start conversation | Send | Connections | Pass |
| 17 | Connections | Show relationship | Open Conversation | Messaging | Pass |
| 18 | City | Return to ecosystem | View Matches / Connections | City | Pass |

### Routes

| # | Route |
|---|---|
| 01 / 03 / 18 | `/` |
| 02 | `/sign-in` |
| 04 | `/media-technology/profile/alexmorgan` |
| 05–07 | `/media-technology/veil` |
| 08–09 | `/media-technology/board` |
| 10 | `/media-technology/board/:listingId` (Jordan: `vael_jlee`) |
| 11 | `/media-technology/board/:listingId/handshake` |
| 12–16 | `/media-technology/connections/:id` (`?view=incoming` for screen 13) |
| 17 | `/media-technology/connections` |
| Reset | `/demo/reset` and `/design-system` |

### Screen notes

**01 City (`/` signed out)**  
Availability pill with a live count, split hero, and a **This cycle on this device** rail of sample people (name, role, Available / Needs someone, hours left). Below: the six-step story strip, the featured Media & Technology Room, then other lots demoted to a plain list.

**02 Sign In (`/sign-in`)**  
Email only, prefilled. One primary action: **Continue as Alex Morgan**. Submit calls `signIn("alexmorgan")` and seeds the demo workspace.

**03 City Home (`/` signed in)**  
Availability pill, Alex Morgan, and the same cycle rail. **Where you are** names the current step in the six-step story and gives the single next action. Availability panel, Connections, featured Room, Community, other lots.

**04 Profile**  
Alex Morgan · Creative Director · Media & Technology. Capabilities, experience, tools, portfolio, documents. Primary **Create VAEL**. Secondary **Edit Profile**.

**05 Veil**  
NOT AVAILABLE. Copy: you are not currently visible. **Veil In**. Secondary: Learn how it works.

**06 Create VAEL**  
Existing M&T fields only (discipline, skills, tools, certifications, location, remote/onsite, timing, experience; more detail for category, engagement, budget). Prefills Alex’s defaults. **Create VAEL**. Secondary: Save for later (local draft). **More detail** is optional.

**07 VAEL created**  
Available · Media & Technology · 24-hour Daily VAEL remaining. **View Matches**. Secondary: Edit VAEL.

**08 Matching Board**  
Your Matches. Cards: match %, name, role, discipline, capabilities, location, availability. **View Match**. Secondary: View Profile.

**09 Filters**  
Match band, discipline, location, availability. Desktop chips apply immediately. Mobile: Filters drawer + **Apply** (closes drawer). Do not set availability to “Available” while Alex is Veil In — Jordan is Veil Out (“Needs someone”).

**10 Match detail**  
Percent, identity, capabilities, location, availability, Why this match (live matching criteria). **Request Handshake**. Secondary: Back to Matches.

**11 Handshake request**  
Route `/media-technology/board/:listingId/handshake`. Who, why they matched, what happens next. **Send Handshake**. Secondary: Cancel.

**12 Handshake sent**  
Pending. **Preview as {name}** opens the staged incoming view for sample counterparts (Jordan). Secondary: Back to Matches.

Safe to click here: the notifications bell now carries **Handshake sent — waiting for @jlee to accept**, with an **Open** link back to this pending Handshake. **Messages** is still empty at this beat (a thread needs both accepts) but its empty state points to **View Handshakes**, not to the districts grid.

**13 Incoming Handshake**  
Persistent bar: **Preview as Jordan Lee · no second account on this device**, with **Back to your view**. Then “Alex Morgan wants to connect with you.” **Accept** / **Decline**.

**14 Handshake accepted**  
You’re connected. Connection created. **Open Conversation**. Secondary: View Profile.

**15–16 Connection + messaging**  
Same route after Open Conversation: counterpart profile (now revealed) + composer. Seeded demo thread, then **Send**. Messages stay in `localStorage`.

**17 Connections**  
Jordan Lee · Connected · Media & Technology · last message · **Open Conversation**. **Return to the City**.

**18 Return to City**  
Signed-in home with Active VAEL, Connections, Community, Districts.

---

## 9. Demo state requirements

Stored on this browser only:

- Session: `vael_city_shell_session_v1` handle `alexmorgan`
- Profiles / listings / connections / messages: existing VAEL store keys
- Draft: `vael_client_demo_draft_v1`
- Sample counterparts: `jlee` (Jordan Lee), `willowform`, `pshah` (Priya Shah), plus existing `amercer` / `northlight`
- Sample Community posts, seeded by `ensureCommunityPosts` and labeled sample-on-this-device

Matching is **opposite-side only**. Alex Veil In ranks Jordan / Willowform Veil Out. Matching weights are unchanged.

---

## 10. Reset behavior

**Reset Demo** (design-system gallery) or visiting `/demo/reset`:

1. Clears Alex’s listings, Handshakes, messages, and notices
2. Restores the Alex Morgan profile
3. Refreshes sample counterpart VAELs
4. Clears the Create VAEL draft
5. Signs out
6. Returns to City (`/` from `/demo/reset`)

Then replay from screen 01. This control is not in City primary navigation.

---

## 11. Mock / demo limitations

- One browser. No second device, no second account.
- Incoming Handshake is a staged view (`?view=incoming`) that calls `simulateCounterpartAccept`. It is labeled on screen with a persistent **Preview as {name} · no second account on this device** bar.
- Jordan Lee, Willowform, and Priya Shah are sample records on this device.
- The seeded conversation is inserted locally after Open Conversation.
- Sign In takes an email only. There is no password field, no password check, and no account server.
- Notifications are local records written to this device. Nothing is sent by SMS, email, or push.
- **The faces are stock photographs of people who are not VAEL users.** They stand in for Alex
  Morgan, Jordan Lee, A. Mercer, and Priya Shah. Never present them as members or testimonials.
  Sources and licence: `public/CREDITS.md`. Willowform and Northlight are studios, so they carry a
  monogram and a work plate rather than a face.
- **Search** has no index and says so. Keep it off the demo path.
- Construction, Trucking, Residential, and Commercial must not be described as production-backed.

---

## 12. Backend limitations

Nothing in this demo is a live backend:

- No account server, password check, or password reset
- No live users receiving Handshakes
- No networked messages
- No payments, SMS, or cloud file storage
- Visibility is a 24-hour local Daily VAEL

---

## 13. QA results

**Date:** 27 August 2026

| Check | Result |
|---|---|
| Every CTA on the spine works | Pass (routes and primary CTAs wired) |
| Every screen loads | Pass (browser walkthrough) |
| Back / crumbs work | Pass |
| Demo state persists in the browser | Pass |
| Reset returns not visible / no VAEL / no Handshake / no Connection | Pass (unit + `/demo/reset` + gallery Reset Demo) |
| No dead ends on the spine | Pass |
| No broken routes on the spine | Pass |
| TypeScript | Pass (`tsc --noEmit`) |
| Tests | Pass (48) |
| Production build | Pass |
| Lint | Not configured (`package.json` has no lint script) |
| Handshake state understandable | Pass, if incoming view is explained as staged |
| Privacy boundary understandable | Pass (copy states private after both accept) |
| Horizontal overflow / 320–1440 | Pass at 375 and ~1071; no overflow on City home or Matching Board |

**Presenter traps**

- Filters → **Available** hides Jordan (correct: Alex is In, Jordan is Out).
- Visiting `/media-technology/veil` after create skips screens 05–06 (opens VAEL created). Reset to replay from Not Available.
- Sign In takes an email only and does not verify it.

---

## Presenter script (short)

1. City: availability, then a private door.
2. Sign in locally as Alex Morgan.
3. Not visible → profile → Veil In → Create VAEL.
4. Board: Jordan is a strong opposite-side match. Open why.
5. Handshake: nothing private yet.
6. Staged incoming accept (say this out loud).
7. Connection + messages on this device.
8. Return to City: it is a network, not only a matching screen.
