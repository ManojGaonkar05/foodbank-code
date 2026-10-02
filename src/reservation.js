function reserveBatch(shelter, batch, now = Date.now()) {
  if (!shelter || shelter.verified !== true) {
    return { success: false, reason: "shelter_not_verified" };
  }

  if (!batch || batch.status !== "Available") {
    return { success: false, reason: "batch_not_available" };
  }

  const expiryTimestamp =
    typeof batch.expiryAt === "string" ? Date.parse(batch.expiryAt) : NaN;
  if (!Number.isFinite(expiryTimestamp)) {
    return { success: false, reason: "invalid_expiry" };
  }

  if (expiryTimestamp <= now) {
    return { success: false, reason: "batch_expired" };
  }

  batch.status = "Reserved";
  return { success: true, batch };
}

module.exports = { reserveBatch };
