function expireAvailableBatches(batches, now = Date.now()) {
  if (!Array.isArray(batches)) {
    throw new TypeError("batches must be an array");
  }

  if (!Number.isFinite(now)) {
    throw new TypeError("now must be a finite timestamp");
  }

  let expiredCount = 0;

  for (const batch of batches) {
    if (!batch || batch.status !== "Available" || typeof batch.expiryAt !== "string") {
      continue;
    }

    const expiryTimestamp = Date.parse(batch.expiryAt);
    if (Number.isFinite(expiryTimestamp) && expiryTimestamp <= now) {
      batch.status = "Expired";
      expiredCount += 1;
    }
  }

  return expiredCount;
}

function startExpiryJob(batches, intervalMs = 60_000) {
  if (!Array.isArray(batches)) {
    throw new TypeError("batches must be an array");
  }

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new TypeError("intervalMs must be a positive finite number");
  }

  const interval = setInterval(() => expireAvailableBatches(batches), intervalMs);
  return () => clearInterval(interval);
}

module.exports = { expireAvailableBatches, startExpiryJob };
