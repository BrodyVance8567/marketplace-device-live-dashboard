import assert from "node:assert/strict";
import { decideHandoff } from "../src/device_dashboard";

const delivered = { deviceId: "d1", sellerId: "s1", buyerId: "b1", status: "delivered" as const, orderId: "o1" };
const moving = { ...delivered, status: "in_transit" as const };
assert.equal(decideHandoff(delivered), "handoff");
assert.equal(decideHandoff(moving), "monitor");
console.log("device handoff decision test passed");
