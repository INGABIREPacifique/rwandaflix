# RwandaFlix — Manual Test Checklist (post Phases 1, 4, 5, 6, Downloads, Billing-scaffold)

Run these in order after `git pull origin main && npm install && npm run dev`.
Check off each one honestly — a "mostly works" is a fail for this list.

## 0. Environment sanity
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → succeeds
- [ ] `.env.local` has real `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Open the app — no red error boundary screen on load

## 1. Auth
- [ ] Sign up with a new test email — succeeds, profile row created
- [ ] Sign out, sign back in — session restores
- [ ] Refresh the page while signed in — still signed in (session persists)
- [ ] Try signing in with a wrong password — clear error shown, no crash

## 2. Catalog / Browse
- [ ] Home page loads real movies (not just the 20-title local fallback, unless your `movies` table genuinely only has that many)
- [ ] `/browse` — search box filters results
- [ ] `/browse` — genre pills filter results
- [ ] Empty search/genre combo shows the "No titles found" empty state, not a blank screen

## 3. My List
- [ ] Add a title to My List while signed in → refresh page → still there
- [ ] Remove it → refresh → gone
- [ ] Try adding to My List while signed out → prompted to sign in, doesn't silently fail

## 4. Ratings (Phase 1)
- [ ] Open a movie detail modal, submit a star rating
- [ ] Refresh — your rating still shows as selected
- [ ] Sign in as a **second** test account, rate the same movie differently
- [ ] Confirm the average shown on the movie card changes to reflect both ratings — **this specifically tests the RLS fix in `20260902_ratings_public_read.sql`; if the average doesn't update, that migration likely wasn't run**

## 5. Watch progress (Phase 1)
- [ ] Play a movie with a real `video_url`, watch ~20+ seconds, close the player
- [ ] Reopen the same movie — playback resumes near where you left off
- [ ] Watch a title to the end — it's marked completed (won't show in Continue Watching afterward, or shows "Watched" depending on your read of the UI)
- [ ] With **zero** watch history, confirm Continue Watching section doesn't appear at all (no fake fabricated entries)

## 6. Series (Phase 4)
- [ ] `/series` shows real published series, or an honest "No series published yet" empty state if your `series` table is empty
- [ ] Open a series detail page — episodes grouped correctly by season
- [ ] Play an episode with a real video URL — progress tracking works independently from movie progress
- [ ] Reopen that episode — resumes correctly

## 7. Routing (Phase 5)
- [ ] Navigate to `/browse`, hit browser refresh — page loads correctly (not a 404) **only if deployed with the Netlify/Vercel config; on `npm run dev` this always works regardless**
- [ ] Open a movie detail, copy the URL (should contain `?movie=`), open it in a new private/incognito tab — same movie modal opens
- [ ] Browser back/forward buttons work sensibly between Home/Browse/My List/Series

## 8. Account Center (Phase 1/6)
- [ ] Bell icon → opens real Notifications tab (not the old fake dropdown)
- [ ] Profile tab: edit name/avatar, save, refresh — persists
- [ ] Creator Studio tab: "Become a creator" → creates a real `creator_profiles` row
- [ ] Subscription tab lists real plans from `subscription_plans`

## 9. Support/legal pages (Phase 6)
- [ ] `/help`, `/terms`, `/privacy`, `/contact`, `/partner`, `/guidelines` all load real content, not toasts
- [ ] Terms/Privacy visibly show the "draft template" warning banner

## 10. Downloads (this round)
- [ ] Open a movie with a real video URL, click Download — progress percentage updates
- [ ] Go to `/downloads` — the title appears with correct size/duration
- [ ] Turn off Wi-Fi (or use DevTools → Network → Offline), open the downloaded title from `/downloads` — it plays from the offline cache
- [ ] Remove a download — it disappears from `/downloads` and from cache (check DevTools → Application → Cache Storage)
- [ ] Try downloading a movie with **no** `video_url` — clear error, no crash

## 11. Billing (this round — expected to fail until you complete BILLING_SETUP.md)
- [ ] Choose the **Free** plan while signed in — real row appears in `subscriptions`, no Stripe involved
- [ ] Choose a **paid** plan before completing Stripe setup — clear error message pointing at `BILLING_SETUP.md`, not a silent failure or fake "success"
- [ ] *(After completing BILLING_SETUP.md)* Choose a paid plan with a Stripe test card (`4242 4242 4242 4242`) — redirects to real Stripe Checkout, completes, and a row appears in `subscriptions` with `status = 'active'` and a real `stripe_subscription_id`

## 12. Mobile / responsive (untested by me — I have no real browser)
- [ ] Open on an actual phone or a narrow browser window
- [ ] Nav collapses into the mobile menu correctly
- [ ] Episode list (`.wide-row-stacked`) doesn't overflow or look broken on a narrow screen
- [ ] Video player controls are usable on mobile

## 13. Regression check
- [ ] Nothing from earlier phases (My List, Continue Watching, Creator Studio) visibly broke as a side effect of this round's changes
