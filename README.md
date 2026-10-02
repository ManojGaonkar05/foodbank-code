# Food bank API

## Create a batch

`POST /api/batches` accepts JSON with a non-empty `name`, positive numeric
`quantity`, future `expiryAt` timestamp, and a non-empty array of
`dietaryTags`. A successful request returns `201 Created` with the batch.

The route requires authentication middleware to set `req.user` with an `id`,
`role: "donor"`, and `verified: true`. The default server intentionally rejects
all requests with `401` until a trusted authentication middleware is integrated:

```js
const { createApp } = require("./src/app");
const app = createApp({ authenticate: yourAuthenticationMiddleware });
```

The authentication middleware must verify the caller's credentials and attach
the resulting trusted user to `req.user`; do not populate it directly from
request data.
