`Google Analytics Real Time` is a Stream Deck plugin that makes use of the Google Analytics Real-time API to show real-time reporting data.

# Description

This plugin allows you to monitor activity as it happens on your site or app.

# Features

- Display active users
- Display a specific goal completion
- Display all goal completions
- Display total events

![](screenshot.png)

# Installation

In the Release folder, find `com.mel.googleanalytics.streamDeckPlugin`, download it and then double-click this file on your machine, Stream Deck will install the plugin.

# How to Obtain Keys
- profile ID: https://docs.acquia.com/customer-data-platform/connectors/web-analytics-provider/google-analytics-profileid/
- client ID & secret:
    1. Login to Google Cloud Platform: https://console.cloud.google.com/apis/credentials
    2. Click 'Credentials' from the left sidebar
    3. Select the project you want to monitor and create an OAuth 2.0 credential
       ![howToGetClientIdAndSecret](https://user-images.githubusercontent.com/20979257/119291620-c67b2f00-bc1c-11eb-9825-9a2e43479c6d.png)

- refresh token: 
    1. Go to https://developers.google.com/oauthplayground/
    2. Click the gear icon on the top right, select the Use your own OAuth credentials checkbox. Enter the OAuth client ID and OAuth client secret obtained from previous step. Click Close
    3. From the left sidebar, select Google Analytics API v3, then click Authorize APIs.
       ![](https://user-images.githubusercontent.com/20979257/119291368-553b7c00-bc1c-11eb-9cbd-b1bd95102956.png)
