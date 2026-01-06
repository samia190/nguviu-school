Deployment notes for Admin Dashboard and file storage

Required environment variables (backend):

- `MONGO_URI` - MongoDB connection string (Atlas preferred in production).
- `JWT_SECRET` - secret for signing auth tokens.
- `PUBLIC_ORIGIN` - optional, e.g. https://your-frontend.netlify.app (used to build absolute download URLs for local files).
- `S3_BUCKET` - (optional) if set, file uploads will be stored in this S3 bucket. If omitted, uploads are saved to `public/uploads` on the server.
- `AWS_REGION` - required when `S3_BUCKET` is set (e.g. `us-east-1`).
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS credentials with putObject permissions (if using S3).
- `S3_BASE_URL` - optional custom base URL for S3 (e.g. CloudFront). If omitted, AWS S3 default URL is used.
- `S3_PUBLIC` - optional; set to `false` to avoid setting public-read ACL on S3 objects.

Install additional dependency (backend):

```bash
cd nguviu-backend
npm install @aws-sdk/client-s3
```

Local dev notes:

- By default the backend will save uploads to `public/uploads` and serve them via `/uploads`.
- To enable durable cloud storage (recommended for Netlify + Render), configure the S3 variables above and redeploy.

Deploying frontend to Netlify and backend to Render:

- Frontend (Netlify):
  - Configure a site on Netlify that builds `nguviu-frontend` (Vite). Set `VITE_API_URL` or `VITE_API_ORIGIN` to your Render backend URL.
  - Ensure Netlify has environment variables for any runtime needs (e.g., `VITE_API_URL`).

- Backend (Render):
  - Create a Web Service on Render pointing to `nguviu-backend`.
  - Set environment variables listed above on the Render dashboard.
  - If using S3, ensure Render has network access to S3 and credentials are set.

Important compatibility notes:

- When S3 is enabled, uploaded file `url` fields will be absolute S3 URLs and the frontend will use those directly.
- When S3 is not configured, uploaded files are stored on the Render instance (ephemeral). For reliability, enable S3 in production.
