# Settld Test

This project is a minimal front-end for tracking crypto deposits with Settld.

## Deploying to Vercel

The included `vercel.json` config serves the `public` directory as a static site. After installing the [Vercel CLI](https://vercel.com/cli), you can deploy with:

```bash
vercel --prod
```

## Running locally

Start the development server. The `prestart` script installs dependencies and
builds static assets automatically:

```bash
npm start
```

To build the assets without starting the server, run:

```bash
npm run build
```

This serves the `public` directory and exposes the API routes (`/config`, `/callback`, `/events`). By default the server listens on `http://localhost:3000`, but you can set a different `PORT` in your `.env` file when running on your own server. The port setting is ignored on Vercel deployments.

## Configuration

The page loads `/config.js` to determine API settings. The browser sends
`POST /wallet/request` to the app server without needing to supply an
authorization token. The server includes its configured bearer token in the
`Authorization` header when forwarding the request to the Settld API. On Vercel
the serverless function exposes the following environment variables:

- `SETTLD_API_BASE_URL` – base URL of the Settld API
- `SETTLD_API_AUTH_TOKEN` – bearer token used when requesting wallets
- `SETTLD_ETHERSCAN_TX_URL` (optional) – base URL for viewing transactions
  on a block explorer

Set these variables in your Vercel project so the server can reach the Settld
API. The server relays all API responses and callbacks back to the browser,
avoiding CORS or mixed-content errors.

## Countdown

When a deposit request is created, a QR code and payment link are shown. A countdown starts at 300 seconds to match Vercel's serverless function time limit. If time expires before the deposit is received, the request is cancelled.
