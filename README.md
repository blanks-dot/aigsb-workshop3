# AI@GSB Workshop 3 site: make your AI look and sound like you

The student-facing site for AI@GSB Workshop 3. Students sign in with a name and
email, pick a version (Polished, Warm, Playful), then walk through the build one
step at a time: a voice skill, a design skill, three options for the top section
of a one-page personal website (pick one, fix the skill), the full site built
once, and the site hosted live in the room (one file dropped on Vercel Drop, with
GitHub as an optional side quest). The live link goes into a class gallery
automatically. Mary's talk covers the ideas. This site is the build. The deck
lives elsewhere; the site no longer links to it.

Look and feel follow the Workshop 3 deck (`workshop3-deck.html`): beige paper,
Instrument Serif headlines, DM Sans body, DM Mono labels, four acts with one
color each. WHY (Start here, Set up) orange, VOICE (version, voice) violet,
DESIGN (look) teal, BUILD (three options, build it once) yellow #F2B705 with ink
text, HOST (host it live, finish) blue.

Built on the Workshop 2 site (the CRM workshop), which was built on Abhi's
Workshop 1 site ([ADA110/outreach-workshop-site](https://github.com/ADA110/outreach-workshop-site)).
Same stack and mechanics: static HTML, three Vercel functions, and Upstash
Redis. No framework and no build step.

```
index.html            the student site: sign-in, What you're building, steps 0 to 6, Finish, Stuck? drawer.
                      All student-facing text lives here, plus an embedded copy of the voice starter
                      (<script type="text/plain" id="skill-voice">) for the step 2 anatomy.
deploy.html           "the long version" of step 6: Vercel Drop first, then "Optional: with GitHub".
                      Its own page, no sign-in, linked from step 6 and the rail under HOST
gallery.html          the class gallery: every student with a live link and the gallery box ticked.
                      No sign-in, no key. Served at /gallery (add ?room= for a room)
instructor.html       the instructor dashboard, served at /instructor (needs the key)
css/site.css          styles (palette, type, transitions). the Workshop 2 sheet plus the Workshop 3 components.
js/app.js             site mechanics: sign-in, rail, progress + sync, version picker, Make it yours
                      forms, copy cards (with the student's name filled in), skill anatomy, step 5
                      rating, live link + gallery opt-in, deploy date fallback, Stuck? drawer and
                      ladder, "Borrow ours" starter zips, feedback
js/zip.js             fills a starter SKILL.md from the form and zips it, in the browser (no dependencies)
skills/<skill>/       the five starters (SKILL.md only): voice, voice-gsb (a ready GSB-student voice,
                      skill name "voice"), design-polished, design-warm, design-playful, design-custom
                      (the "Your own" vibe: no preset look).
                      Served as files; the forms and the starter buttons read them.
img/screens/          screenshot slots: drop <id>.png here (see img/screens/README.md)
api/progress.js       POST only: a student saves their own progress (plus version, live link, gallery, deploy date)
api/feedback.js       POST only: a student rates the workshop (Finish) or one step (step 5)
api/instructor.js     GET only, key required: everyone's progress and feedback for a room
api/gallery.js        GET only, no key: name + live link + version for everyone opted into the gallery
lib/store.js          shared validation and storage (outside api/, so it isn't a route)
scripts/dev-server.mjs  local preview server with an in-memory store
scripts/skills.mjs    check / sync skills/ against the canonical starters folder (path argument)
scripts/test-zip.mjs  fills every starter with sample values, builds the zip, checks it with `unzip`
vercel.json           cleanUrls, so /instructor and /deploy work without .html
.vercelignore         keeps docs/, scripts/ and the markdown files off the live site
docs/screenshots/     screenshots from the build test (not deployed)
```

## Run it locally

Needs Node 18 or newer.

```bash
npm install
npm run dev
```

- Site: http://localhost:3000 (add `?room=test` to try a room)
- The long version: http://localhost:3000/deploy
- Gallery: http://localhost:3000/gallery
- Dashboard: http://localhost:3000/instructor, key `dev`
- On localhost, facilitator draft notes show automatically. Add `?draft=0` to see
  exactly what students see. On the live site, add `?draft=1` to show them.

The local server keeps progress in memory, so it resets when you stop it.
Opening `index.html` straight from Finder shows the page and the step 2 anatomy
(the voice starter is embedded), but the design forms still need to fetch
`skills/design-*/SKILL.md`, so use the server for a full run.

Checks:

```bash
npm run test-zip                            # builds all four zips with sample form values and checks them
npm run check-skills -- /path/to/starters   # site copy of the starters vs the canonical folder, byte for byte
PORT=3077 npm run dev                       # then, in another shell, the browser walkthrough (needs Playwright + Chromium):
NODE_PATH=/path/to/node_modules node scripts/browser-test.cjs
```

## Deploy on Vercel (one-time setup)

You need a GitHub account and a Vercel account (sign in to Vercel with GitHub).

1. **Push to GitHub.** Create a new, empty GitHub repository (no README, no
   .gitignore), then from this folder:
   ```bash
   git init && git add -A && git commit -m "Workshop 3 site"
   git remote add origin https://github.com/<you>/<repo-name>.git
   git push -u origin main
   ```
2. **Import into Vercel.** On vercel.com: **Add New › Project**, pick the repo,
   then **Import**. Settings:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command, Output Directory, Install Command: leave the defaults (no build step)

   Click **Deploy**. The site works straight away, but it can't save progress
   until step 3 is done. Students still see their own progress in their browser.
3. **Add the database (Upstash Redis).** In the project: **Storage** tab ›
   **Create Database** (or **Browse Marketplace**) › **Upstash › Redis** › free
   plan › connect it to this project, for all environments. This adds the env
   vars `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). The code reads either pair.
   - You can reuse Workshop 1's or Workshop 2's Redis database: this site stores
     its keys under `workshop3:…`, so they never collide.
4. **Set the dashboard key.** **Settings › Environment Variables** › add
   `INSTRUCTOR_KEY` with a password of your choice, for **Production** (and Preview if you
   want the dashboard on preview links). Without it, the dashboard refuses every
   request, so student data never leaks.
5. **Redeploy** so the new env vars take effect: **Deployments** › the latest
   one › **⋯ › Redeploy**.
6. **Check it.** Open the site, sign in as yourself, check off 0.1. Then open
   `/instructor`, enter the key, and you should see yourself in the room.

After that, every push to `main` deploys to production automatically. Pushing
another branch gives you a preview URL instead.

Prefer the CLI? `npm i -g vercel`, then from this folder: `vercel` (link the
project), `vercel integration add upstash`, `vercel env add INSTRUCTOR_KEY production`,
`vercel --prod`.

### Environment variables

| Variable | Where it comes from | What it does |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, or `REDIS_URL`) | Added by the Upstash integration | Progress and feedback storage |
| `INSTRUCTOR_KEY` | You set it | Opens `/instructor` |

## Placeholders to fill before students see it

Grep for each bracket; every one is in a `data-url` attribute or a draft note.
Replace the bracket with the real URL and the span turns into a link on its own.

| Placeholder | Where | What goes there |
|---|---|---|
| (none) | | PollEv, the feedback form, and the Stanford request form and service page are all real links now |

(`[TUTORIAL_URL]`, the site's own live URL, is only in the deck.)

Then:

- Drop screenshots into `img/screens/` using the slot names in `img/screens/README.md` (17 slots; the three Vercel Drop cards on step 6 share `d-drop-1` to `d-drop-3` with deploy.html).
- Verify the one link tagged **verify** (claude.ai/customize/skills) on a student account, then delete its `data-verify` attribute.
- Skim it once with `?draft=1` to see every draft note.

## Rooms

One URL serves several cohorts:

```
https://<your-site>.vercel.app/?room=gsb-fall
https://<your-site>.vercel.app/instructor?room=gsb-fall
```

No `room` means the room called `default`. The dashboard lists every room that
has data. Each room's data expires 30 days after its last write.

## Instructor dashboard

`/instructor`, behind `INSTRUCTOR_KEY`. The key stays in that browser until you
press **Lock**. Nothing on the student site links to it. It refreshes every 5 seconds and shows:

- headline numbers: signed in, finished step 0, built the site (step 5), finished every step, active now, pasted a live link, in the gallery, picked a later date, step 5 rating, final rating
- per-step counts and who is on each step right now (side quests counted under step 6)
- step 0 broken down by item (0.1 to 0.5; 0.5 is the optional Vercel account), and who hasn't finished it yet
- version counts
- live links (bold = in the gallery), opt-outs, and the "not tonight" dates
- the step 5 "how's tonight going?" spread
- median time per step (from when a student opened the step to when they
  checked it off; a break of 3+ hours, like pre-work at home and then class, restarts the clock)
- final rating spread and every comment
- a filterable, sortable student table with version, live link, gallery, deploy date and step 5 columns, and **Export CSV** (all of those plus per-step flags, side quests and timestamps, 43 columns)

## Privacy

Stored per student, keyed by email: name, email, version, which steps
are checked off and when, which step they're on, live link, gallery opt-in,
deploy date and time, the step 5 rating, and the final rating and comment.
Deleted automatically 30 days after the room's last activity. `/api/instructor`
returns all of it, only with the key. `/api/gallery` is public and returns only
name, live link and version, and only for students with the gallery box ticked
(it is ticked by default; unticking on step 6 removes them on the next save).
Live links are https only, 200 characters max (`cleanLiveUrl` in `lib/store.js`).

**Never stored or sent:** anything typed into a Make it yours form (writing
samples, words, sign-off, colors). The zip is built in the browser from those
values and the form is cleared by a reload. The step 6 checklist stays in that
student's browser (localStorage) and is not synced.

## Editing content

- **Text:** edit `index.html` directly. Each step is a `<section data-step="…">`.
  `data-learned` on the section is its "Now you know" line.
- **One path per step.** The Make it yours form is the main path on steps 2 and 3; "Or build it
  with Claude" is a section under it. The starters are also downloadable from the Stuck?
  drawer ("Borrow ours", `[data-starter]` buttons), and the GSB voice starter from step 2
  (`data-starter="voice-gsb"`, zipped as `voice/SKILL.md` via `STARTER_FOLDER` in `js/app.js`).
- **Formulas:** steps 2 and 3 open with `<ul class="formula">` (samples + qualities + nevers,
  assets + vibe + nevers), and the forms group their fields under the same labels (`.mf-group`).
- **Done looks like:** `<div class="done-box">` with a `.thumb.thumb-<name>` drawn in CSS
  (see the "Done looks like" block in `css/site.css`). Add a new thumb class there if you need a new picture.
- **Mirror and Memory moments:** `<aside class="memory mirror">` (violet tint) and `<aside class="memory">` (sun tint).
- **Acts and colors:** `data-part="why|voice|design|build|deploy"` on a step sets `--accent`, `--rc` (rail, progress) and `--pc` (text). `data-group` is the rail heading (WHY, VOICE, DESIGN, BUILD, HOST; the host step keeps the `deploy` colors). The tokens are at the top of `css/site.css`; `--*-d` are the darker versions used for text. Build's fill `#F2B705` always carries ink text; its text tone `--build-d #A86B00` is 3.8:1 on the paper, so it is fine for big numbers but under 4.5:1 for small labels.
- **Account comparison (step 3):** `<div class="acct-grid">`, one `<article class="acct-col">` per tool with a `<dl>` of four rows. Three columns with a label column on desktop (CSS subgrid keeps the rows level), one card per tool under 720px.
- **Step 6 (host):** `<ol class="clicks">` holds the four Vercel Drop cards (get one file, open Vercel Drop, drag & deploy, copy your link), `#live-link` the link field and the gallery checkbox, `#deploy-plan` the "not tonight" date, `#save-list` the three files, `#github-quest` the GitHub side quest. `<div class="quests">` holds the seven side-quest cards; the whole line is the tick.
- **Copy cards:** the `<script type="text/plain" id="src-…">` blocks at the bottom of
  `index.html`. `{{VERSION}}` is filled from step 1; `[name]` becomes the signed-in name;
  `{{STEP}}` and `{{STEP_TITLE}}` in the Stuck? ladder prompt are filled from the step the
  student is on. Other [brackets] stay for the student to fill.
- **Make it yours forms:** `<div class="myform" data-kind="voice|design">`. The fields are
  rendered by `renderForm` in `js/app.js`; the swatches per version are in `SWATCHES`.
  `js/zip.js` → `fillSkill` maps fields to lines in the "## Make it yours" section.
- **Screenshots:** drop `img/screens/<id>.png` (or .jpg/.webp). Slot ids and
  descriptions are listed in `img/screens/README.md`. Empty slots show a labeled placeholder.
- **Links that still need verifying** carry `data-verify` and show a yellow
  "verify" tag. Delete the attribute once checked.
- **Placeholder links:** `<span class="link-pending" data-url="[X_URL]" data-label="…">`.
  Put the real URL in `data-url` and it renders as a link.
- **Stuck? entries:** the `<section class="stuck-group" data-group="…">` blocks in the
  drawer. `data-group` matches a step id (`setup-1`, `setup-2`, `setup-5`, `version`, `voice`,
  `design`, `three`, `build`, `host`, `any`), so the drawer opens at the right place.
  The ladder at the top is `<section class="ladder">`: ask Claude, the list, PollEv, raise your hand.
- **House rules:** `<ol id="house-rules">` in What you're building (three of them). The drawer copies them automatically.
- **Draft notes for facilitators:** `<div class="draft-note">`. Hidden from students
  unless `?draft=1`.
- **Steps list:** if you add, remove or rename a step id, update `STEPS` in
  `js/app.js`, `MAIN_STEPS` in `lib/store.js`, and `TITLES`/`NUM`/`COLOR` in `instructor.html`.
  Step 0 items are `SUBS` / `SUB_STEPS`, side quests `QUESTS` / `QUEST_STEPS`.
- **The long version:** `deploy.html` is plain HTML with the same header and components.
  Its stuck entries are `<details class="stuck-item">` on the page itself.
- **Gallery:** `gallery.html` polls `/api/gallery` every 8 seconds. The line at the top is in the HTML.

## Starters

`skills/` holds the five starters, one `SKILL.md` each (the GSB voice starter is downloaded as is, with only `[name]` filled). The site serves them as
they are. The form fills only the lines inside `## Make it yours` (version,
samples, words, sign-off, never say; or photo, sites I like, accent, font pair,
three words, never do), plus every `[name]` anywhere in the file (the "Hi, I'm [name]" line in
the design starters) with the signed-in name. Everything else from the first
heading after Make it yours on is copied byte for byte, and `npm run test-zip`
checks that. It also checks that the copy of `voice/SKILL.md` embedded in
`index.html` matches the file: when you change the voice starter, paste the new
text into the `<script type="text/plain" id="skill-voice">` block too.

If the canonical starters live somewhere else (Mary's workshop folder), keep the
two in sync:

```bash
npm run sync-skills -- /path/to/starters && npm run check-skills -- /path/to/starters && npm run test-zip
```

Step 2's anatomy visual reads the embedded copy of `voice/SKILL.md` (and falls
back to fetching the file), so it updates as long as the `## ` headings keep their
names (Make it yours, Locked, Never, Check before you finish).

## Limits

Same caps as Workshops 1 and 2, in `lib/store.js`: 300 students per room, 60-character
names, 120-character emails, 2,000-character feedback comments (the Finish box
caps at 300), 30-day retention.
