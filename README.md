# KoboRide

Pickup and drop-off in Yaba. Cash to the rider.

```bash
cp .env.example .env.local
npm run dev
```

API: `http://localhost:3001` (koboride-be). Sign in with a phone number.

Customers book at `/`. Riders sign in at `/rider` and accept waiting jobs. Ops signs in at `/admin`.

Web Push: set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the same public key as the API (`VAPID_PUBLIC_KEY`). Customers and riders enable it from Account / Profile. Add to Home Screen is offered in the app (required for iPhone alerts). Polling is unchanged.
