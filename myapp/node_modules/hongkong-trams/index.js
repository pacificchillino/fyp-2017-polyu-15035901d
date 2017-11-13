var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('underscore');
var parseString = Promise.promisify(require('xml2js').parseString);
var cheerio = require('cheerio');
var random_useragent = require('random-useragent');

var Tram = function(options) {
  this.options = _.extendOwn({
    userAgent: random_useragent.getRandom()
  }, options);

  // For now this is not handled
  this.options.lang = 'en';
};

Tram.WEST_DIRECTION = 'west';
Tram.EAST_DIRECTION = 'east';
Tram.BOTH_DIRECTIONS = 'east & west';
Tram.TERMINUS = 'terminus';

/**
* Downloads Tram Stops from Server
*/
Tram.prototype.getTramStops = function() {
  // if (typeof withLatLong !== 'boolean') {
  //   withLatLong = true;
  // }
  var options;
  //if (withLatLong) {
    options = {
      method: 'GET',
      baseUrl: 'http://hktramways.com/js',
      uri: '/googleMap.js',
      headers: {
        'User-Agent': this.options.userAgent
      },
    };

    return rp(options)
      .then(function(jsCode) {
        // Here we just define some objects to be able to get the .js file data
        var evalTramStops = eval.call({},"'use strict'; var window; var google = {maps: {InfoWindow: function() {},event: {addDomListener: function() {}}}};" + jsCode + '; var stops = stopsArrayEB; stops');
        var tramStops = [];
        _.each(evalTramStops, function(tramStop) {
          var stopData = {
            stop_code: tramStop[0],
            en_name: tramStop[1],
            tc_name: tramStop[2],
            sc_name: tramStop[3],
            latitude: tramStop[4],
            longitude: tramStop[5],
          };
          var stopDirection = stopData.stop_code.substr(stopData.stop_code.length-1,stopData.stop_code.length);
          if (stopDirection === 'W') {
            stopData.direction = Tram.WEST_DIRECTION;
          } else if (stopDirection === 'E') {
            stopData.direction = Tram.EAST_DIRECTION;
          } else if (stopDirection === 'T') {
            stopData.direction = Tram.TERMINUS;
          // Need special handling for kennedy town
          } else if (stopDirection === 'B') {
            stopData.direction = Tram.EAST_DIRECTION;
            if (stopData.stop_code === 'HVT_B') {
              tramStops.push({
                stop_code: 'HVT_K',
                en_name: stopData.en_name,
                tc_name: stopData.tc_name,
                sc_name: stopData.sc_name,
                latitude: stopData.latitude,
                longitude: stopData.longitude,
                direction: Tram.WEST_DIRECTION
              });
            }
          } else if (!isNaN(parseInt(stopDirection))) {
            stopData.direction = Tram.BOTH_DIRECTIONS;
          }
          tramStops.push(stopData);
        });
        return tramStops;
      });
  // } else {
  //   options = {
  //     method: 'GET',
  //     baseUrl: 'http://hktramways.com/js',
  //     uri: '/nextTramData.js'
  //   };
  //
  //   return rp(options)
  //     .then(function(jsCode) {
  //       var evalTramStops = eval.call({},"'use strict';" + jsCode + '; var stops = {east: nextTramStopsE, west: nextTramStopsW}; stops');
  //       var tramStops = [];
  //       if (!evalTramStops.hasOwnProperty("west") || !evalTramStops.hasOwnProperty("east")) {
  //         throw Error("Invalid Server Data Error");
  //       }
  //       _.each(evalTramStops.east, function(tramStop) {
  //         tramStops.push({
  //           stop_code: tramStop[0],
  //           en_name: tramStop[1],
  //           tc_name: tramStop[2],
  //           sc_name: tramStop[3],
  //           direction: Tram.EAST_DIRECTION
  //         });
  //       });
  //       _.each(evalTramStops.west, function(tramStop) {
  //         tramStops.push({
  //           stop_code: tramStop[0],
  //           en_name: tramStop[1],
  //           tc_name: tramStop[2],
  //           sc_name: tramStop[3],
  //           direction: Tram.WEST_DIRECTION
  //         });
  //       });
  //       return tramStops;
  //     });
  // }
};

Tram.prototype.getNextTramETA = function(stopCode) {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/nextTram/geteat.php?stop_code=' + stopCode,
    headers: {
      'User-Agent': this.options.userAgent
    },
  };

  return rp(options)
    .then(function(xml) {
      return parseString(xml);
    }).then(function(result) {
      return _.map(result.root.metadata, function(item){
        var newItem = item.$;
        newItem.eta = newItem.eat;
        newItem.is_arrived = newItem.is_arrived === 1 ? true : false;
        newItem.is_last_tram = newItem.is_last_tram === 1 ? true : false;
        delete newItem.eat;
        return newItem;
      });
    });
};

Tram.prototype.getEmergencyMessageForTramStop = function(stopCode) {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/nextTram/getmessage.php?stop_code=' + stopCode,
    headers: {
      'User-Agent': this.options.userAgent
    },
  };

  return rp(options)
    .then(function(xml) {
      return parseString(xml);
    }).then(function(result) {
      if (result.root === '') {
        return [];
      } else if (result.root.hasOwnProperty("metadata")) {
        return _.map(result.root.metadata, function(item){
          var newItem = item.$;
    //       { stop_code: 'WST',
    // special_msg_id: '574',
    // msg_tc: '緊急事故，服務暫停',
    // msg_en: 'Due to emergency, service suspended',
    // start_dt: 'Jun 20 2016  8:49PM',
    // end_dt: '',
    // update_dt: 'Jun 20 2016  8:49PM' }
          newItem.start_date = newItem.start_dt.length === 0 ? null : newItem.start_dt;
          newItem.end_date = newItem.end_dt.length === 0 ? null : newItem.end_dt;
          newItem.update_date = newItem.update_dt.length === 0 ? null : newItem.update_dt;
          delete newItem.start_dt;
          delete newItem.end_dt;
          delete newItem.update_dt;
          return newItem;
        });
      }
    });
};

Tram.prototype.getServiceUpdates = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/' + this.options.lang + '/service-updates/',
    headers: {
      'User-Agent': this.options.userAgent
    },
  };

  return rp(options)
    .then(function(html) {
      return cheerio.load(html);
    }).then(function($) {
        var items = [];
        //console.log($('div#serviceUpdate table tr').children());
        $('div#serviceUpdate table').children('tr').each(function() {
          var item = {};
          item.id = $(this).attr('data-id');
          $(this).children('td').each(function(i, elem) {
            var td = $(this);
            if (td.hasClass('date')) {
              item.date = td.text().trim();
            } else if (td.hasClass('subject')) {
              item.subject = td.text().trim();
            } else if (td.attr('data-id')) {
              item.id = td.attr('data-id').trim();
            }
          });
          items.push(item);
        });
        return items;
    }).then(function(items) {
      return Promise.map(items, function(item) {
        var options = {
          method: 'GET',
          baseUrl: 'http://hktramways.com',
          uri: '/' + this.options.lang + '/service-updates-detail/' + item.id + '/1'
        };

        return rp(options)
          .then(function(html) {
            return cheerio.load(html, {
              normalizeWhitespace: true,
              xmlMode: true
            });
          }).then(function($) {
            item.details_html = $('div#serviceUpdate dl dd div.desc').html().trim();
            // Promise.map awaits for returned promises as well.
            return item;
          });
      });
    });
};

Tram.prototype.getFares = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/' + this.options.lang + '/schedules-fares/',
    headers: {
      'User-Agent': this.options.userAgent
    },
  };

  return rp(options)
    .then(function(html) {
      return cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: true
      });
    }).then(function($) {
      var fares = [];
      $('div.fares table').children('tr').each(function() {
        var fare = {};
        $(this).children('td').each(function(i) {
          switch (i) {
            case 0:
              fare.type = $(this).text().trim();
              if (fare.type.substring(fare.type.length -1, fare.type.length) === '*')
                fare.type = fare.type.slice(0, fare.type.length - 1);
              break;
            case 1:
              fare.price = parseFloat($(this).text().trim().slice(1));
              break;
          }
        });
        fares.push(fare);
      });
      return fares;
    });
};

Tram.prototype.getSchedules = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://hktramways.com',
    uri: '/' + this.options.lang + '/schedules-fares/',
    headers: {
      'User-Agent': this.options.userAgent
    },
  };

  return rp(options)
    .then(function(html) {
      return cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: true
      });
    }).then(function($) {
      var schedules = [];
      $('div.tab2 table tbody').children('tr').each(function() {
        //console.log($(this).text());
        var schedule = {};
        $(this).children('td').each(function(i) {
          //console.log($(this).text());
          switch (i) {
            case 0:
              schedule = {
                start: $(this).children('span').eq(0).text().trim(),
                end: $(this).children('span').eq(1).text().trim(),
                direction: Tram.WEST_DIRECTION,
                timetable: {
                  mon_fri: {},
                  sat: {},
                  sun_ph: {}
                }
              };
              break;
            case 2:
              schedule.timetable.mon_fri.first = $(this).find('p').eq(0).text().trim();
              schedule.timetable.mon_fri.last = $(this).find('p').eq(1).text().trim();
              break;
            case 3:
              schedule.timetable.sat.first = $(this).find('p').eq(0).text().trim();
              schedule.timetable.sat.last = $(this).find('p').eq(1).text().trim();
              break;
            case 4:
              schedule.timetable.sun_ph.first = $(this).find('p').eq(0).text().trim();
              schedule.timetable.sun_ph.last = $(this).find('p').eq(1).text().trim();
              break;
          }
        });
        schedules.push(schedule);
      });
      $('div.tab3 table tbody').children('tr').each(function() {
        //console.log($(this).text());
        var schedule = {};
        $(this).children('td').each(function(i) {
          //console.log($(this).text());
          switch (i) {
            case 0:
              schedule = {
                start: $(this).children('span').eq(0).text().trim(),
                end: $(this).children('span').eq(1).text().trim(),
                direction: Tram.EAST_DIRECTION,
                timetable: {
                  mon_fri: {},
                  sat: {},
                  sun_ph: {}
                }
              };
              break;
            case 2:
              schedule.timetable.mon_fri.first = $(this).find('p').eq(0).text().trim();
              schedule.timetable.mon_fri.last = $(this).find('p').eq(1).text().trim();
              break;
            case 3:
              schedule.timetable.sat.first = $(this).find('p').eq(0).text().trim();
              schedule.timetable.sat.last = $(this).find('p').eq(1).text().trim();
              break;
            case 4:
              schedule.timetable.sun_ph.first = $(this).find('p').eq(0).text().trim();
              schedule.timetable.sun_ph.last = $(this).find('p').eq(1).text().trim();
              break;
          }
        });
        schedules.push(schedule);
      });
      return schedules;
    });
};

module.exports = Tram;
