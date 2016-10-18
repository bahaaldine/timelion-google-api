

module.exports = function (server) {
  server.route({
    path: '/timelion-google-api/authorize',
    method: 'GET',
    handler: function (req, reply) {
      var response = {status: "ok"};
      reply(response);
      console.log(req.query.url)
      
      //reply.redirect(url)
    }
  });

  server.route({
    path: '/timelion-google-api/callback',
    method: 'GET',
    handler: function (req, reply) {
      console.log(req.query.code)
      //reply.redirect("http://www.google.com")
    }
  });

  return server;
}