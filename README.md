# Delivery Hub

Delivery Hub is a stakeholder workspace for the Maharashtra EdTech and Bahrain VLTD accounts. It centralizes meeting minutes, action items, feature delivery and defects.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `NEXT_PUBLIC_API_URL`.
2. Start PostgreSQL: `docker compose up -d db`.
3. API: `cd backend; python -m venv .venv; .venv\\Scripts\\activate; pip install -r requirements.txt; uvicorn app.main:app --reload`.
4. Web app: `cd frontend; npm install; npm run dev`.

Open `http://localhost:3000`. The API docs are at `http://localhost:8000/docs`.

The API creates only the two client accounts (Finkomm and HHP) on first run. Meetings, action items, features and bugs start empty, ready for your real data. The MVP has no authentication gate yet; add JWT authentication before exposing it outside your organization.

## Cloudflare deployment

The production path uses Docker containers behind a remotely managed Cloudflare Tunnel. Cloudflare recommends the token-based Docker connector for remotely managed tunnels.

1. Create a tunnel in Cloudflare Zero Trust and add public hostnames:
   - `app.example.com` → `http://frontend:3000`
   - `api.example.com` → `http://backend:8000`
2. Copy `.env.example` to `.env` and set a strong `DELIVERY_HUB_JWT_SECRET`, the two real hostnames in `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL`, and the tunnel token.
3. Start the production stack with `docker compose --profile cloudflare up -d --build`.
4. Verify the API through `https://api.example.com/health`, then open `https://app.example.com`.

The API is not published through Docker ports in production; only `cloudflared` reaches the `frontend` and `backend` services. Keep the tunnel token and JWT secret out of source control.
