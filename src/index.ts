import { ILogger } from '@models/ILogger';
import { IRequest } from '@models/IRequest';
import _dexter from '@middlewares/dexter';
import _requestId from '@middlewares/request-id';
import _requestLogger from '@middlewares/request-logger';

/**
 * Middleware for logging HTTP request and response details,
 * including correlation, trace, and span IDs.
 *
 * @see {@link ILogger} - Used to log HTTP information with correlation data.
 * @example
 * // Usage in an Express app
 * import { dexter } from '@mccann-hub/express-log-smith';
 * app.use(dexter(logger));
 */
export const dexter = _dexter;

/**
 * Middleware for generating and managing correlation, trace, and span IDs for each request.
 *
 * @see {@link IRequest} - The request type extended to include ID properties.
 * @example
 * // Usage in an Express app
 * import { requestId } from '@mccann-hub/express-log-smith';
 * app.use(requestId());
 */
export const requestId = _requestId;

/**
 * Middleware for injecting the request-scoped logger into the request object.
 *
 * @see {@link IRequest} - The request type extended to include correlation, trace, and span IDs.
 * @see {@link ILogger} - The logger interface injected into the request object.
 * @example
 * // Usage in an Express app
 * import { requestLogger } from '@mccann-hub/express-log-smith';
 * app.use(requestLogger(logger));
 */
export const requestLogger = _requestLogger;

export default {
  dexter: _dexter,
  requestId: _requestId,
  requestLogger: _requestLogger,
};

/**
 * Extended request interface to include the logger.
 *
 * @extends IRequest
 * @property {ILogger} logger - Logger instance scoped to the current request.
 * @example
 * // Access the logger in your route handler
 * app.get('/', (req: IReq, res) => {
 *   req.logger.info('Handling request');
 *   res.send('Hello, world!');
 * });
 */
export interface IReq extends IRequest {
  logger: ILogger;
}

/**
 * Logger interface used throughout the application.
 *
 * @typedef ILogger
 * @property {Function} debug - Logs a debug message.
 * @property {Function} info - Logs an informational message.
 * @property {Function} warn - Logs a warning message.
 * @property {Function} error - Logs an error message.
 * @example
 * // Example of a logger implementation
 * const logger: ILogger = {
 *   debug: (msg) => console.debug(msg),
 *   info: (msg) => console.info(msg),
 *   warn: (msg) => console.warn(msg),
 *   error: (msg) => console.error(msg),
 * };
 */
export type { ILogger };
