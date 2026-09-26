## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set these variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In Supabase, enable the Email provider and add `http://localhost:3000/auth/callback` to the Auth redirect URL allow list. For a deployed app, set `NEXT_PUBLIC_SITE_URL` to its origin and allow list `<your-origin>/auth/callback` as well. Email confirmation is controlled by the Supabase project's Auth settings.

Unauthenticated visitors are sent to `/auth/login`. Successful sign-in, auto-confirmed sign-up, and confirmed email links redirect to the protected home page at `/`.

## Learn More

For the framework, see the [Next.js documentation](https://nextjs.org/docs).

## CV Uploads

CV file uploads to AWS are a separate integration and are not included in the authentication flow.

