var util = require('util'),
    Url = require('url'),
    querystring = require('querystring'),
    _ = require('underscore');

function Rest(base_url) {
  this.base_url = base_url;
  this.parsed_url = Url.parse(base_url, true);
}

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
    callback(new Error('Status[' + res.statusCode + ']\nBody[' + JSON.stringify(parsedBody) + ']'));
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