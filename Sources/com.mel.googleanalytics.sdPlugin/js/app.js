/* global $SD */
$SD.on('connected', conn => connected(conn));

function connected (jsn) {
    debugLog('Connected Plugin:', jsn);

    /** subscribe to the willAppear event */
    $SD.on('com.mel.googleanalytics.action.willAppear', jsonObj =>
        action.onWillAppear(jsonObj)
    );
    $SD.on('com.mel.googleanalytics.action.willDisappear', jsonObj =>
        action.onWillDisappear(jsonObj)
    );
    $SD.on('com.mel.googleanalytics.action.keyUp', jsonObj =>
        action.onKeyUp(jsonObj)
    );
    $SD.on('com.mel.googleanalytics.action.sendToPlugin', jsonObj =>
        action.onSendToPlugin(jsonObj)
    );
}

var action = {
    type: 'com.mel.googleanalytics.action',
    cache: {},
    context: '',

    getContextFromCache: function (ctx) {
        return this.cache[ctx];
    },

    onWillAppear: function (jsn) {
        if (!this.cache.hasOwnProperty('gaReamtimeInstance')) {
            this.cache['gaReamtimeInstance'] = new GARealtime();
        }
        if (this.context === '') {
            this.context = jsn.context;
        }

        this.setTitle(this.cache['gaReamtimeInstance'].realTimeData);
    },

    onWillDisappear: function (jsn) {

    },

    onKeyUp: function (jsn) {
    },

    onSendToPlugin: function (jsn) {
        if (!jsn.payload) return;
        const gaRealtime = this.getContextFromCache('gaReamtimeInstance');

        if (jsn.payload.hasOwnProperty('startRequest')) {
            if (gaRealtime) {
                gaRealtime.startRequest(jsn.payload);
            }
        }
        else if (jsn.payload.hasOwnProperty('stopRequest')) {
            if (gaRealtime) {
                gaRealtime.stopRequest();
            }
        }
    },

    sendToPropertyInspector: function (payload) {
        if (!($.isEmptyObject(payload))) {
            $SD.api.sendToPropertyInspector(this.context, payload, this.type);
        }
    },

    setTitle: function (title) {
        $SD.api.setTitle(this.context, title, DestinationEnum.HARDWARE_AND_SOFTWARE);
    },

};

function GARealtime() {

    const URL_TO_GET_ACCESS_TOKEN = "https://www.googleapis.com/oauth2/v4/token",
        URL_TO_GET_DATA = "https://www.googleapis.com/analytics/v3/data/realtime",
        TOKEN_TIMEOUT = 3600000,
        MESSAGE_TYPE = Object.freeze({
            VALID: 'valid',
            INVALID: 'invalid',
            COUNT_DOWN: 'count down',
        });

    let timers = [], data = 0, initialRequest = true;

    function startRequest(payload) {
        stopRequest();

        // console.log('Start Requesting...');
        // Grant access, fetch API and set an interval of 1 hour
        getData(payload);

        // Refresh token every hour, infinitely
        let timerToGetData = setInterval(function () {
            getData(payload);
        }, TOKEN_TIMEOUT);

        timers.push(timerToGetData);
    }

    function stopRequest() {
        timers.forEach(timer => {
            clearInterval(timer);
        });
        timers = [];

        action.sendToPropertyInspector(getMessage('Connection terminated', MESSAGE_TYPE.VALID));
        // console.log('Stop Requesting...');
    }

    function getData(payload) {
        let jqxhrFromGrantAccess = grantAccessByKeys(payload);
        const interval = payload['interval'],
              metric = payload['metric'];

        // Get token when access granted
        $.when(jqxhrFromGrantAccess).done(function (response) {
            let accessToken = response['access_token'];

            // Fetch a quote and get the metric
            accessData(accessToken, payload);

            // Set up a timer to fetch every [INTERVAL] seconds until token expires
            let timerToFetchData = setInterval(function () {
                accessData(accessToken, payload);
            }, interval);

            timers.push(timerToFetchData);

            // Stop the call after token expires
            setTimeout(function(){
                clearInterval(timerToFetchData);
            }, TOKEN_TIMEOUT - interval);            // Need to -interval because the initial call is not within the timer
        })
    }

    function grantAccessByKeys(payload) {
        const REFRESH_TOKEN = payload['refreshToken'],
            CLIENT_ID = payload['clientId'],
            CLIENT_SECRET = payload['clientSecret'];

        let jqxhr = $.post(URL_TO_GET_ACCESS_TOKEN, {
                grant_type: 'refresh_token',
                refresh_token: REFRESH_TOKEN,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }, function(response) {
                action.sendToPropertyInspector(getMessage('Connecting...', MESSAGE_TYPE.VALID));
            })
            .done(function (response) {

            })
            .fail(function(response) {
                action.sendToPropertyInspector(getMessage('Failed to obtain an access token. Please check your keys.', MESSAGE_TYPE.INVALID));
            });

        return jqxhr;
    }

    function accessData(accessToken, payload) {
        $.ajax({
            url: URL_TO_GET_DATA,
            data: {
                ids: 'ga:' + payload['profileId'],
                metrics: 'rt:' + payload['metric'],
            },
            type: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'OAuth ' + accessToken)
            },
        }).done(function(response) {
            action.sendToPropertyInspector(getMessage('Connection established. Refresh metric in ', MESSAGE_TYPE.COUNT_DOWN));

            let requestedParam = data = response['totalsForAllResults']['rt:' + payload['metric']];      // This field should be changed if more metric options available
            action.setTitle(requestedParam);
            // console.log('Set value to ' + requestedParam + ' with access token ' + accessToken);
        }).fail(function (response) {
            action.sendToPropertyInspector(getMessage('Failed to fetch a quote. Please check your keys.', MESSAGE_TYPE.INVALID));
        })
    }

    function getMessage(message, type) {
        return {
            message: message,
            type: type,
        }
    }

    return {
        startRequest: startRequest,
        stopRequest: stopRequest,
        realTimeData: data,
    }

}

