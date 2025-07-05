module.exports = function loggingMiddleware(req, res, next) {
    const log = {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    };
    req.app.locals.logs = req.app.locals.logs || [];
    req.app.locals.logs.push(log);
    next();
  };
  