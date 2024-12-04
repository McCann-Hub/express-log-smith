# Express Log Smith

Express Log Smith is a middleware library for Express.js designed to enhance logging and request tracing.
It simplifies request/response observability by integrating structured logging and unique identifiers like
`correlationId`, `traceId`, and `spanId` into your application.

## Features

- **Request ID Middleware**: Automatically assigns correlationId, traceId, and spanId to each request.
- **Contextual Logger**: Attaches a logger with enriched metadata to the request object for consistent, contextual logging.
- **Request Logger**: Logs structured details of incoming requests and outgoing responses.
- **Customizable**: Configure ID generation, log formats, and skip conditions as needed.
- **Plug-and-Play**: Works seamlessly with any logger implementing the provided ILogger interface.

## Installation

Install ExpressLogSmith via npm:

```bash
npm install @mccann-hub/express-log-smith
```

## Basic Usage

A simple example integrating the middlewares into an Express.js application:

```typescript
import express from "express";
import {
  dexter,
  requestId,
  requestLogger,
} from "@mccann-hub/express-log-smith";

// Import your logger (must implement ILogger)
import myLogger from "./myLogger";

const app = express();

// Add request ID middleware to generate unique IDs
app.use(requestId());

// Add contextual logger middleware
app.use(dexter(myLogger));

// Add request logging middleware
app.use(requestLogger(myLogger));

// Define routes
app.get("/", (req, res) => {
  req.logger.info("Processing request", { custom: "metadata" });
  res.send("Hello, world!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

## Exported Middlewares

### `requestId(options?: RequestIdOptions)`

Adds `correlationId`, `traceId`, and `spanId` to each request.
These IDs help trace logs across distributed systems.

#### Options

- **correlation (optional)**: Configuration for the correlation ID.
  - **headerName**: The header name for the correlation ID (default: X-Correlation-Id).
  - **generator**: A custom ID generation function.
  - **setHeader**: Whether to include the correlation ID in the response headers (default: true).
- **trace (optional)**: Configuration for the trace ID.
  - Same properties as correlation.
- **span (optional)**: Configuration for the span ID.
  - **headerName**: The header name for the span ID (default: X-svc2svc-Id).
  - **setHeader**: Whether to include the span ID in the response headers (default: true).

#### Example

```typescript
app.use(
  requestId({
    correlation: { headerName: "X-My-Correlation-Id" },
    trace: { generator: () => `trace-${Date.now()}` },
  }),
);
```

### `dexter(logger: ILogger)`

Logs structured details of incoming requests and outgoing responses.
The default format includes:

- correlation_id
- trace_id
- span_id
- HTTP method, content type, user agent, URI path
- Response time and status

#### Customization

You can customize logging behavior by providing a skip function:

```typescript
app.use(
  dexter(myLogger, {
    skip: (req) => req.url === "/health",
  }),
);
```

### `requestLogger(logger: ILogger)`

Attaches a logger to the request object.
The logger includes metadata from the request, such as `correlationId`, `traceId`, and `spanId`.

#### Requirements

The provided logger must implement the ILogger interface.

#### Example

```typescript
app.use(requestLogger(myLogger));

app.get("/test", (req, res) => {
  req.logger.info("This is a test log");
  res.send("Logged successfully!");
});
```
