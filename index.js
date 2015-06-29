var cookieparser = require('cookie-parser');
var debug = require("debug")("express-socket.io-session");

// The express session object will be set
// in socket.handskake.session.

/**
 * Returns a middleware function that acts on socket.handshake
 *
 * @param {Function} expressSessionMiddleware - An express-session middleware function to reuse with io.use
 * @param {Function} cookieParserMiddleware - An express-session middleware function to reuse with express-session
 * @param {Object} options - An object with some options for overriding default behaviour.
 *   - {Boolean} autSave - If true, the session variables will be saved asyncrhonously to express-session driver
 *                         by wrapping the method socket.on
 */
module.exports = function(expressSessionMiddleware, cookieParserMiddleware, options) {
  var socketIoSharedSessionMiddleware;

  if (typeof cookieParserMiddleware === 'undefined') {
    debug("No cookie-parser instance passed as argument. Creating a cookie-parser " +
      "instance with default values");
    cookieParserMiddleware = cookieparser();
  }
  options = options || {};
  debug("Creating socket.io middleware");

  socketIoSharedSessionMiddleware = function(socket, next) {
    var req = socket.handshake;
    var res = {};
    var _on = socket.on;
    // Override socket.on if autoSave = true; 
    if (options.autoSave === true) {
      socket.on = function() {
        var _args = arguments;
        expressSessionMiddleware(req, res, function(req, res) {
          _on.apply(socket, _args);
        });
      };
    }
    //Parse session cookie
    cookieParserMiddleware(req, res, function(err) {
      if (err) {
        debug("cookieParser errored");
        return next(err);
      }
      expressSessionMiddleware(req, res, function(req, res) {
        next();
      });
    });
  };
  return socketIoSharedSessionMiddleware;
};