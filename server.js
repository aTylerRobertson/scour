const path = require("path");
const utils = require("./utils.js");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
  root: "./src/pages",
  includeViewExtension: true,
  options: {
    partials: {
      header: "header.hbs",
      footer: "footer.hbs",
    },
    helpers: {
      raw: (options) => {
        return options.fn();
      },
    },
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// The index/search page
fastify.all("/", (request, reply) => {
  let params = { seo };

  if (request.query?.q || request.body?.query) {
    params.query = request.query?.q || request.body?.query;
    try {
      const results = utils.search(params.query);
      params.results = results.results;
      params.message = results.results > 0 ? `found ${
        results.full
          ? `${results.full} full match${results.full == 1 ? "" : "es"}`
          : ``
      } ${
        results.partial
          ? `${results.full ? "and " : ""}${results.partial} partial match${
              results.partial == 1 ? "" : "es"
            }`
          : ``
      } for "${params.query}"` : `Nothing found for "${params.query}", sorry!`;
      return reply.view("search", params);
    } catch (err) {
      params.message = err;
    }
  }

  const allItems = utils.getItems();
  params.latest = allItems.slice(-3);

  return reply.view("index", params);
});

// View cached content for one item
fastify.get("/cache/:guid", (request, reply) => {
  const item = utils.getItems(request.params.guid)[0];
  if (item) {
    reply.view("cache", { seo, item });
  } else {
    reply.redirect("/");
  }
});

// Add a new page to your collection
fastify.get("/new", (request, reply) => {
  reply.view("new", {
    title: request.query.title || "",
    guid: request.query.title
      ? request.query.title.toLowerCase().replace(/ /g, "-")
      : "",
    source: request.query.source || "",
    key: request.query.key || "",
    seo,
  });
});

fastify.post("/new", async (request, reply) => {
  if (request.body.key !== process.env.key)
    reply.view("new", { seo, message: "🙅🏻‍♂️ you're not allowed to do that!" });

  try {
    await utils.addToItems(
      request.body.title,
      request.body.guid.toLowerCase(),
      request.body.source,
      request.body.key
    );
  } catch (err) {
    await reply.view("new", { seo, ...request.body, message: err });
  }

  await reply.view("close-window");
});

// Get the RSS feed of all your logged pages
fastify.get("/rss", (request, reply) => {
  const items = utils.getItems();
  reply.type("application/xml");
  reply.view("rss", { seo, items });
});

// An about page
fastify.get("/about", (request, reply) => {
  reply.view("about", { seo });
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
