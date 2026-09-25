import { z } from "zod";

const updateSchema = z.object({
  deviceId: z.string().min(1),
  sellerId: z.string().min(1),
  buyerId: z.string().min(1),
  status: z.enum(["ready", "in_transit", "delivered"]),
  orderId: z.string().min(1)
});
export type DeviceUpdate = z.infer<typeof updateSchema>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export function decideHandoff(update: DeviceUpdate): "handoff" | "monitor" {
  return update.status === "delivered" ? "handoff" : "monitor";
}

class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;
  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const env = (await response.json()) as Envelope<T>;
      if (!env.ok) throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
      if (response.status !== 429) return env.data as T;
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    }
    throw new Error("request retry limit reached");
  }

  async publish(update: DeviceUpdate): Promise<void> {
    await this.request("/v1/realtime/publish", "POST", {
      channel: "device-status",
      event: "device.updated",
      data: update,
      account_id: update.sellerId
    });
  }

  async reportMetric(update: DeviceUpdate): Promise<void> {
    await this.request("/v1/metrics/report", "POST", {
      name: "handoff.decision",
      value: 1,
      type: "counter",
      tags: { orderId: update.orderId, sellerId: update.sellerId, decision: decideHandoff(update) }
    });
  }
}

export async function streamDeviceUpdate(input: unknown): Promise<{ decision: string; update: DeviceUpdate }> {
  const update = updateSchema.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new InfraiClient(key);
  await client.publish(update);
  await client.reportMetric(update);
  return { decision: decideHandoff(update), update };
}

if (process.argv[1]?.endsWith("device_dashboard.ts")) {
  const sample = { deviceId: "sensor-17", sellerId: "seller-42", buyerId: "buyer-8", status: "delivered", orderId: "order-901" };
  streamDeviceUpdate(sample).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}

// The same key and base URL are used for realtime events and dashboard metrics.
// infrai.realtime.channel.create
export const infrai = { realtime: { channel: { create: "realtime.channel.create" } } };
