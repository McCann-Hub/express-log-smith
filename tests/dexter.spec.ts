import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import morgan from 'morgan';
import createMorganMiddleware from '../src/middlewares/dexter';
import { ILogger } from '../src/models/ILogger';

describe('custom mogan middleware (dexter)', () => {
  let loggerMock: ILogger;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    // Mock logger
    loggerMock = {
      http: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub(),
    };

    // Mock request, response, and next
    req = {
      correlationId: '1234',
      url: '/test',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'x-correlation-id': '1234',
      },
      get: function (header: string) {
        return this.headers ? this.headers[header.toLowerCase()] : undefined;
      },    
    };
    res = { set: sinon.stub() };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Default Behavior', () => {
    it('should create a middleware with default skip logic', () => {
      const { requestMorgan, responseMorgan } = createMorganMiddleware(loggerMock);

      expect(requestMorgan).to.be.a('function');
      expect(responseMorgan).to.be.a('function');
    });

    it('should not call logger.http when request is skipped (default skip)', () => {
      const { requestMorgan } = createMorganMiddleware(loggerMock);

      // Simulate test environment
      process.env.NODE_ENV = 'test';
      req.url = '/ping'; // A URL that should be skipped by default

      // Call the middleware
      requestMorgan(req as Request, res as Response, next);

      // Assert logger.http was not called
      expect(loggerMock.http.called).to.be.false;
    });

    it('should call logger.http when request is not skipped (default skip)', () => {
      const { requestMorgan } = createMorganMiddleware(loggerMock);

      // Simulate production environment
      process.env.NODE_ENV = 'production';
      req.url = '/other'; // A URL that should not be skipped

      // Call the middleware
      requestMorgan(req as Request, res as Response, next);

      // Assert logger.http was called
      expect(loggerMock.http.called).to.be.true;
      expect(loggerMock.http.args[0][0]).to.equal('incoming request');
    }); 
    
    it('should log incoming request with default formatter', () => {
      const { requestMorgan } = createMorganMiddleware(loggerMock);

      // Simulate request to invoke middleware
      requestMorgan(req as Request, res as Response, next);

      // Assert logger.http was called with the formatted log
      expect(loggerMock.http.calledOnce).to.be.true;

      // Check the content of the log
      const logArgs = loggerMock.http.args[0]; // Arguments of the first call
      expect(logArgs[0]).to.equal('incoming request'); // Label
      const loggedData = logArgs[1]; // JSON payload
      expect(loggedData).to.have.property('correlation_id', '1234');
      expect(loggedData).to.have.property('http_content_type', 'application/json');
      expect(loggedData).to.have.property('http_user_agent', 'test-agent');
      expect(loggedData).to.have.property('uri_path', '/test');
    });

    /*
    it('should log outgoing response with default formatter', () => {
      const { responseMorgan } = createMorganMiddleware(loggerMock);

      // Simulate response to invoke middleware
      responseMorgan(req as Request, res as Response, next);

      // Assert logger.http was called
      expect(loggerMock.http.calledOnce).to.be.true;

      // Check the content of the log
      const logArgs = loggerMock.http.args[0];
      expect(logArgs[0]).to.equal('outgoing response'); // Label
      const loggedData = logArgs[1]; // JSON payload
      expect(loggedData).to.have.property('correlation_id', '1234');
      expect(loggedData).to.have.property('status', 0); // Default status if none is set
      expect(loggedData).to.have.property('content_length', '-');
      expect(loggedData).to.have.property('response_time', 0); // Default response time
    });
    */
  });

  describe('Custom Skip Function', () => {
    it('should respect custom skip function and not call logger.http', () => {
      const customSkip = sinon.stub().returns(true); // Always skip
      const { requestMorgan } = createMorganMiddleware(loggerMock, customSkip);

      req.url = '/custom'; // Any URL
      requestMorgan(req as Request, res as Response, next);

      // Assert logger.http was not called
      expect(loggerMock.http.called).to.be.false;
      expect(customSkip.calledOnceWith(req)).to.be.true;
    });

    it('should respect custom skip function and call logger.http if not skipped', () => {
      const customSkip = sinon.stub().returns(false); // Never skip
      const { requestMorgan } = createMorganMiddleware(loggerMock, customSkip );

      req.url = '/custom'; // Any URL
      requestMorgan(req as Request, res as Response, next);

      // Assert logger.http was called
      expect(loggerMock.http.called).to.be.true;
      expect(loggerMock.http.args[0][0]).to.equal('incoming request');
      expect(customSkip.calledOnceWith(req)).to.be.true;
    }); 
  });

  describe('Custom Tokens', () => {
    it('should add custom tokens to Morgan', () => {
      createMorganMiddleware(loggerMock);

      req.correlationId = '1234';
      req.traceId = '5678';
      req.spanId = '91011';

      expect(morgan.correlationId!(req as Request, res as Response)).to.equal('1234');
      expect(morgan.traceId!(req as Request, res as Response)).to.equal('5678');
      expect(morgan.spanId!(req as Request, res as Response)).to.equal('91011');
    });
  });

  describe('Stream Logging', () => {
    it('should call logger.http for incoming requests', () => {
      const { requestMorgan } = createMorganMiddleware(loggerMock);

      // Simulate a request to trigger the middleware
      requestMorgan(req as Request, res as Response, next);

      // Assert that logger.http was called
      expect(loggerMock.http.calledOnce).to.be.true;

      // Verify the logged arguments
      const logArgs = loggerMock.http.args[0];
      expect(logArgs[0]).to.equal('incoming request'); // Log label
      const loggedData = logArgs[1];
      expect(loggedData).to.have.property('correlation_id', '1234');
      expect(loggedData).to.have.property('http_content_type', 'application/json');
      expect(loggedData).to.have.property('http_user_agent', 'test-agent');
    });

    it('should fallback to console.log if logger.http is undefined', () => {
      // Remove logger.http to simulate fallback behavior
      delete loggerMock.http;
      const consoleSpy = sinon.stub(console, 'log');

      const { requestMorgan } = createMorganMiddleware(loggerMock);

      // Simulate a request to trigger the middleware
      requestMorgan(req as Request, res as Response, next);

      // Assert that console.log was called
      expect(consoleSpy.calledOnce).to.be.true;

      // Verify the logged arguments
      const logArgs = consoleSpy.args[0];
      expect(logArgs[0]).to.equal('incoming request'); // Log label
      const loggedData = logArgs[1];
      expect(loggedData).to.have.property('correlation_id', '1234');
      expect(loggedData).to.have.property('http_content_type', 'application/json');
      expect(loggedData).to.have.property('http_user_agent', 'test-agent');

      consoleSpy.restore();
    });  
  });
});
