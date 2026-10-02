const assert = require("node:assert/strict");
const { test } = require("node:test");
const { reserveBatch } = require("../src/reservation");

const now = Date.parse("2026-10-02T00:00:00.000Z");

function createShelter(overrides = {}) {
  return { id: "shelter-1", verified: true, ...overrides };
}

function createBatch(overrides = {}) {
  return {
    id: "batch-1",
    status: "Available",
    expiryAt: new Date(now + 60_000).toISOString(),
    ...overrides,
  };
}

test("reserves an available, unexpired batch for a verified shelter", () => {
  const batch = createBatch();

  const result = reserveBatch(createShelter(), batch, now);

  assert.equal(result.success, true);
  assert.equal(batch.status, "Reserved");
  assert.equal(result.batch, batch);
});

test("rejects an unverified shelter without changing the batch", () => {
  const batch = createBatch();

  const result = reserveBatch(createShelter({ verified: false }), batch, now);

  assert.deepEqual(result, { success: false, reason: "shelter_not_verified" });
  assert.equal(batch.status, "Available");
});

test("rejects a batch that is not available", () => {
  const batch = createBatch({ status: "Reserved" });

  const result = reserveBatch(createShelter(), batch, now);

  assert.deepEqual(result, { success: false, reason: "batch_not_available" });
});

test("rejects an expired batch", () => {
  const batch = createBatch({ expiryAt: new Date(now).toISOString() });

  const result = reserveBatch(createShelter(), batch, now);

  assert.deepEqual(result, { success: false, reason: "batch_expired" });
  assert.equal(batch.status, "Available");
});

test("rejects an invalid expiry timestamp", () => {
  const batch = createBatch({ expiryAt: "not-a-date" });

  const result = reserveBatch(createShelter(), batch, now);

  assert.deepEqual(result, { success: false, reason: "invalid_expiry" });
  assert.equal(batch.status, "Available");
});

test("allows only one shelter to reserve the same batch", () => {
  const batch = createBatch();

  const firstResult = reserveBatch(createShelter({ id: "shelter-1" }), batch, now);
  const secondResult = reserveBatch(createShelter({ id: "shelter-2" }), batch, now);

  assert.equal(firstResult.success, true);
  assert.deepEqual(secondResult, { success: false, reason: "batch_not_available" });
  assert.equal(batch.status, "Reserved");
});
