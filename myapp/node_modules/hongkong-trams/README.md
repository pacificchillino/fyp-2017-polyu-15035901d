Hong Kong Tramways Unofficial API
=====================================

## What is this for?

Trams are a special and historic means of transport in Hong Kong. They are cheap, fun and generally reliable. However there isn"t an easy way to access information about them until recently. Hong Kong Tramways have made public next tram, schedule and fare information available online. This is an easy module to get the data so you can automate things.

For example, you could have a display at home with real-time next tram info.


## Install

`npm install --save hongkong-trams`


## Usage

When creating the instance, you can pass some options, for now, only the language code is supported, possible values are "en" English, "tc" Traditional Chinese or "sc" Simplified Chinese.

```javascript
var HongKongTrams = require("hongkong-trams");

var trams = HongKongTrams();

trams.getNextTramETA("92W").then(function(eta){
    console.log(eta);
});
```

By default a new random useragent string is generated when the object is created. If you want to override this, please pass your useragent string into the options, for example:

```javascript
var trams = HongKongTrams({userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'});
```

## Supported Methods

* [`getTramStops()`](examples/getTramStops.js)
* [`getNextTramETA(stopCode)`](examples/getNextTramETA.js)
* [`getEmergencyMessageForTramStop(stopCode)`](examples/getEmergencyMessageForTramStop.js)
* [`getServiceUpdates()`](examples/getServiceUpdates.js)
* [`getFares()`](examples/getFares.js)
* [`getSchedules()`](examples/getSchedules.js)


## Example data

All methods return JSON, please see the examples linked above for more info on how to call each method. Here is an example of what get

```json
[ { "arrive_in_minute": "9",
    "arrive_in_second": "509",
    "is_arrived": false,
    "stop_code": "92W",
    "seq": "1",
    "tram_id": "60",
    "dest_stop_code": "KTT",
    "tram_dest_tc": "堅尼地城總站",
    "tram_dest_en": "Kennedy Town Terminus",
    "is_last_tram": false,
    "eta": "Jun 23 2016 10:21AM" },
  { "arrive_in_minute": "13",
    "arrive_in_second": "758",
    "is_arrived": false,
    "stop_code": "92W",
    "seq": "2",
    "tram_id": "168",
    "dest_stop_code": "KTT",
    "tram_dest_tc": "堅尼地城總站",
    "tram_dest_en": "Kennedy Town Terminus",
    "is_last_tram": false,
    "eta": "Jun 23 2016 10:25AM" },
  { "arrive_in_minute": "16",
    "arrive_in_second": "907",
    "is_arrived": false,
    "stop_code": "92W",
    "seq": "3",
    "tram_id": "92",
    "dest_stop_code": "KTT",
    "tram_dest_tc": "堅尼地城總站",
    "tram_dest_en": "Kennedy Town Terminus",
    "is_last_tram": false,
    "eta": "Jun 23 2016 10:28AM" } ]
```

## Other Handy Modules

* [hongkong-weather](https://www.github.com/hongkongkiwi/node-hongkong-weather) - For Hong Kong Weather Information.
* [hongkong-pollution](https://www.github.com/hongkongkiwi/node-hongkong-pollution) - For Hong Kong Pollution Information.


## Contributing

Feel free to submit any pull requests or add functionality, I"m usually pretty responsive.

If you like the module, please consider donating some bitcoin or litecoin.

__Bitcoin__

![LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW](http://i.imgur.com/9rsCfv5.png?1)

__LiteCoin__

![LNzdZksXcCF6qXbuiQpHPQ7LUeHuWa8dDW](http://i.imgur.com/yF1RoHp.png?1)
