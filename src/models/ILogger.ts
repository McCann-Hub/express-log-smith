type loggerMethod = {
  (message: string, metadata?: object): void;
};

export interface ILogger {
  debug: loggerMethod;
  info: loggerMethod;
  http?: loggerMethod;
  warn: loggerMethod;
  error: loggerMethod;
}
