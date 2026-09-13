# Replit setup

## Run the app

The `Start application` workflow builds the Vite frontend and starts the Express server on port 5000:

```bash
npm run build && PORT=5000 npm run dev:server
```

The server serves the generated `dist` folder and exposes the document API under `/api`.

## Development commands

```bash
npm test
npm run build
```

The app uses the `DATABASE_URL` environment variable for Neon PostgreSQL persistence. It also keeps a browser `localStorage` fallback when the API is unavailable.