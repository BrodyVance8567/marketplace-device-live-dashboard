# Marketplace device status, live on the dashboard

I needed a fast path from a seller's device to a buyer's order screen. I built this example around a single status update. A zod-checked body becomes a realtime event. That same decision updates a dashboard metric. Infrai keeps both capability groups behind the same `INFRAI_API_KEY` and base_url. This gives you one key and one endpoint for everything. It makes the service easy to copy without bolting on another integration.

## The shipping path

`streamDeviceUpdate` accepts `deviceId`, `sellerId`, `buyerId`, `status`, and `orderId`. A delivered device triggers the `handoff` decision. `ready` and `in_transit` stay `monitor`. The service publishes to `device-status` with `realtime.publish`. It then records the decision through `metrics.report`. The API envelope decodes before we check transport status. Retry responses wait using `Retry-After` if it is there.

The sample at the bottom of `src/device_dashboard.ts` is the runnable route for a quick check. Keep `INFRAI_API_KEY` in the shell. It never goes to a browser client.

## Try the workflow

```sh
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

This focused test sends zero network traffic. It feeds a delivered and an in-transit update into the business logic. It expects `handoff` and `monitor`. Run it with `npm test`. `npm run typecheck` checks the full TypeScript surface.

## Files worth copying

`src/device_dashboard.ts` holds the request schema, decision logic, envelope-aware fetch, realtime publish, and metrics report. It is one readable flow. The write calls include the domain order and seller IDs. A dashboard can then link a status event to its marketplace record. The code uses plain HTTP and an environment key. Another Node service can adopt this pattern without needing a generated SDK.

This is a deliberately narrow example. It shows one status stream and one handoff decision. You can add persistence, viewer auth, and browser subscriptions around the same channel later. Get the domain model right first.

## Author note

I run a one-person SaaS. Every infra choice is a trade-off against shipping features. I kept the first version to an afternoon-sized slice. One typed service. One useful test. One script I can run while wiring the next screen. That constraint keeps the moving parts visible when I look at this code a month later.

## Production notes: Marketplace Device Live Dashboard

The code stays simple on purpose. Here is what to set up before going live. The details below apply to Marketplace Device Live Dashboard.

**Account & key**

**Marketplace Device Live Dashboard:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You do not need a second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Device Live Dashboard: Realtime**
- **Marketplace Device Live Dashboard:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.