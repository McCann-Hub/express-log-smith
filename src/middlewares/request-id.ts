import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { IRequest } from '@models/IRequest';
import { NextFunction, Request, Response } from 'express';

const CORRELATION_ATTRIBUTE_NAME = 'correlationId';
const TRACE_ATTRIBUTE_NAME = 'traceId';
const SPAN_ATTRIBUTE_NAME = 'spanId';

interface IRequestId {
  headerName?: string;
  setHeader?: boolean;
}

interface ISpanId extends IRequestId {
  headerName: string;
}

type generatorFunction = (_request: Request) => string | undefined;

interface IRequestIdConfig extends IRequestId {
  generator?: generatorFunction;
}

interface IGeneratedRequestId extends IRequestIdConfig {
  generator: generatorFunction;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateV4UUID(_request: Request): string | undefined {
  return uuidv4();
}

function generateHash(_request: Request): string | undefined {
  const hash = crypto.createHash('sha1');
  hash.update(generateV4UUID(_request) || '');
  return hash.digest('hex');
}

function handleRequestId(
  request: Request,
  response: Response,
  config: IRequestIdConfig,
  attributeName: keyof IRequest,
): void {
  const { headerName, setHeader = true, generator = generateV4UUID } = config;

  let id: string | undefined;

  if (headerName) {
    const incomingId = request.get(headerName);
    id = incomingId || generator(request);

    if (setHeader) {
      response.set(headerName, id);
    }
  } else {
    id = generator(request);
  }

  // Dynamically add the ID to the request object
  request[attributeName] = id;
}

/**
 * Middleware for generating and managing request IDs.
 * @param {object} options - Configuration options for correlation, trace, and span IDs.
 * @returns {Express.RequestHandler} Express middleware function.
 */
export default function requestId({
  correlation = {
    generator: generateHash,
    headerName: 'X-Correlation-Id',
    setHeader: true,
  },
  trace = {
    generator: generateV4UUID,
    headerName: 'X-Request-Id',
    setHeader: true,
  },
  span = {
    headerName: 'X-svc2svc-Id',
    setHeader: true,
  },
}: {
  correlation?: IGeneratedRequestId;
  trace?: IGeneratedRequestId;
  span?: ISpanId;
} = {}): (request: Request, response: Response, next: NextFunction) => void {
  return function (
    request: IRequest,
    response: Response,
    next: NextFunction,
  ) {
    /*
     * Correlation Id
     */
    handleRequestId(
      request,
      response,
      {
        headerName: 'X-Correlation-Id',
        ...correlation,
      },
      CORRELATION_ATTRIBUTE_NAME,
    );

    /*
     * Trace Id
     */
    handleRequestId(
      request,
      response,
      {
        headerName: 'X-Request-Id',
        ...trace,
      },
      TRACE_ATTRIBUTE_NAME,
    );

    /*
     * Span Id
     */
    const incomingSpanId = request.get(span.headerName);

    if (incomingSpanId) {
      request[SPAN_ATTRIBUTE_NAME] = incomingSpanId;

      if (span.setHeader) {
        response.set(span.headerName, incomingSpanId);
      }
    }
    /* END Span Id */

    next();
  };
}
