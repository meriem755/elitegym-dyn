import 'dotenv/config';
import { createServer } from "http";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { setupWss } from "./lib/ws.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
setupWss(server);

server.listen(port, '0.0.0.0', () => {
  logger.info({ port }, "Server listening");
});
