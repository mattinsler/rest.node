(function() {
  var Rest, RestError, http, request, series,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  http = require('http');

  request = require('request');

  series = function(array, args, callback) {
    var idx, next;
    if (!(((array != null ? array.length : void 0) != null) > 0)) {
      return callback();
    }
    idx = 0;
    next = function(err) {
      if (err != null) {
        return callback(err);
      }
      if (idx === array.length) {
        return callback();
      }
      return array[idx++].apply(null, args.concat([next]));
    };
    return next();
  };

  RestError = (function(_super) {

    __extends(RestError, _super);

    function RestError(status_code, body) {
      this.status_code = status_code;
      this.body = body;
      RestError.__super__.constructor.call(this);
      Error.captureStackTrace(this, arguments.callee);
      this.status_type = http.STATUS_CODES[status_code] || 'Unknown';
      this.message = status_code + ': ' + this.status_type;
      this.name = 'Rest.Error';
    }

    return RestError;

  })(Error);

  Rest = (function() {

    Rest.Error = RestError;

    function Rest(_rest_options) {
      var _base, _ref;
      this._rest_options = _rest_options != null ? _rest_options : {};
      if ((_ref = (_base = this._rest_options).debug) == null) {
        _base.debug = false;
      }
      this._rest_options.base_url = this._rest_options.base_url.replace(/\/+$/, '');
      this._rest_hooks = {};
    }

    Rest.prototype.hook = function(method, callback) {
      var _base, _ref;
      if ((_ref = (_base = this._rest_hooks)[method]) == null) {
        _base[method] = [];
      }
      return this._rest_hooks[method].push(callback);
    };

    Rest.prototype.parse_response_body = function(headers, body) {
      return JSON.parse(body);
    };

    Rest.prototype.handle_response = function(err, res, body, callback) {
      var parsed_body;
      if (err != null) {
        return callback(err);
      }
      try {
        parsed_body = this.parse_response_body(res.headers, body);
      } catch (e) {

      }
      if (res.statusCode !== 200) {
        return callback(new Rest.Error(res.statusCode, parsed_body));
      }
      return callback(null, parsed_body);
    };

    Rest.prototype.request = function(method, path, opts, callback) {
      var hooks, request_opts,
        _this = this;
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      if (opts == null) {
        opts = {};
      }
      request_opts = {
        url: this._rest_options.base_url + '/' + path.replace(/^\/+/, ''),
        pool: false
      };
      hooks = (this._rest_hooks['pre:request'] || []).concat(this._rest_hooks['pre:' + method] || []);
      return series(hooks, [request_opts, opts, callback], function(err) {
        if (err != null) {
          return callback(err);
        }
        return request[method](request_opts, function(err, res, body) {
          return _this.handle_response(err, res, body, callback);
        });
      });
    };

    Rest.prototype.get = function(path, opts, callback) {
      return this.request('get', path, opts, callback);
    };

    Rest.prototype.post = function(path, opts, callback) {
      return this.request('post', path, opts, callback);
    };

    Rest.prototype.put = function(path, opts, callback) {
      return this.request('put', path, opts, callback);
    };

    Rest.prototype["delete"] = function(path, opts, callback) {
      return this.request('delete', path, opts, callback);
    };

    return Rest;

  })();

  module.exports = Rest;

}).call(this);
