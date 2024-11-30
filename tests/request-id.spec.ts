import { expect } from "chai";
import requestId from '../src/middlewares/request-id';
import { Request, Response, NextFunction } from "express";
import { createRequest, createResponse, MockRequest, MockResponse } from 'node-mocks-http'

describe('requestId Middleware', () => {
  let mockRequest: MockRequest<Request>;
  let mockResponse: MockResponse<Response>;
  const nextFunction: NextFunction = () => { }

  beforeEach(() => {
    mockRequest = createRequest({
      method: 'GET',
      url: '/',
      headers: {}
    });
    mockResponse = createResponse();
  });

  it('injects traceId into Request object', () => {
    requestId()(mockRequest, mockResponse, nextFunction)
    
    expect(mockRequest.traceId).to.not.equal(undefined, 'pass')
    expect(mockRequest.traceId).to.match(/^[a-f0-9-]{36}$/, 'Expected traceId to be a valid UUID')
  });

  it('uses the value from the existing request header', () => {
    mockRequest = createRequest({
      method: 'GET',
      url: '/',
      headers: {
        'X-Request-Id': 'foobar',
        'X-svc2svc-id': 'hello-world'
      }
    });

    requestId()(mockRequest, mockResponse, nextFunction)
    
    expect(mockRequest.traceId).to.equal('foobar', 'pass')
    expect(mockRequest.spanId).to.equal('hello-world', 'pass')
  });

  it('injects traceId into Response headers when setHeader is true', () => {
    requestId()(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.get('X-Request-Id')).to.not.be.undefined;
    expect(mockResponse.get('X-Request-Id')).to.equal(mockRequest.traceId);
  });

  it('does not inject Response headers when setHeader is false', () => {
    requestId({
      trace: { setHeader: false },
    })(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.get('X-Request-Id')).to.be.undefined;
  });

  it('uses custom generator functions', () => {
    const customGenerator = () => 'custom-id';
    requestId({
      trace: { generator: customGenerator },
    })(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.traceId).to.equal('custom-id');
    expect(mockResponse.get('X-Request-Id')).to.equal('custom-id');
  });

  it('calls next after processing', (done) => {
    const nextSpy: NextFunction = () => done();

    requestId()(mockRequest, mockResponse, nextSpy);
  });

  it('handles missing headers gracefully', () => {
    requestId()(mockRequest, mockResponse, nextFunction);
    expect(mockRequest.traceId).to.exist;
    expect(mockRequest.traceId).to.be.a('string');
  });

  it('injects all IDs (correlation, trace, span) into the request object', () => {
    requestId()(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.correlationId).to.not.be.undefined;
    expect(mockRequest.traceId).to.not.be.undefined;
    expect(mockRequest.spanId).to.be.undefined; // No incoming spanId header
  });
})
