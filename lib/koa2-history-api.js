'use strict';

var url = require('url');

exports = module.exports = function historyApiFallback(options) {
  options = options || {};
  var logger = getLogger(options);

  return async function(ctx, next) {
    var headers = ctx.headers;
    if (ctx.method !== 'GET') {
      logger(
        'Not rewriting',
        ctx.method,
        ctx.url,
        'because the method is not GET.'
      );
      return next();
    } else if (!headers || typeof headers.accept !== 'string') {
      logger(
        'Not rewriting',
        ctx.method,
        ctx.url,
        'because the client did not send an HTTP accept header.'
      );
      return next();
    } else if (headers.accept.indexOf('application/json') === 0) {
      logger(
        'Not rewriting',
        ctx.method,
        ctx.url,
        'because the client prefers JSON.'
      );
      return next();
    } else if (!acceptsHtml(headers.accept, options)) {
      logger(
        'Not rewriting',
        ctx.method,
        ctx.url,
        'because the client does not accept HTML.'
      );
      return next();
    }

    // 白名单
    if (options.whiteList) {
      for (let item of options.whiteList) {
        if (new RegExp(item).test(ctx.url)) {
          logger(
            'Not rewriting',
            ctx.method,
            ctx.url,
            'because the path is included in whiteList.'
          );
          return next();
        }
      }
    }

    var parsedUrl = url.parse(ctx.url);
    var rewriteTarget;
    options.rewrites = options.rewrites || [];
    for (var i = 0; i < options.rewrites.length; i++) {
      var rewrite = options.rewrites[i];
      var match = parsedUrl.pathname.match(rewrite.from);
      if (match !== null) {
        rewriteTarget = evaluateRewriteRule(parsedUrl, match, rewrite.to);
        logger('Rewriting', ctx.method, ctx.url, 'to', rewriteTarget);
        ctx.url = rewriteTarget;
        return next();
      }
    }

    var pathname = parsedUrl.pathname;
    if (pathname.lastIndexOf('.') > pathname.lastIndexOf('/') &&
        options.disableDotRule !== true) {
      logger(
        'Not rewriting',
        ctx.method,
        ctx.url,
        'because the path includes a dot (.) character.'
      );
      return next();
    }

    rewriteTarget = options.index || '/index.html';
    logger('Rewriting', ctx.method, ctx.url, 'to', rewriteTarget);
    ctx.url = rewriteTarget;
    await next();
  };
};

// 执行重写规则
function evaluateRewriteRule(parsedUrl, match, rule) {
  if (typeof rule === 'string') {
    return rule;
  } else if (typeof rule !== 'function') {
    throw new Error('Rewrite rule can only be of type string or function.');
  }

  return rule({
    parsedUrl: parsedUrl,
    match: match,
    request: ctx.request
  });
}

// 请求头类型是否被允许
function acceptsHtml(header, options) {
  options.htmlAcceptHeaders = options.htmlAcceptHeaders || ['text/html', '*/*'];
  for (var i = 0; i < options.htmlAcceptHeaders.length; i++) {
    if (header.indexOf(options.htmlAcceptHeaders[i]) !== -1) {
      return true;
    }
  }
  return false;
}

// 日志打印
function getLogger(options) {
  if (options && options.logger) {
    return options.logger;
  } else if (options && options.verbose) {
    return console.log.bind(console);
  }
  return function(){};
}
