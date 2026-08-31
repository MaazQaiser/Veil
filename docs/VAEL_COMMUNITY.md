# THE CITY OF VAEL — Community

**Date:** 27 August 2026  
**Milestone:** Milestone 3 — Community Experience  
**Principle:** Continue, don’t rebuild. Shared discovery layer — not a social network, not a replacement for Veil / Matching / Handshake.  
**Runtime:** Local `vael_community_*` keys. Notices reuse `mtx_mock_notifications_v1`. No Supabase, SMS, email, push, or external social APIs.

---

## Audit (this tree, before this milestone)

| Surface | State |
|---|---|
| `/feed` | Honest empty `FeedPage`. No posts |
| `CommunityPostCard` | Design-system card only (author, time, body) |
| `communityService` / `mockCommunity.ts` / `homeFeed.ts` | **Not in this kit.** Documented in the original clone |
| `/media-technology/community` | **Missing** |
| District Homes | Honest “Community is not on this device” |
| Comments / reactions / saves | **Missing** |
| Moderation / report | **Missing.** Handshake `block` is connection-only |
| Search | Form only. No index |
| Notifications | In-app Handshake notices only |

Original clone (audit pack): posts, comments, reactions, saves; sample posts local-only; City feed + M&T community. This kit had the shell route and the card primitive, not the store.

### KEEP / REUSE / IMPROVE / MISSING / UNSUPPORTED

| | |
|---|---|
| **KEEP** | City shell, `/feed`, Handshake privacy, live-Room gate, in-app notices |
| **REUSE** | `CommunityPostCard` (rewired), `FilterChip`, `Require`-style local sign-in, `pushNotice`, profile routes |
| **IMPROVE** | City Home activity, Feed, district Community, create/detail, Room nav |
| **MISSING (still)** | Cloud persist, nested replies, media, share, search index, moderation backend |
| **UNSUPPORTED** | Events, polls, articles, job listings, announcements, emoji reaction sets, infinite scroll, SMS/email/push |

---

## 1. Community purpose

Give people a reason to return when they are not creating a VAEL or matching: **read what was shared, add a note, go back to a Room.**

Spine:

```
Discover (City Feed / District Community)
  → Read (Post Detail)
  → Participate (like / save / comment / share a post)
  → Connect (profile, Room, Matching Board)
  → Return to VAEL
```

It complements Veil, Matching, Handshake, Districts, and Profiles. It does not replace them.

---

## 2. Relationship to core VAEL

| Community | Core |
|---|---|
| Post with district context | Opens that Room and its Board |
| Author handle | Public profile route for that district. Private fields still Handshake-locked |
| Like / save / comment | Local, not a match score |
| City-wide post | Links to Districts, not a fake Board |

No Handshake CTA on every card. The Board link appears on district feeds and post detail.

---

## 3. City Feed

Route: `/feed`

- All posts from live Rooms + city-wide, newest first  
- Filters: All live Rooms, City-wide, each live district, Saved (signed in)  
- Empty is honest until someone on this device publishes  
- Unfinished lots are not in the filter list  

---

## 4. District Feed

Routes:

| Room | Path |
|---|---|
| Media & Technology | `/media-technology/community` |
| Construction | `/districts/contractor/community` |
| Trucking | `/districts/trucking/community` |
| Residential | `/districts/residential/community` |
| Commercial | `/districts/commercial/community` |
| Other lots | `/districts/:slug/community` → Coming Soon / Early Access / Not available yet |

No invented posts for unfinished lots.

---

## 5. Post Card

Hierarchy: author → district → body → like/comment counts → time → Read.

Editorial, not a metric tile. No reaction icon grid.

---

## 6. Post Detail

Route: `/feed/:postId` (one detail surface).

Shows author, district, body, time, like/save, comments, Room / Board links. Private profile fields are not shown. Removed posts: unavailable empty state.

---

## 7. Create Post

Route: `/feed/new` with optional `?district=`

Fields supported: body (required), live Room or City context. No media, scheduling, or tags.

States: editing, publishing, success (navigate to detail), error.

---

## 8. Profile interaction

Author and commenter handles link to the district profile for that post’s Room. City-wide posts use the Media & Technology profile as the City public-identity surface. Profile pages keep Handshake privacy.

---

## 9. Comments

Flat comments on a post. No nested reply graph.

States: empty, posting, error, listed. Signed-in only to publish. Visitors can read.

---

## 10. Engagement

Supported: **Like**, **Save**, **Comment**.

Not supported: share, emoji reactions, follow graph, repost.

---

## 11. Moderation

No report/admin backend in this kit. Handshake **Block** remains on connections only. Authors can **remove** their own post (soft delete on this device). Do not expose moderator controls.

---

## 12. Notifications

In-app only, via existing `pushNotice`. A comment on someone else’s post (same device, different handle) creates a notice. SMS / email / push stay NOT YET CONNECTED.

---

## 13. Search / discovery

City Search has no index. Community is **not** searched. Feed filters are the discovery surface. Dependency: a real search index if the product later needs post search.

---

## 14. States

| Area | States |
|---|---|
| Feed | Empty; content; filtered empty (saved). Loading is local/sync |
| Post | Content; unavailable / removed |
| Create | Editing; publishing; error |
| Comments | Empty; listed; posting; error |
| District | Live community; Coming Soon / Early Access / Not available yet |

---

## 15. Responsive behavior

Feed cards stack; filters scroll horizontally; Share form is one column; comments sit under the post. Room nav already scrolls. City layout already pads for the mobile dock. Verified in session at 320, 375, and 1280.

---

## 16. Accessibility

- Posts as `<article>`  
- Like/Save `aria-pressed`  
- Form labels; errors `role="alert"`  
- Status not color-only (Liked / Saved text)  
- Visible focus from City controls  

---

## 17. Components

**Shared:** `CityPage`, `DistrictRoomNav`, `FilterBar` / `FilterChip`, `PageHeader`, `EmptyState`, `ErrorState`.

**Community:** `CommunityPostCard` (rewired), `CommunityPostList`, Feed / District / Unavailable pages, Create Post, Post Detail.

---

## 18. Data-model limitations

| | |
|---|---|
| **Existing support** | Post body, district id (live Rooms + city), comments, like, save, soft delete, author handle |
| **Missing** | Media, title field, nested replies, report, share, pagination, cross-device identity |
| **UX readiness** | Local loop works: share → feed → detail → like/save/comment → Room |
| **Backend readiness** | **Not ready.** Prototype only |

---

## 19. Future requirements

- Persist beyond `localStorage`  
- Optional sample-post toggle if Owner wants labeled demos  
- Search index  
- Nested replies if product requires them  
- Moderation workflow  
- Media only if architecture adds storage  

---

## 20. Owner decisions

| ID | Decision |
|---|---|
| PL-017 | Community is on every **live** Room plus City Feed. Confirm. |
| Sample posts | This kit does **not** seed fake authors. Confirm empty-first is correct, or request labeled samples. |
| City-wide identity | City posts link to the Media & Technology profile. Confirm or choose Account-only. |
| Search | Leave Community out of Search until an index exists. |

---

## 21. Remaining implementation work

- Owner lock on sample vs empty-first  
- Backend / multi-device  
- Search, media, moderation when architecture exists  

**Do not start Trust or Subscription from this milestone.**
