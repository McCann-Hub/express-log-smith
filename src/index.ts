import { ILogger } from '@models/ILogger';
import { IRequest } from '@models/IRequest';
import _dexter from '@middlewares/dexter';
import _requestId from '@middlewares/request-id';
import _requestLogger from '@middlewares/request-logger';

export const dexter = _dexter;

export const requestId = _requestId;

export const requestLogger = _requestLogger;

export default {
  dexter: _dexter,
  requestId: _requestId,
  requestLogger: _requestLogger,
};

export interface IReq extends IRequest {
  logger: ILogger;
}

export type { ILogger };
