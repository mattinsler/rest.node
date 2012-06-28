var util = require('util'),
    Url = require('url'),
    querystring = require('querystring'),
    _ = require('underscore');

function Rest(base_url) {
  this.base_url = base_url;
  this.parsed_url = Url.parse(base_url, true);
}

CODES = {
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  // 306: '',
  307: 'Temporary Redirect',
  
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',

  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported'
};

Rest.RestError = function(status_code, body) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.status_code = status_code;
  this.status_type = CODES[status_code] || 'Unknown';
  this.message = status_code + ': ' + this.status_type;
  this.body = body;
  this.name = 'RestError';
};

Rest.RestError.prototype.__proto__ = Error.prototype;

Rest.prototype.debug = false;

// override-able
Rest.prototype.setRequestOptions = function(options, method, params) {
  options.path += method;
  _.extend(options.query, params);
};

// override-able
Rest.prototype.parseResponseBody = function(headers, body) {
  return JSON.parse(body);
};

Rest.prototype._executeRequest = function(options, callback) {
  function createRequestOptions(options) {
    var query = querystring.stringify(options.query);
    return {
      agent: false,
      host: options.host,
      port: options.port,
      method: options.method,
      path: options.path + (query === '' ? '' : '?' + query),
      headers: options.headers
    };
  }
  
  var body = '';
  var requestOptions = createRequestOptions(options);
  if (options.body) {
    if (typeof(options.body) !== 'string') {
      options.body = querystring.stringify(options.body);
    }
    options.headers['Content-Length'] = options.body.length;
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  
  if (this.debug) {
    console.log(requestOptions);
    console.log(options);
  }
  var req = require(options.protocol.split(':')[0]).request(requestOptions, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, res, body);
    });
  });
  req.on('error', callback);
  
  if (options.body) {
    req.write(options.body);
  }

  req.end();
};

Rest.prototype._handleResponse = function(err, res, body, callback) {
  var parsedBody = '';
  try {
    parsedBody = this.parseResponseBody(res.headers, body);
  } catch (e) {
    // ignore this
  }
  
  if (err) {
    callback(err);
  } else if (res.statusCode !== 200) {
    callback(new Rest.RestError(res.statusCode, parsedBody));
  } else {
    callback(null, parsedBody);
  }
};

Rest.prototype.request = function(httpMethod, method, params, callback) {
  if (typeof(params) === 'function') {
    callback = params;
    params = {};
  }
  
  var options = {
    protocol: this.parsed_url.protocol,
    host: this.parsed_url.hostname,
    port: this.parsed_url.port || (this.parsed_url.protocol === 'https:' ? 443 : 80),
    method: httpMethod,
    path: this.parsed_url.pathname || '',
    query: this.parsed_url.query,
    headers: {}
  };
  
  this.setRequestOptions(options, method, params);
  
  var self = this;
  this._executeRequest(options, function(err, res, body) {
    self._handleResponse(err, res, body, callback);
  });
}

Rest.prototype.get = function(method, params, callback) {
  this.request('GET', method, params, callback);
};

Rest.prototype.post = function(method, params, callback) {
  this.request('POST', method, params, callback);
};

Rest.prototype.put = function(method, params, callback) {
  this.request('PUT', method, params, callback);
};

Rest.prototype.delete = function(method, params, callback) {
  this.request('DELETE', method, params, callback);
};

module.exports = Rest;
