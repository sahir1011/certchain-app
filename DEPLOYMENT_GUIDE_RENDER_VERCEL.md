# Render & Vercel Deployment Guide

This guide covers deploying the **Backend to Render** and the **Frontend to Vercel**.

## Part 1: Deploying the Backend on Render
Render is excellent for hosting Express/Node.js applications and PostgreSQL databases.

### Method A: Using the Blueprint (Easiest)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Render](https://render.com/).
3. Click on the **New** button and select **Blueprint**.
4. Connect your Git repository.
5. Render will detect the `render.yaml` file in the root of the repository.
6. Click **Apply**.
7. Go to your newly created **certchain-backend** Web Service on the dashboard.
8. Go to **Environment** and fill in the values for all the environment variables (e.g., `DATABASE_URL`, `PINATA_API_KEY`, `PRIVATE_KEY`, etc.).
   *Note: For `FRONTEND_URL`, leave it blank or put a placeholder for now.*
9. Restart the service if necessary. Note the backend URL (e.g., `https://certchain-backend-xxxxx.onrender.com`).

### Method B: Manual Setup
1. On Render, click **New > Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `certchain-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Expand **Advanced** and add your environment variables (`DATABASE_URL`, `PINATA_API_KEY`, etc.).
5. Click **Create Web Service**. Let it build and deploy.

---

## Part 2: Deploying the Frontend on Vercel
Vercel is the best platform for Next.js applications.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Import the same Git repository.
4. In the "Configure Project" section:
   - **Project Name**: `certchain-frontend`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click "Edit" and choose `frontend`.
5. Open the **Environment Variables** section and add:
   - `BACKEND_URL` = `https://certchain-backend-xxxxx.onrender.com` (The exact Render URL of your backend from Part 1. *Do not include a trailing slash*).
6. Click **Deploy**. Vercel will install dependencies and build your Next.js app.
7. Note down the Frontend URL (e.g., `https://certchain-frontend-xxxxx.vercel.app`).

---

## Part 3: Final Configuration (Connecting them)
Now that your frontend is deployed, we need to tell the backend to allow requests from the frontend's URL (CORS).

1. Go back to your **Backend Service** on Render.
2. Go to **Environment**.
3. Update the `FRONTEND_URL` variable to be your deployed Vercel frontend URL (e.g., `https://certchain-frontend-xxxxx.vercel.app`).
4. Click **Save Changes**. Render will automatically redeploy the backend with the new environment variables.

### Success! 🎉
Your backend runs on Render, your frontend runs on Vercel, and they are fully connected!
