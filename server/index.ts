import * as Sentry from "@sentry/node";
import { createApp } from "./app.js";
import { config } from "./config.js";

if (config.sentryDsn) {
  Sentry.init({ dsn: config.sentryDsn, tracesSampleRate: 1 });
}

const app = createApp();
app.listen(config.port, config.host, () => {
  console.log(`AccessPath API listening on http://${config.host}:${config.port}`);
});
