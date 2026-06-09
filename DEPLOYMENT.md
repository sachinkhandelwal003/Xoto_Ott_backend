# Deployment Guide

## Deploying API Server to Vercel

1. **Set up MongoDB Atlas**:
   - Create a free account at https://www.mongodb.com/atlas
   - Create a new cluster and database user
   - Get your connection string (should look like `mongodb+srv://user:password@cluster0...`)

2. **Set up Redis (Optional but Recommended)**:
   - Use Vercel KV: https://vercel.com/docs/storage/vercel-kv
   - Or Upstash: https://upstash.com/

3. **Deploy API Server to Vercel**:
   - Go to https://vercel.com/new
   - Import your project
   - Set the root directory to `api-server`
   - Add the following environment variables:
     - `JWT_SECRET`: A strong random secret (generate one at https://jwtsecret.com)
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `REDIS_URL`: Your Redis connection string (from Vercel KV or Upstash)
   - Deploy!

## Deploying Admin Panel to Vercel

1. **Deploy Admin Panel to Vercel**:
   - Go to https://vercel.com/new (or use the same project if you want)
   - Import your project, set root directory to `admin-panel`
   - Add environment variable `VITE_API_URL`: The URL of your deployed API server (without trailing slash, e.g., `https://your-api.vercel.app`)
   - Deploy!

## API Endpoints

Once deployed, your API will be available at `https://[your-api-domain].vercel.app/api/`

Example endpoints:
- `POST /api/auth/login` - Admin login
- `GET /api/users` - List users
- `GET /api/categories` - List categories
- `GET /api/banners` - List banners
- `GET /api/pages` - List pages (Privacy Policy, Terms, About Us)

## Admin Credentials
- Email: `admin@streamvault.com`
- Password: `admin123`

You can change these in the API server's seed data or via the admin panel after logging in!
