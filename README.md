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
SUPABASE_SECRET_KEY=your_server_only_secret_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AWS_REGION=your_bucket_region
AWS_S3_BUCKET=your_private_bucket_name
```

In Supabase, enable the Email provider and add `http://localhost:3000/auth/callback` to the Auth redirect URL allow list. For a deployed app, set `NEXT_PUBLIC_SITE_URL` to its origin and allow list `<your-origin>/auth/callback` as well. Email confirmation is controlled by the Supabase project's Auth settings.

Unauthenticated visitors are sent to `/auth/login`. Successful sign-in, auto-confirmed sign-up, and confirmed email links redirect to the protected home page at `/`.

## Roles and Database

Link the Supabase CLI to the project, apply `supabase/migrations/20260926142051_job_marketplace_and_private_cvs.sql` with `supabase db push`, and run `supabase test db` against a local Supabase stack. The sample job rows are marked as sample listings.

New sign-ups are applicants by default. To grant recruiter access, set the user's trusted `app_metadata` to `{"role":"admin"}` in Supabase. Do not use `user_metadata` for authorization; users can edit it themselves. The database policies and recruiter routes both verify the signed `app_metadata` claim. Keep `SUPABASE_SECRET_KEY` server-only; it is used only after the user's session and uploaded S3 objects have been validated.

## Learn More

For the framework, see the [Next.js documentation](https://nextjs.org/docs).

## Private CV Storage

Create an S3 bucket with Block Public Access enabled and default encryption on. The app uploads PDFs (maximum 10 MB) and generated PNG first-page snapshots using five-minute presigned PUT URLs. Recruiter previews and downloads use separate 60-second signed URLs. Keep `AWS_REGION` and `AWS_S3_BUCKET` server-only; never add an AWS variable with the `NEXT_PUBLIC_` prefix. For local development, use the AWS SDK's default credential chain (for example, an AWS profile); in deployment, prefer an instance/task role over long-lived access keys.

Allow browser PUTs from the app origins in the bucket's CORS configuration:

```json
[
	{
		"AllowedOrigins": ["http://localhost:3000", "https://your-app.example.com"],
		"AllowedMethods": ["PUT"],
		"AllowedHeaders": ["content-type"],
		"MaxAgeSeconds": 300
	}
]
```

Grant the app's AWS identity only `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` for this bucket's objects. Do not make the bucket public. Uploaded CV metadata is stored in Supabase; the PDF and its preview image remain in S3.

