import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";

const app = express();

// Security: Disable X-Powered-By header to prevent server technology exposure
app.disable('x-powered-by');

// Extend IncomingMessage to include rawBody
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Middleware: parse JSON and URL-encoded payloads
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Logging middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database connection with retry logic
  const dbConnected = await initializeDatabase();
  if (!dbConnected) {
    console.error('[Server] Warning: Database connection failed. API may be partially functional.');
  } else {
    log('[DB] Successfully connected to the database');
  }

  // Register routes and return the server
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('[Server] Error:', err);
  });

  // Setup Vite in development, serve static assets in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = parseInt(process.env.PORT || '5001', 10);
  const host = process.env.HOST || 'localhost';
  server.listen(port, host, () => {
    log(`[Server] Serving on http://${host}:${port}`);
  });
})();
