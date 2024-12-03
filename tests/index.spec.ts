import { expect } from 'chai';
import middlewareLib, { dexter, requestId, requestLogger, IReq, ILogger } from '../src';

describe('Library Exports', () => {
  it('should export middlewares correctly', () => {
    expect(middlewareLib).to.have.property('dexter', dexter);
    expect(middlewareLib).to.have.property('requestId', requestId);
    expect(middlewareLib).to.have.property('requestLogger', requestLogger);
  });

  it('should export types correctly', () => {
    // Validate type exports (not runtime objects)
    const logger: ILogger = {
      http: () => {},
      info: () => {},
      warn: () => {},
      debug: () => {},
      error: () => {},
    };

    const req: IReq = {
      logger,
      correlationId: '123',
      traceId: 'abc',
      spanId: 'def',
    };

    expect(req.logger).to.equal(logger);
    expect(req.correlationId).to.equal('123');
  });
});
