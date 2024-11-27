import { Request } from 'express';
import { ILogger } from '@models/ILogger';

export interface IRequest extends Request {
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  logger?: ILogger;
}
