# KoboRide

Pickup & drop-off in Yaba only. ₦1,500 flat. Cash to the rider. Admin assigns the job.

```bash
cp .env.example .env.local
npm run dev
```

API: `http://localhost:3001` (koboride-be). OTP is skipped in development; sign in with a phone number only.

Address search uses Google Places via the API (`GOOGLE_PLACES_API_KEY` on the backend). Places outside Yaba cannot be selected.

Then `/admin/orders` → assign a rider → rider taps status → customer confirms delivered.
