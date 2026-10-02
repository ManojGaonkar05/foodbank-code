const express = require("express");
const { randomUUID } = require("node:crypto");

function rejectUnauthenticated(_req, res) {
  return res.status(401).json({ error: "Authentication required" });
}

function requireVerifiedDonor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "donor" || req.user.verified !== true) {
    return res.status(403).json({ error: "A verified donor account is required" });
  }

  return next();
}

function createApp({ authenticate = rejectUnauthenticated } = {}) {
  const app = express();

  app.use(express.json());
  app.post("/api/batches", authenticate, requireVerifiedDonor, (req, res) => {
    const { name, quantity, expiryAt, dietaryTags } = req.body ?? {};

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }

    const expiryTimestamp = typeof expiryAt === "string" ? Date.parse(expiryAt) : NaN;
    if (!Number.isFinite(expiryTimestamp)) {
      return res.status(400).json({ error: "A valid expiryAt is required" });
    }

    if (expiryTimestamp <= Date.now()) {
      return res.status(400).json({ error: "expiryAt must be in the future" });
    }

    if (
      !Array.isArray(dietaryTags) ||
      dietaryTags.length === 0 ||
      dietaryTags.some((tag) => typeof tag !== "string" || tag.trim() === "")
    ) {
      return res.status(400).json({ error: "At least one dietary tag is required" });
    }

    return res.status(201).json({
      batch: {
        id: randomUUID(),
        donorId: req.user.id,
        name: name.trim(),
        quantity,
        expiryAt: new Date(expiryTimestamp).toISOString(),
        dietaryTags: dietaryTags.map((tag) => tag.trim()),
      },
    });
  });

  return app;
}

module.exports = { createApp };
