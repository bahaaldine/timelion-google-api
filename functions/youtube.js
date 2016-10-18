var Datasource = require('../../../src/core_plugins/timelion/server/lib/classes/datasource');
var _ = require('lodash');
var moment = require('moment');
var googleUtils = require('./google_utils.js');

module.exports = new Datasource('youtube', {
  args: [
    {
      name: 'identifier',
      types: ['string'],
      help: 'Identifies the YouTube channel or content owner for which you are retrieving YouTube Analytics data. - To request data for a YouTube user, set the ids parameter value to channel==CHANNEL_ID, where CHANNEL_ID specifies the unique YouTube channel ID. - To request data for a YouTube CMS content owner, set the ids parameter value to contentOwner==OWNER_NAME, where OWNER_NAME is the CMS name of the content owner. More info here: https://support.google.com/youtube/answer/3250431'
    },
    {
      name: 'metrics',
      types: ['string', null],
      help: 'A list of comma separated analytics metrics to display: annotationClickThroughRate, annotationCloseRate, averageViewDuration, comments, dislikes, estimatedMinutesWatched, estimatedRevenue, likes, shares, subscribersGained, subscribersLost, viewerPercentage, views. More here: https://developers.google.com/analytics/devguides/reporting/core/dimsmets'
    },
    {
      name: 'filters',
      types: ['string', null],
      help: 'A list of filters that should be applied when retrieving YouTube Analytics data. The Available Reports document identifies the dimensions that can be used to filter each report, and the Dimensions document defines those dimensions. If a request uses multiple filters, join them together with a semicolon (;), and the returned result table will satisfy both filters. For example, a filters parameter value of video==dMH0bHeiRNg;country==IT restricts the result set to include data for the given video in Italy. (string)'
    }
  ],
  help: 'Youtube Reporting API data source',
  fn: function youtube(args, tlConfig) {
    var config = _.defaults(args.byName, {
      metrics: "annotationClickThroughRate,annotationCloseRate,averageViewDuration,comments,dislikes,estimatedMinutesWatched,estimatedRevenue,likes,shares,subscribersGained,subscribersLost,viewerPercentage,views"
    });

    var identifier = config.identifier;
    var metricsList = config.metrics.replace(/ /g,'');
    var dimensionsList = "day";
    var filtersList = null;
    if ( typeof config.filters != "undefined" ) {
      filtersList = config.filters.replace(/ /g,'');
    }
    var startDate = moment(tlConfig.time.from).format("YYYY-MM-DD");
    var endDate = moment(tlConfig.time.to).format("YYYY-MM-DD");

    var req = {
      ids: identifier,
      "start-date": startDate,
      "end-date": endDate,
      metrics: metricsList,
      dimensions: dimensionsList
    };

    if ( filtersList != null ) {
      req.filters = filtersList;
    }

    var scopes = [
      "https://www.googleapis.com/auth/youtube"
      , "https://www.googleapis.com/auth/youtube.readonly"
      , "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
      , "https://www.googleapis.com/auth/yt-analytics.readonly"
    ]

    return googleUtils.authorize(req, scopes, tlConfig).then( function(request) {
      return googleUtils.getYoutubeReport(request).then(function(seriesList) {
        return seriesList;
      });
    }, function(err) {
      console.log(err)
    });
  }
});
