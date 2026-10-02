const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");
const { createApp } = require("../src/app");

let server;
let baseUrl;

function authenticateAs(user) {
  return (req, _res, next) => {
    req.user = user;
    next();
  };
}

async function postBatch(body, url = baseUrl) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      `${url}/api/batches`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          resolve({ status: response.statusCode, body: JSON.parse(responseBody) });
        });
      },
    );

    request.on("error", reject);
    request.end(JSON.stringify(body));
  });
}

before(async () => {
  server = http.createServer(createApp({ authenticate: authenticateAs({
    id: "donor-1",
    role: "donor",
    verified: true,
  }) }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("verified donor can create a batch", async () => {
  const response = await postBatch({
    name: "Apples",
    quantity: 12,
    expiryAt: new Date(Date.now() + 60_000).toISOString(),
    dietaryTags: ["vegan"],
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.batch.donorId, "donor-1");
  assert.deepEqual(response.body.batch.dietaryTags, ["vegan"]);
});

test("rejects an expiry time in the past", async () => {
  const response = await postBatch({
    name: "Apples",
    quantity: 12,
    expiryAt: new Date(Date.now() - 60_000).toISOString(),
    dietaryTags: ["vegan"],
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /future/);
});

test("rejects missing dietary tags", async () => {
  const response = await postBatch({
    name: "Apples",
    quantity: 12,
    expiryAt: new Date(Date.now() + 60_000).toISOString(),
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /dietary tag/);
});

test("rejects non-verified donors", async () => {
  const app = createApp({
    authenticate: authenticateAs({ id: "donor-2", role: "donor", verified: false }),
  });
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));

  try {
    const testUrl = `http://127.0.0.1:${testServer.address().port}`;
    const response = await postBatch({}, testUrl);
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }
});
