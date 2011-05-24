var http = require('http'),
    Url = require('url'),
    querystring = require('querystring'),
    _ = require('underscore');

function AbstractApi(base_url) {
  this.parsed_url = Url.parse(base_url, true);
}

AbstractApi.prototype.debug = false;

AbstractApi.prototype.setRequestOptions = function(requestOptions, httpMethod, method, params) {
  requestOptions.url.pathname += method;
  requestOptions.query = params;
  return requestOptions;
};

function request(options, callback) {
  var body = '';
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, res, body);
    });
  });
  req.on('error', callback);
  req.end();
}

AbstractApi.prototype.get = function(method, params, callback) {
  if (typeof(params) === 'function') {
    callback = params;
    params = {};
  }
  
  var options = {
    protocol: this.parsed_url.protocol,
    host: this.parsed_url.host,
    port: this.parsed_url.port,
    method: 'GET',
    path: this.parsed_url.pathname,
    query: this.parsed_url.query,
    headers: {}
  }
  
  this.setRequestOptions(options, method, params);
  
  var query = querystring.stringify(options.query);
  if (query !== '') {
    options.path += '?' + query;
  }
  
//  var options = this.setRequestOptions({uri: _.extend({}, this.parsed_url)}, 'GET', method, params);
//  if (typeof(options.uri) !== 'string') {
//    options.uri = Url.format(options.uri);
//  }
//  
  if (this.debug) {
    console.log(options);
  }
  
  request(options, function(err, res, body) {
    if (!err && res.statusCode === 200) {
      try {
        callback(null, JSON.parse(body));
      } catch (e) {
        callback(e);
      }
      return;
    }

    if (err) {
      callback(err);
    } else if (res.statusCode !== 200) {
      callback('status: ' + res.statusCode);
    }
  });
};

AbstractApi.prototype.post = function(method, params, callback) {
  if (typeof(params) === 'function') {
    callback = params;
    params = {};
  }
  
  var options = this.setRequestOptions({uri: _.extend({}, this.parsed_url)}, 'POST', method, params);
  if (typeof(options.uri) !== 'string') {
    options.uri = Url.format(options.uri);
  }
  
  if (this.debug) {
    console.log(options.uri);
  }

  request(options, function(err, res, body) {
    if (!err && res.statusCode === 200) {
      try {
        callback(null, JSON.parse(body));
      } catch (e) {
        callback(e);
      }
      return;
    }

    if (err) {
      callback(err);
    } else if (res.statusCode !== 200) {
      callback('status: ' + res.statusCode);
    }
  });
};

module.exports = AbstractApi;