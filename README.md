# Learn Nova Frontend

Student learning portal for the Learn Nova personalized-learning platform.

## Features

- Student registration and login
- Secure session cookie handling
- Quiz discovery and submission
- Score, topic analysis, recommendations, and attempt history
- Student dashboard backed by the deployed FastAPI service

## Backend

The frontend connects to:

`https://learn-nova-backend.onrender.com`

API documentation:

`https://learn-nova-backend.onrender.com/docs`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Import this repository into Vercel. The project uses the standard Next.js build settings, so no custom build command is required.
