var timelionGoogleApiRoutes= require('./functions/api');

module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'timelion-google-api',
    require: ['timelion'],
    init: function (server) {
    	timelionGoogleApiRoutes(server);
      server.plugins.timelion.addFunction(require('./functions/ganalytics'));
      server.plugins.timelion.addFunction(require('./functions/youtube'));
    }
  });
};
