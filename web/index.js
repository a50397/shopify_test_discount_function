// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { GraphqlQueryError } from '@shopify/shopify-api';

import {
  CREATE_CODE_MUTATION,
  UPDATE_CODE_MUTATION,
  CREATE_AUTOMATIC_MUTATION,
  UPDATE_AUTOMATIC_MUTATION,
  QUERY_FUNCTION_DISCOUNTS
} from "./graphql/index.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// Endpoint to create code-based discounts
app.post("/api/discounts/code", async (req, res) => {
  await runDiscountMutation(req, res, CREATE_CODE_MUTATION);
});
// Endpoint to update code-based discounts
app.post("/api/discounts/code/*", async (req, res) => {
  const id = 'gid://' + req.params[0];
  await runDiscountMutation(req, res, UPDATE_CODE_MUTATION, id);
});
// Endpoint to create automatic discounts
app.post("/api/discounts/automatic", async (req, res) => {
  await runDiscountMutation(req, res, CREATE_AUTOMATIC_MUTATION);
});
// Endpoint to update automatic discounts
app.post("/api/discounts/automatic/*", async (req, res) => {
  const id = 'gid://' + req.params[0];
  await runDiscountMutation(req, res, UPDATE_AUTOMATIC_MUTATION, id);
});
// Endpoint to query discount details
app.post("/api/discounts/details/:id", async (req, res) => {
  var node_id = 'gid://shopify/DiscountCodeNode/' + req.params.id;
  var details = await runDiscountQuery(req, res, QUERY_FUNCTION_DISCOUNTS, node_id);
  if (!details?.data?.discountNode?.discount?.title) {
    node_id = 'gid://shopify/DiscountAutomaticNode/' + req.params.id;
    details = await runDiscountQuery(req, res, QUERY_FUNCTION_DISCOUNTS, node_id);
  }
  res.send(details?.data?.discountNode || {});
});

const runDiscountQuery = async (req, res, query, id) => {
  const graphqlClient = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const variables = id ? {
    id,
    ...req.body
  } : req.body;

  try {
    const data = await graphqlClient.query({
      data: {
        query: query,
        variables,
      },
    });

    return data.body;
  } catch (error) {
    // Handle errors thrown by the GraphQL client
    if (!(error instanceof GraphqlQueryError)) {
      throw error;
    }
    return res.status(500).send({ error: error.response });
  }
};

const runDiscountMutation = async (req, res, mutation, id) => {
  const graphqlClient = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const variables = id ? {
    id,
    ...req.body
  } : req.body;

  try {
    const data = await graphqlClient.query({
      data: {
        query: mutation,
        variables,
      },
    });

    res.send(data.body);
  } catch (error) {
    // Handle errors thrown by the GraphQL client
    if (!(error instanceof GraphqlQueryError)) {
      throw error;
    }
    return res.status(500).send({ error: error.response });
  }
};

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.get("/api/products/details/:id", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
