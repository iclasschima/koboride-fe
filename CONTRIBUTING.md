# Branches

| Branch | Environment | Host |
| ------ | ----------- | ---- |
| `develop` | Shared staging | separate frontend service pointing at the staging API |
| `main` | Production | `https://www.koboride.ng` |

Day-to-day work lands on **`develop`**. Open PRs into `develop`. Promote a release with a PR from `develop` → `main`.

Keep this repo in lockstep with `koboride-be`: the same branch name on both sides is one environment. Never point staging at the production API.

## Staging service

1. Create a second frontend project/service from this repo, branch **`develop`**.
2. Environment:

| Name | Value |
| ---- | ----- |
| `NEXT_PUBLIC_API_URL` | Staging API origin, e.g. `https://koboride-be-dev.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same public key as the **staging** API `VAPID_PUBLIC_KEY` |

3. Put that frontend origin in the staging API `CORS_ORIGIN`.
4. Deploy the API `develop` branch first (see `koboride-be/CONTRIBUTING.md`), then this frontend.
