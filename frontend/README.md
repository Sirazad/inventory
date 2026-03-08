# Inventory Frontend

React 18 / TypeScript frontend for the Inventory Manager application.

## Development

```bash
npm install
npm start
```

The dev server runs on `http://localhost:3000`. API requests to `/api` are proxied to `http://localhost:8080` via the `proxy` field in `package.json`, so the backend must be running locally on port 8080.

## Production build

```bash
npm run build
```

Outputs a static bundle to `build/`. In production the app is served by nginx (see `Dockerfile` and `nginx.conf`), which proxies `/api` requests to the `backend` Docker service on port 8080.

## API URL configuration

The API base URL is resolved in the following order of priority:

| Method | Value | When to use |
|---|---|---|
| `REACT_APP_API_URL` env var | e.g. `https://api.example.com/api` | Custom / hosted deployments |
| Default (no env var set) | `/api` (relative) | Local dev (`npm start`) and Docker |

Set the variable at build time:

```bash
REACT_APP_API_URL=https://api.example.com/api npm run build
```

The variable must be prefixed with `REACT_APP_` to be picked up by Create React App. It is baked into the static bundle at build time, not resolved at runtime.

## Docker

```bash
# From the repo root
docker compose up -d        # create and start all containers
docker compose stop         # stop without destroying containers
docker compose start        # restart stopped containers
docker compose down         # stop and destroy containers
```

Note: `docker compose start` only works if containers were previously created with `up`. Use `up -d` when running for the first time or after a `down`.
