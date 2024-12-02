import { ILogger } from '@models/ILogger';
import { IRequest } from '@models/IRequest';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to attach a logger to the request object.
 * The logger includes request-level metadata such as correlation ID, trace ID, and span ID.
 *
 * @param {ILogger} logger - Base logger instance to extend.
 * @returns {Express.RequestHandler} Middleware function to attach logger to requests.
 */
export default function requestLogger(
  logger: ILogger,
): (request: Request, response: Response, next: NextFunction) => void {
  return function (
    request: IRequest,
    _response: Response,
    next: NextFunction,
  ) {
    const reqId = Object.freeze({
      correlation_id: request.correlationId || 'unknown-correlation-id',
      trace_id: request.traceId || 'unknown-trace-id',
      span_id: request.spanId || 'unknown-span-id',
    });

    request.logger = {
      debug: (message, metadata = {}) =>
        logger.debug(message, {
          ...metadata,
          ...reqId,
        }),
      info: (message, metadata = {}) =>
        logger.info(message, {
          ...metadata,
          ...reqId,
        }),
      warn: (message, metadata = {}) =>
        logger.warn(message, {
          ...metadata,
          ...reqId,
        }),
      error: (message, metadata = {}) =>
        logger.error(message, {
          ...metadata,
          ...reqId,
        }),
    };

    next();
  };
}
