# UZAFO Portfolio Site

A polished multilingual portfolio frontend built with **Next.js App Router**, **Tailwind CSS**, **next-intl**, **Tiptap**, and **demo JSON data** that is intentionally structured to be easy to connect to a future **Python API + MongoDB** backend.

## Highlights

- Responsive UI across home, about, discussion, resume, portfolio, blog, auth, and admin pages
- Locale-aware routing with **Uzbek** and **English**
- Mock content stored in isolated JSON files under `src/data`
- Data-access layer in `src/lib/data.ts` so the UI does not depend directly on raw JSON
- Draggable floating AI chat widget
- Real in-page editing for blog posts, portfolio pages, discussions, and the English-only resume
- Custom 404 and global error handling
- Security headers configured in `next.config.ts`
- Sample PDF resume download included in `public/resume`

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- next-intl
- Tiptap
- Recharts
- Lucide icons
- Framer Motion

## Getting started

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

The locale proxy redirects `/` to the default locale route.

## Routes

- `/uz` or `/en`
- `/[locale]/about`
- `/[locale]/discussions`
- `/[locale]/discussions/[slug]`
- `/[locale]/resume`
- `/[locale]/portfolio`
- `/[locale]/blog`
- `/[locale]/blog/[slug]`
- `/[locale]/auth/sign-in`
- `/[locale]/auth/sign-up`
- `/[locale]/admin`

## Project structure

```txt
src/
  app/
    [locale]/
    api/
  components/
    about/
    blog/
    chat/
    discussions/
    editor/
    home/
    layout/
    ui/
  data/
  i18n/
  lib/
messages/
public/
```

## Mock data strategy

The current frontend uses files in `src/data/*.json`.

UI components do **not** read JSON directly. Instead, page code uses helpers from:

```txt
src/lib/data.ts
```

Later, these helpers can be replaced with API fetch functions such as:

- `getProjects()` -> fetch from `/api/projects`
- `getBlogPosts()` -> fetch from `/api/posts`
- `getDiscussions()` -> fetch from `/api/discussions`

This keeps the page and component layer stable.

## Future backend plan

Recommended backend stack for the next phase:

- Python + FastAPI
- MongoDB
- JWT / session-based auth
- Google OAuth
- Media upload service
- AI chat endpoint
- Discussion + comments + reactions APIs
- Admin write APIs for profile, resume, blog, and assets

## Notes

- Auth, comments, likes/dislikes, and editor persistence are currently frontend demo flows.
- The floating AI assistant uses local keyword matching for demo behavior.
- The included API routes are placeholder helpers:
  - `/api/health`
  - `/api/mock-summary`

## Security defaults included

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

## Environment template

See:

```txt
.env.example
```

Typical production values:

```env
NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_SITE_URL=https://uzafo.site
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

If you later point the frontend to `www.uzafo.site` or another subdomain, update `NEXT_PUBLIC_SITE_URL` to that exact public URL.

## Resume PDF

Sample file location:

```txt
public/resume/uzafo-resume-demo.pdf
```


## Demo admin editing
- `/admin` is now a control room that opens the exact live page you want to edit.
- Blog posts, portfolio projects, discussions, and the English-only resume are edited directly on their real pages.
- Demo persistence uses browser localStorage with versioned keys, making it easy to replace with backend repository calls later.

## Admin auth
- Admin access should come only from the backend auth flow.
- Do not place admin credentials in `NEXT_PUBLIC_*` environment variables.
- Configure admin login only in the backend environment with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
