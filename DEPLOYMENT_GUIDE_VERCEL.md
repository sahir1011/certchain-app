# Vercel Deployment Guide

To deploy the CertChain application on Vercel, you will be creating **two separate Vercel projects** linked to this same Git repository. This is the recommended and easiest method for Monorepos containing a front-end framework and a custom Express backend.

## Prerequisites
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Ensure you have accounts on Vercel and your Git provider.

---

## Part 1: Deploying the Backend
1. Go to your Vercel Dashboard and click **Add New... > Project**.
2. Import your Git repository.
3. In the "Configure Project" section:
   - **Project Name**: `certchain-backend` (or similar)
   - **Framework Preset**: `Other`
   - **Root Directory**: Click "Edit" and choose `backend`.
4. Open the **Environment Variables** section and add all variables from your `backend/.env` file:
   - `DATABASE_URL`
   - `PINATA_API_KEY`
   - `PINATA_API_SECRET`
   - `PRIVATE_KEY`
   - `RPC_URL` (e.g. Sepolia Alchemy/Infura URL)
   - `CONTRACT_ADDRESS`
   - `JWT_SECRET`
   - `FRONTEND_URL` = (You will fill this later, temporarily put `https://your-temp-frontend.vercel.app` or leave it empty if your CORS allows it).
5. Click **Deploy**. Vercel will automatically detect `vercel.json` inside the `backend` folder and deploy your Express App as Serverless Functions.
6. Once deployed, note down the generated URL (e.g., `https://certchain-backend.vercel.app`).

---

## Part 2: Deploying the Frontend
1. Go back to your Vercel Dashboard and click **Add New... > Project**.
2. Import the **same** Git repository again.
3. In the "Configure Project" section:
   - **Project Name**: `certchain-frontend`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click "Edit" and choose `frontend`.
4. Open the **Environment Variables** section and add:
   - `BACKEND_URL` = `https://certchain-backend.vercel.app` (The URL you got from deploying the backend)
   - *Any other frontend env vars if they exist (none exist currently).*
5. Click **Deploy**. Vercel will run `npm run build` inside the `frontend` directory and deploy your Next.js app.
6. Note down the Frontend URL (e.g., `https://certchain-frontend.vercel.app`).

---

## Part 3: Final Links and Environment Variables
1. Go back to your **Backend Project** on Vercel (`certchain-backend`).
2. Go to **Settings > Environment Variables**.
3. Add or update the variable `FRONTEND_URL` to be the actual URL of your deployed frontend (e.g., `https://certchain-frontend.vercel.app`).
4. Keep the trailing slash absent (e.g., `https://certchain-frontend.vercel.app` not `https://certchain-frontend.vercel.app/`).
5. **Redeploy** the backend going to Deployments > Redeploy. This will allow the frontend to bypass CORS when calling the backend API.

You are now fully deployed on Vercel!
    
