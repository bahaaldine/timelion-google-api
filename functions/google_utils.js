var _ = require('lodash');
var moment = require('moment');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var readline = require('readline');
var rq = require('request');

var analyticsreporting = google.analyticsreporting('v4')
var youtubeAnalytics = google.youtubeAnalytics('v1');
var Promise = require('bluebird');

module.exports.authorize = function(request, scopes, tlConfig) {
  return new Promise(function(resolve, reject) {
    var oauth2Client = new OAuth2(
      tlConfig.settings['timelion:google.oauth2.client_id']
      , tlConfig.settings['timelion:google.oauth2.client_secret']
      , "https://localhost:5601/oiw/timelion-google-api/authorize");

    // generate consent page url
    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
      scope: scopes // If you only need one scope you can pass it as string
    });

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    var options = {
      url: 'https://localhost:5601/lcz/timelion-google-api/authorize',
      rejectUnauthorized: false
    };

    function callback(error, response, body) {
      console.log(error)
      console.log(response)
      //console.log(body)
      /*if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        console.log(info.stargazers_count + " Stars");
        console.log(info.forks_count + " Forks");
      }*/
    }

    rq(options, callback);
/*
    console.log('Visit the url: ', url);
    rl.question('Enter the code here:', function (code) {
      oauth2Client.getToken(code, function (err, tokens) {
        if (err) {
          return callback(err);
        }
        oauth2Client.setCredentials(tokens);
        request.auth = oauth2Client;
        resolve(request);
      });
    });*/
  });
}

module.exports.authorizeServiceAccount = function(request, scopes, tlConfig) {
  return new Promise(function (resolve, reject) {
    var key = {
    	"type": tlConfig.settings['timelion:google.service_account.type'],
      "project_id": tlConfig.settings['timelion:google.service_account.project_id'],
      "private_key_id": tlConfig.settings['timelion:google.service_account.private_key_id'],
      "private_key": tlConfig.settings['timelion:google.service_account.private_key'],
      "client_email": tlConfig.settings['timelion:google.service_account.client_email'],
      "client_id": tlConfig.settings['timelion:google.service_account.client_id'],
      "auth_uri": tlConfig.settings['timelion:google.service_account.auth_uri'],
      "token_uri": tlConfig.settings['timelion:google.service_account.token_uri'],
      "auth_provider_x509_cert_url": tlConfig.settings['timelion:google.service_account.auth_provider_x509_cert_url'],
      "client_x509_cert_url": tlConfig.settings['timelion:google.service_account.client_x509_cert_url']
    }
    var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, scopes, null);

    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
      }

      resolve({
        'headers': {'Content-Type': 'application/json'},
        'auth': jwtClient,
        'resource': request,
      });
    });
  });
}

module.exports.getReport = function(request) {
  return new Promise(function(resolve, reject) {
    analyticsreporting.reports.batchGet(request, function(err, resp) {
    	var metricsList = _.map(resp.reports[0].columnHeader.metricHeader.metricHeaderEntries, function(metric){
    		return metric.name;
    	});
      var data = resp.reports[0].data.rows;
      var lists = [];
      for ( var i=0, l=metricsList.length; i<l; i++ ) {

        var serieList = {
          data: [],
          type: 'series',
          label: metricsList[i]
        }

        serieList.data = _.map(data, function(item) {
          return [ moment(item.dimensions, "YYYYMMDD").format("x"), item.metrics[0].values[i] ]
        });

        lists.push(serieList);
      }

      resolve({
        type: 'seriesList',
        list: lists
      });

    });
  });
}

module.exports.getYoutubeReport = function(request) {
  return new Promise(function(resolve, reject) {
    youtubeAnalytics.reports.query(request, function(err, resp) { 
      var lists = [];

      var metricsList = _.filter(resp.columnHeaders, function(metric) {
        if ( metric.columnType == "METRIC" ) {
          return metric.name;
        }
      });
      var data = resp.rows;

      for ( var i=0, l=metricsList.length; i<l; i++ ) {

        var serieList = {
          data: [],
          type: 'series',
          label: metricsList[i].name
        }

        serieList.data = _.map(data, function(item) {
          return [ moment(item[0], "YYYY-MM-DD").format("x"), item[i+1] ]
        });

        lists.push(serieList);
      }

      resolve({
        type: 'seriesList',
        list: lists
      });

    });
  });
}