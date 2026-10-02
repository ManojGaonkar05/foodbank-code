const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { expireAvailableBatches, startExpiryJob } = require("../src/expiryJob");

const now = Date.parse("2026-10-02T00:00:00.000Z");
const stopJobs = [];

afterEach(() => {
  while (stopJobs.length > 0) {
    stopJobs.pop()();
  }
});

test("expires available batches whose expiry time has passed", () => {
  const batches = [
    { status: "Available", expiryAt: new Date(now - 1).toISOString() },
    { status: "Available", expiryAt: new Date(now).toISOString() },
    { status: "Available", expiryAt: new Date(now + 1).toISOString() },
    { status: "Reserved", expiryAt: new Date(now - 1).toISOString() },
    { status: "Expired", expiryAt: new Date(now - 1).toISOString() },
    { status: "Available", expiryAt: "invalid date" },
  ];

  const expiredCount = expireAvailableBatches(batches, now);

  assert.equal(expiredCount, 2);
  assert.deepEqual(
    batches.map((batch) => batch.status),
    ["Expired", "Expired", "Available", "Reserved", "Expired", "Available"],
  );
});

test("runs expiry checks on a schedule and can be stopped", async () => {
  const batch = {
    status: "Available",
    expiryAt: new Date(Date.now() - 1).toISOString(),
  };
  const stop = startExpiryJob([batch], 5);
  stopJobs.push(stop);

  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(batch.status, "Expired");
});

test("rejects invalid batch collections and intervals", () => {
  assert.throws(() => expireAvailableBatches(null), TypeError);
  assert.throws(() => expireAvailableBatches([], NaN), TypeError);
  assert.throws(() => startExpiryJob(null), TypeError);
  assert.throws(() => startExpiryJob([], 0), TypeError);
});
