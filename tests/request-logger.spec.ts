import { expect } from 'chai';
import sinon from 'sinon';
import { createRequest, createResponse } from 'node-mocks-http';
import { ILogger } from '../src/models/ILogger';
import { IRequest } from '../src/models/IRequest';
import requestLogger from '../src/middlewares/request-logger';

describe('requestLogger middleware', () => {
  let loggerMock: ILogger;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    // Mock logger
    loggerMock = {
      debug: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
    };

    // Mock next function
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should attach a logger to the request object', () => {
    const middleware = requestLogger(loggerMock);

    // Create mock request and response
    const req = createRequest<IRequest>({
      correlationId: '1234',
      traceId: '5678',
      spanId: '91011',
    });
    const res = createResponse();

    // Call the middleware
    middleware(req, res, next);

    // Assert logger is attached to the request
    expect(req.logger).to.exist;
    expect(req.logger).to.have.property('info').that.is.a('function');
    expect(req.logger).to.have.property('debug').that.is.a('function');
    expect(req.logger).to.have.property('warn').that.is.a('function');
    expect(req.logger).to.have.property('error').that.is.a('function');

    // Ensure `next` was called
    expect(next.calledOnce).to.be.true;
  });

  it('should pass correlation, trace, and span IDs to log metadata', () => {
    const middleware = requestLogger(loggerMock);

    // Create mock request and response
    const req = createRequest<IRequest>({
      correlationId: '1234',
      traceId: '5678',
      spanId: '91011',
    });
    const res = createResponse();

    // Call the middleware
    middleware(req, res, next);

    // Use the attached logger
    req.logger.info('Test message', { additional: 'metadata' });

    // Assert logger.info was called with correct arguments
    expect(loggerMock.info.calledOnce).to.be.true;
    const logArgs = loggerMock.info.args[0]; // Arguments of first call
    expect(logArgs[0]).to.equal('Test message'); // Log message
    expect(logArgs[1]).to.deep.include({
      correlation_id: '1234',
      trace_id: '5678',
      span_id: '91011',
      additional: 'metadata',
    });
  });

  it('should gracefully handle missing IDs by using defaults', () => {
    const middleware = requestLogger(loggerMock);

    // Create mock request and response
    const req = createRequest<IRequest>(); // No IDs provided
    const res = createResponse();

    // Call the middleware
    middleware(req, res, next);

    // Use the attached logger
    req.logger.info('Test message');

    // Assert logger.info was called with correct arguments
    expect(loggerMock.info.calledOnce).to.be.true;
    const logArgs = loggerMock.info.args[0]; // Arguments of first call
    expect(logArgs[1]).to.deep.include({
      correlation_id: 'unknown-correlation-id',
      trace_id: 'unknown-trace-id',
      span_id: 'unknown-span-id',
    });
  });

  it('should call next even if logger setup fails', () => {
    // Mock a logger that throws an error
    const errorLogger = {
      ...loggerMock,
      info: sinon.stub().throws(new Error('Logger failure')),
    };
    const middleware = requestLogger(errorLogger);

    // Create mock request and response
    const req = createRequest<IRequest>();
    const res = createResponse();

    // Call the middleware
    expect(() => middleware(req, res, next)).to.not.throw();

    // Ensure `next` was still called
    expect(next.calledOnce).to.be.true;
  });
});
