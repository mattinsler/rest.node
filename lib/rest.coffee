http = require 'http'
request = require 'request'

series = (array, args, callback) ->
  return callback() unless array?.length? > 0
  
  idx = 0
  next = (err) ->
    return callback(err) if err?
    return callback() if idx is array.length
    array[idx++].apply(null, args.concat([next]))
  
  next()

class RestError extends Error
  constructor: (@status_code, @body) ->
    super()
    Error.captureStackTrace(@, arguments.callee)
    @status_type = http.STATUS_CODES[status_code] or 'Unknown'
    @message = status_code + ': ' + @status_type
    @name = 'Rest.Error'

class Rest
  @Error: RestError
  
  constructor: (@_rest_options = {}) ->
    @_rest_options.debug ?= false
    @_rest_options.base_url = @_rest_options.base_url.replace(/\/+$/, '')
    
    @_rest_hooks = {}
  
  hook: (method, callback) ->
    @_rest_hooks[method] ?= []
    @_rest_hooks[method].push(callback)
  
  parse_response_body: (headers, body) ->
    JSON.parse(body)
  
  handle_response: (err, res, body, callback) ->
    return callback(err) if err?
    
    try
      parsed_body = @parse_response_body(res.headers, body)
    catch e
    
    return callback(new Rest.Error(res.statusCode, parsed_body)) unless res.statusCode is 200
    callback(null, parsed_body)
  
  request: (method, path, opts, callback) ->
    if typeof opts is 'function'
      callback = opts
      opts = {}
    opts ?= {}
    
    request_opts =
      url: @_rest_options.base_url + '/' + path.replace(/^\/+/, '')
      pool: false
    
    hooks = (@_rest_hooks['pre:request'] or []).concat(@_rest_hooks['pre:' + method] or [])
    
    series hooks, [request_opts, opts, callback], (err) =>
      return callback(err) if err?
    
      request[method] request_opts, (err, res, body) =>
        @handle_response(err, res, body, callback)
  
  get: (path, opts, callback) ->
    @request('get', path, opts, callback)
  
  post: (path, opts, callback) ->
    @request('post', path, opts, callback)
  
  put: (path, opts, callback) ->
    @request('put', path, opts, callback)
  
  delete: (path, opts, callback) ->
    @request('delete', path, opts, callback)

module.exports = Rest
