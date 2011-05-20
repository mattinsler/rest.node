var request = require('request'),
    Url = require('url'),
    _ = require('underscore');

function AbstractApi(config) {
  this.key = config.key;
  this.parsed_url = Url.parse(config.base_url, true);
}

AbstractApi.prototype.setRequestOptions = function(requestOptions, httpMethod, method, params) {
  console.log('AbstractApi.setRequestOptions');
  requestOptions.url.pathname += method;
  requestOptions.query = params;
  return requestOptions;
};

AbstractApi.prototype.get = function(method, params, callback) {
  if (typeof(params) === 'function') {
    callback = params;
    params = {};
  }
  
  var options = this.setRequestOptions({uri: _.extend({}, this.parsed_url)}, 'GET', method, params);
  if (typeof(options.uri) !== 'string') {
    options.uri = Url.format(options.uri);
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