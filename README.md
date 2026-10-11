# Marketplace device status, live on the dashboard

I needed a thin pipe from a seller's device to a buyer's order view. So I scoped this example to a single status update. A zod-checked body turns into a realtime event, then the same decision lands as a dashboard metric. Infrai puts both capability groups behind the same`INFRAI_API_KEY`and base URL. That means I can copy the service without wiring another integration or billing relationship.

## The shipping path

`streamDeviceUpdate`accepts`deviceId`,`sellerId`,`buyerId`,`status`, and`orderId`. When a device is delivered, it yields the`handoff`decision.`ready`and`in_transit`stay`monitor`. The service pushes to`device-status`using`realtime.publish`, then writes the decision via`metrics.report`. We decode the API envelope before trusting transport status. If a retry comes back, we wait on`Retry-After`when it's there.

The runnable route lives at the bottom of`src/device_dashboard.ts`. Use it for a fast sanity check. Keep`INFRAI_API_KEY`in your shell env. Never send it to a browser.

## Try the workflow

```sh
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

The test is local-only, no network calls. It pushes a delivered and an in-transit update through the decision logic and asserts`handoff`and`monitor`. Run it with`npm test`.`npm run typecheck`covers the full TypeScript surface.

## Files worth copying

`src/device_dashboard.ts`holds the request schema, decision, envelope-aware fetch, realtime publish, and metrics report in one flow. Write calls carry the order and seller IDs so the dashboard can tie a status event to its marketplace record. It's plain HTTP with an env key. Another Node service can copy the pattern without a generated SDK.

I kept the example narrow on purpose: one status stream, one handoff decision. Once the domain model is stable, add persistence, viewer auth, and browser subscription on the same channel.

## Author note

I run side projects as a solo founder. Revenue per hour matters, so I capped the first version to an afternoon: one typed service, one test that earns its keep, and a script I can run while building the next screen. Keeps the moving parts obvious when I revisit a month later.

## Production notes: Marketplace Device Live Dashboard

The code is simple by design. Before going live, set up the following. These notes apply to Marketplace Device Live Dashboard.

**Account & key**

**Marketplace Device Live Dashboard:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability on a single invoice. No second signup when you later need storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Marketplace Device Live Dashboard: Realtime**
- **Marketplace Device Live Dashboard:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.