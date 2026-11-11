# Web Development Final Project - *DevConnect*

Submitted by: **Animesh Niraula**

This web app: **DevConnect** is a forum for developers and AI enthusiasts to ask questions, share their work, discuss ideas, and connect with other builders. It uses React, Vite, Supabase Auth, Postgres, Storage, and a custom responsive interface.

Time spent: **6** hours in total.

## Required Features

The following **required** functionality is completed:

- [x] **Web app includes a create form that allows the user to create posts**
  - A post title is required; additional text and an external image URL are optional.
- [x] **Web app includes a home feed displaying previously created posts**
  - Cards show only creation time, title, and upvotes; clicking a card opens its own page.
- [x] **Users can view posts in different ways**
  - Sort by creation time or upvotes and search posts by title.
- [x] **Users can interact with each post in different ways**
  - Detail pages show the content, image, and comments. Users can leave comments and click upvote any number of times, each click adding one vote.
- [x] **A post that a user previously created can be edited or deleted from its post page**
  - The original author can return to edit or delete their post.

The following **optional** features are implemented:

- [x] **Web app implements pseudo-authentication**
  - Each visitor receives a persistent anonymous Supabase Auth ID displayed on posts/comments. Only authors can edit/delete their own posts or delete their comments, enforced by RLS and SQL grants.
- [x] **Users can repost a previous post by referencing its post ID**
  - The new post shows a clickable reference to the original; there's also a Repost action on every post page.
- [x] **Users can customize the interface**
  - Toggle dark/light color schemes, with the preference saved locally.
- [x] **Users can add more characteristics to their posts**
  - YouTube/Vimeo video embeds, category flags (Question, Discussion, Opinion, Showcase), category filters, and image file uploads.
- [x] **Web app displays a loading animation whenever data is being fetched**
  - This includes initial sign-in, feed/detail loading, comments, posting, voting, and deletion.

The following **additional** features are implemented:

- [x] Form validation, safe provider-restricted video embeds, helpful empty/error states, mobile-friendly layout.
- [x] Database constraints, secure atomic vote RPC, and least-privilege author permissions.
- [x] **Preview mode:** when `.env` is absent, the same interface runs against preloaded browser-local sample data so the design and flows can be explored immediately. Preview mode is **not a secure shared backend**; actual multi-user access uses Supabase.

## Video Walkthrough

Here is a walkthrough of the DevConnect interface and sample interactions in local preview mode:

<div>
    <a href="https://www.loom.com/share/9d29090f490d4c45b54ed74d6aa29e55">
    </a>
    <a href="https://www.loom.com/share/9d29090f490d4c45b54ed74d6aa29e55">
      <img style="max-width:300px;" src="https://www.loom.com/v1/videos/9d29090f490d4c45b54ed74d6aa29e55/thumbnail.gif">
    </a>
  </div>

## How to Run This Project

### 1. Install Node.js

Install Node.js 20.19+ or 22.12+. From VS Code Terminal or Git Bash:

```bash
node -v
npm -v
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Visit [supabase.com](https://supabase.com), create a project, and wait for the database to initialize.
2. Open **SQL Editor → New query**.
3. Paste the **entire** [`supabase/schema.sql`](supabase/schema.sql) file, then click **Run**.
4. In **Authentication → Providers → Anonymous**, enable **Allow anonymous sign-ins**. (The dashboard wording may vary.) Anonymous users use the `authenticated` database role and get a unique ID.
5. Verify that `posts`, `comments`, and the public `post-images` Storage bucket were created. **Keep RLS enabled**.

The SQL file handles table definitions, indexes, policies, privileges, a Storage upload policy, and the atomic `upvote_post` function. You **do not** need to create tables manually.

### 4. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Open `.env`, then replace placeholders with your **Project URL** and **publishable key** from Supabase Project Settings/API or Connect:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Legacy `anon` keys also work with `VITE_SUPABASE_ANON_KEY` if you remove the publishable-key line.

**Never put a Supabase service role key, `sb_secret_...` key, database password, or personal credentials in `.env` used by Vite.** The public/publishable key is intended for client-side apps, combined with RLS. `.env` is gitignored.

### 5. Start the app

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Without valid `.env` credentials, the app intentionally runs in **preview mode** with sample posts stored in `localStorage`. To test the real database, supply both correct environment values and restart Vite.

### 6. Verify production build and unit tests

```bash
npm test
npm run build
npm run preview
```

The build output is saved in `dist/` (which is ignored by Git).

To deploy, choose a static host such as Netlify or Vercel, set the same two `VITE_` environment variables in that host's dashboard, and set the build command to `npm run build` and publish directory to `dist`. Included Netlify/Vercel rewrite rules make deep links like `/post/:id` work when refreshed. Do not expose a service-role/secret key.

## Testing Checklist for the Real Supabase Project

Use two different browser profiles or a normal and an incognito window to get distinct anonymous user IDs.

- [ ] **Post creation:** make a titled post, with and without body text or image URL; verify it appears in both browsers.
- [ ] **Feed:** verify the feed card contains only time, title, and votes; body/image appear on the detail route.
- [ ] **Search and filters:** search for a title; select a flag; sort newest vs. most upvoted.
- [ ] **Votes:** click twice on one post; reload the page and verify both votes are retained.
- [ ] **Comments:** add a comment, reload, and verify the comment persists.
- [ ] **Author ownership:** browser A can edit/delete A's posts and A's comments. Browser B cannot (including direct API calls).
- [ ] **Repost:** copy post A's UUID from its URL and create a repost referring to it. Click through to the original.
- [ ] **Images:** upload a JPEG/PNG under 5 MB, verify the public image appears on the post page.
- [ ] **Video:** paste a YouTube/Vimeo link, check that it embeds on the detail page.
- [ ] **Theme:** toggle the color scheme and reload the page.
- [ ] **SQL checks:** execute [`supabase/security_checks.sql`](supabase/security_checks.sql) in the SQL Editor to inspect RLS and permission configuration.

**Current verification:** The included 10 automated local tests cover utilities and the browser-local preview data layer. A successful Vite build checks frontend bundling. Supabase integration and RLS require a live Supabase project for end-to-end testing; they are **not** claimed as live-tested here.

## Technical Design

```text
src/
  components/   # Layout, reusable form, loading/error/empty states
  context/      # Anonymous Auth session and persistent browser ID
  lib/          # Supabase client, API adapter, preview data, validation
  pages/        # Feed, post detail, create, edit
  App.jsx       # React Router routes
  index.css     # Responsive design and light/dark themes
supabase/
  schema.sql           # Tables, RLS, grants, vote RPC, Storage policies
  security_checks.sql  # Read-only security inspection queries
tests/          # Node built-in test runner
public/         # SVG graphics
assets/         # GIF walkthrough
```

### Security notes

- **Anonymous Auth is not the `anon` database role.** `signInAnonymously()` creates a real temporary Supabase Auth user under the `authenticated` database role. Ownership is tied to `auth.uid()`; IDs are not trusted from the browser.
- **RLS stays ON.** Post/comment edits and deletes are restricted by author ID in SQL, independently of the interface. Post votes cannot be modified through table-level UPDATE permissions.
- **Votes are atomic.** The narrowly scoped `upvote_post(uuid)` RPC increments by exactly one and is callable only by authenticated sessions. This `SECURITY DEFINER` function is in the API-exposed schema by design and should be reviewed before production use.
- **Uploads:** A public bucket allows the images to be viewed; signed-in users may upload only inside their own UUID folder. File type and size are constrained in both frontend and bucket configuration.
- **Identity is device/session-specific.** Clearing browser data or changing devices makes an anonymous author identity unrecoverable. This is an intentional limitation of the pseudo-auth stretch feature.
- For a public production forum, add CAPTCHA/rate limiting, moderation/reporting, abuse controls, pagination, identity linking, and a cleanup routine for orphaned uploaded files.

## Notes

Challenges addressed include preventing someone from modifying another author's posts, keeping the upvote counter unrestricted yet secure, routing to individual discussion pages, and displaying media only where required.

This was developed as a CodePath WEB102 final-project implementation. The linked CodePath README template may require additional personalized entries for your semester; update your own time spent and final walkthrough recording.

## Submission Checklist

- [ ] Record and insert the final **live-database GIF walkthrough**.
- [ ] Fill in your actual time spent and verify all checked features with a live Supabase project.
- [ ] Initialize Git (if needed), add and commit files at milestones, and push to a **private** GitHub repository.
- [ ] Invite **`codepathreview`** as a collaborator with access to the private repository.
- [ ] Submit the **private repository link** in your course portal and resubmit with an updated GIF after any extension changes.

Suggested milestone commits:

```bash
git init
git add .
git commit -m "Build DevConnect HobbyHub with secure Supabase backend"
git branch -M main
# Create a PRIVATE empty GitHub repository yourself, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_PRIVATE_REPO.git
git push -u origin main
```

## License

Copyright © 2026 Animesh Niraula. Created as a student project.
