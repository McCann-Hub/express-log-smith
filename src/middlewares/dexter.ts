import process from 'node:process';
import morgan, { TokenIndexer } from 'morgan';
import { Request, Response } from 'express';
import { ILogger } from '@models/ILogger';
import { IRequest } from '@models/IRequest';

/*
 * Set up needed tokens
 */
morgan.token('correlationId', function (req: IRequest) {
  return req.correlationId;
});

morgan.token('traceId', function (req: IRequest) {
  return req.traceId;
});

morgan.token('spanId', function (req: IRequest) {
  return req.spanId;
});
/* END  tokens */

// Skip all the Morgan http log if the
// application is running in test mode.
// This method is not really needed here since
// we already told to the logger that it should
// print only error messages in test.
const defaultSkip = (req: Request) => {
  if (req.url === '/ping') return true;

  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

const boilerplateFormatter = (
  tokens: TokenIndexer,
  req: IRequest,
  res: Response,
) => ({
  correlation_id: tokens.correlationId(req, res),
  trace_id: tokens.traceId(req, res),
  span_id: tokens.spanId(req, res),
});

const createStream = (logger: ILogger, label: string) => ({
  write: (message: string): void => {
    logger.http
      ? logger.http(label, JSON.parse(message.trim()))
      : console.log(label, JSON.parse(message.trim()));
  },
});

/**
 * Factory function to create Morgan middleware for Express.js.
 * Provides request and response logging with support for correlation, trace, and span IDs.
 * @param {ILogger} logger - The logger instance to use for logging output.
 * @param {(req: Request) => boolean} [skip] - Custom skip function for conditional logging.
 * @returns {{
 *   requestMorgan: ReturnType<typeof morgan>,
 *   responseMorgan: ReturnType<typeof morgan>
 * }} - An object containing the configured Morgan middlewares for requests and responses.
 */
export default (logger: ILogger, skip = defaultSkip): {
  requestMorgan: ReturnType<typeof morgan>;
  responseMorgan: ReturnType<typeof morgan>;
} => {
  // Build the morgan middleware
  return {
    requestMorgan: morgan(
      // Define message format string.
      // The message format is made from tokens, and each token is
      // defined inside the Morgan library.
      // You can create your custom token to show what do you want from a request.
      //"[:reqid] :method :url",
      function (tokens: TokenIndexer, req: IRequest, res: Response) {
        return JSON.stringify({
          ...boilerplateFormatter(tokens, req, res),
          // https://docs.splunk.com/Documentation/CIM/6.0.0/User/Web
          http_method: tokens.method(req, res),
          http_content_type: tokens.req(req, res, 'content-type'),
          http_user_agent: tokens['user-agent'](req, res),
          http_referrer: tokens.referrer(req, res),
          uri_path: tokens.url(req, res),
        });
      },
      // Options: in this case, I overwrote the stream and the skip logic.
      // See the methods above.
      {
        immediate: true,
        // Override the stream method by telling
        // Morgan to use our custom logger instead of the console.log.
        stream: createStream(logger, 'incoming request'),
        skip,
      },
    ),
    responseMorgan: morgan(
      // Define message format string.
      // The message format is made from tokens, and each token is
      // defined inside the Morgan library.
      // You can create your custom token to show what do you want from a request.
      //"[:reqid] :status :res[content-length] - :response-time ms",
      function (tokens: TokenIndexer, req: IRequest, res: Response) {
        return JSON.stringify({
          ...boilerplateFormatter(tokens, req, res),
          status: Number.parseFloat(tokens.status(req, res) || '0.0'),
          content_length: tokens.res(req, res, 'content-length') || '-',
          response_time: Number.parseFloat(
            tokens['response-time'](req, res) || '0.0',
          ),
        });
      },
      // Options: in this case, I overwrote the stream and the skip logic.
      // See the methods above.
      {
        // Override the stream method by telling
        // Morgan to use our custom logger instead of the console.log.
        stream: createStream(logger, 'outgoing response'),
        skip,
      },
    ),
  };
};
