# Settld Test

This project is a minimal front-end for tracking crypto deposits with Settld.

## Deploying to Vercel

The included `vercel.json` config serves the `public` directory as a static site. After installing the [Vercel CLI](https://vercel.com/cli), you can deploy with:

```bash
vercel --prod
```

## Countdown

When a deposit request is created, a QR code and payment link are shown. A countdown starts at 300 seconds to match Vercel's serverless function time limit. If time expires before the deposit is received, the request is cancelled.
