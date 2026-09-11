# RwandaFlix — Full Manual Test Checklist

Run after `git pull origin main && npm install && npm run dev`.
A "mostly works" is a fail here — check honestly.

## 0. Environment
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → succeeds
- [ ] Supabase project is not paused (Project Settings → General)
- [ ] Have you run every migration in `supabase/migrations/` in order? (see `VERIFY_MIGRATIONS.sql` to check)
- [ ] Have you run `ADD_TEST_TRAILERS.sql`? (needed for hero autoplay / hover-preview tests below)

## 1. Guest experience (signed out)
- [ ] Visiting `/` while signed out shows the landing gate (poster grid background, headline, email + Get Started), not the browsing homepage
- [ ] Clicking Movies, Series, My List, or Downloads in the nav while signed out opens the sign-in form instead of navigating
- [ ] Typing `/browse`, `/series`, `/my-list`, `/downloads`, or `/admin` directly into the URL bar while signed out redirects to `/`
- [ ] "Get Started" with an email pre-fills and opens the sign-up form
- [ ] "Sign In" link opens the sign-in form

## 2. Auth
- [ ] Sign up with a new test email — succeeds, profile row created
- [ ] If "Confirm email" is on in Supabase: sign-in fails with a clear message until you click the confirmation email link
- [ ] Sign out, sign back in — session restores
- [ ] Refresh while signed in — still signed in
- [ ] Wrong password — clear error, no crash
- [ ] "Forgot password?" → real email arrives → clicking its link opens a "Set new password" form → new password works on next sign-in
- [ ] After signing in, `/` shows the real hero + browsing experience, and nav links work

## 3. Catalog / Browse / Search
- [ ] Home hero rotates through multiple movies automatically every ~7s, with clickable dots
- [ ] Hero shows real average rating (or nothing), never a fake "98% Match"
- [ ] If a movie has `trailer_url` set: hero autoplays it muted; hovering its card for ~500ms swaps to the trailer
- [ ] `/browse` search filters results; typing updates the URL to `?q=...`; sharing/reopening that URL restores the same search
- [ ] Genre pills filter correctly
- [ ] Empty search/genre combo shows "No titles found", not a blank screen

## 4. My List
- [ ] Guests see an empty list (no pre-checked fake items)
- [ ] Add while signed in → refresh → still there
- [ ] Remove → refresh → gone

## 5. Ratings
- [ ] Submit a star rating on a movie detail page
- [ ] Refresh — your rating still shows selected
- [ ] A second account rates the same movie differently — the average updates for both

## 6. Watch progress & Continue Watching
- [ ] Play a movie with a real `video_url`, watch 20+ seconds, close it
- [ ] Reopen — resumes near where you left off
- [ ] It appears in home page "Continue Watching"
- [ ] Play a series episode, watch some of it, close it — it also appears in Continue Watching (this used to be silently dropped — confirm the fix worked)
- [ ] Clicking a Continue Watching card resumes the correct movie or episode

## 7. Series
- [ ] `/series` shows real published series, or an honest empty state
- [ ] Series detail groups episodes by season correctly
- [ ] Episode playback and progress tracking work independently from movie progress

## 8. Video player
- [ ] Player controls (seek bar, play/pause, mute, time, fullscreen) are visible immediately and stay visible the whole time — no disappearing/reappearing
- [ ] Video is properly sized/contained, never fills the whole page
- [ ] Seek bar click jumps to that point
- [ ] Fullscreen button works
- [ ] Playing a movie with a broken/empty video URL shows a real, specific error message, not a silent stuck spinner
- [ ] Switching directly from one video to another (without closing first) doesn't carry over stale play/pause state

## 9. Downloads
- [ ] Download a movie with a real video URL — real progress % updates
- [ ] Appears in /downloads with correct size/duration
- [ ] Playing it offline (DevTools -> Network -> Offline) works from the cached copy
- [ ] Removing a download clears it from the list and from Cache Storage
- [ ] Downloading a movie with no video_url shows a clear error, no crash

## 10. Notifications
- [ ] Bell icon shows a real unread-count badge (not a permanent dot) — 0 unread means no badge at all
- [ ] Submitting a film (see Creator section) generates a real "Submission received" notification
- [ ] Clicking a notification marks it read and the badge count decreases

## 11. Creator pipeline (upload -> review -> publish)
- [ ] "Become a creator" creates a real creator_profiles row
- [ ] Submit a film with a real video file — it actually uploads to Storage, appears in "Your submissions" as pending
- [ ] As an admin (see Admin section), approve it — creator gets a real "Film approved!" notification, and the movie appears live in /browse immediately
- [ ] Reject a different submission with a reason — creator gets a notification including that reason
- [ ] Play the newly-approved movie as any viewer — creator's Creator Studio "Total Views" and per-movie breakdown increase by 1

## 12. Admin (requires role = 'admin' on your profile)
- [ ] Profile dropdown -> "Admin Review" opens the real admin page; a non-admin account sees "Admin access only" instead
- [ ] Submissions tab: approve/reject work as above
- [ ] Movies tab: unpublish a movie -> it disappears from /browse for regular viewers; publish it again -> reappears
- [ ] Movies tab: delete a movie -> gone permanently
- [ ] Users tab: change another test account's role via the dropdown -> their access actually changes accordingly

## 13. Account Settings
- [ ] Upload a real photo as avatar — preview updates, persists after refresh
- [ ] Change password via the real form (length + match validation) — works, can sign in with the new password
- [ ] "Delete my account" requires typing DELETE to confirm, then actually deletes the account, signs out, and redirects home (test with a throwaway account — irreversible)

## 14. Multiple profiles ("Who's Watching")
- [ ] Profile dropdown -> opens a real profile grid
- [ ] Add a profile (name, up to 5 total) — persists after refresh
- [ ] Selecting a profile shows its name in the dropdown ("Switch Profile (Name)")
- [ ] Remove a profile — gone
- [ ] Confirm known limitation: switching profiles does NOT change your watchlist/history/ratings — those remain account-wide (documented, not a bug)

## 15. Billing
- [ ] Choose the Free plan while signed in — real row appears in subscriptions, no Stripe involved
- [ ] Choose a paid plan before finishing Stripe setup — clear error, not a silent failure or fake success
- [ ] (Once Stripe webhook is registered) Paid checkout with test card 4242 4242 4242 4242 completes and a real subscriptions row appears with status = active

## 16. Legal/support pages
- [ ] /help, /terms, /privacy, /contact, /partner, /guidelines load real content
- [ ] Terms/Privacy show the "draft template, not legal advice" banner
- [ ] Privacy page correctly describes self-service account deletion

## 17. Social links
- [ ] Footer Facebook/Instagram/LinkedIn icons open your real profiles in a new tab

## 18. Routing & sharing
- [ ] Refreshing on /browse, /series, etc. doesn't 404 (works automatically in npm run dev; only matters once actually deployed)
- [ ] Sharing a movie detail link (?movie=...) opens the same movie when visited fresh
- [ ] Browser back/forward works sensibly across pages

## 19. Mobile (real device or narrow browser window — cannot be verified by Claude)
- [ ] Nav collapses into the mobile menu
- [ ] Landing page heading/email form doesn't overflow
- [ ] Admin action buttons (Approve/Reject/Publish/Delete) wrap onto their own row instead of overflowing
- [ ] Profile switcher avatars fit without overflowing
- [ ] Video player controls are usable and don't overlap

## 20. Production deployment (Vercel)
- [ ] https://rwandaflix-dun.vercel.app/ loads the real app, not a 404 or blank page
- [ ] Deep links and refreshes work on the deployed site (vercel.json handles SPA routing)
- [ ] Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are correctly set in Vercel project settings — sign-in on the live site actually reaches your real Supabase project

## 21. Regression check
- [ ] Nothing from any earlier section visibly broke as a side effect of later changes
