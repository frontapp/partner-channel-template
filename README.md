# front-channel-template
A simple, runnable reference channel for working with Front's [Application Channel API](https://dev.frontapp.com/reference/channel-api).

## Disclaimer
This channel is a low-complexity reference implementation for integrating with Front's Application Channel API.
The code provided here does not reflect production-quality code nor should it be used as such.
Instead, this is a standalone and runnable server for understanding how to build a channel with Front's API.

## Tutorial
The Front Developer Portal provides an [in-depth tutorial](https://dev.frontapp.com/docs/getting-started-with-partner-channels) that details how to use this project to jump start the development of your channel integration. If you prefer to read a condensed quickstart for getting the project running, refer to the rest of this readme.

## Using the channel
###  Step 1: Install All Project Dependencies 

```shell
npm install --global yarn
yarn install
```

### Step 2: Configuration

Your channel can be configured by editing the necessary variables in `server.ts`.
You obtain the following values when you [create a channel type for an app](https://dev.frontapp.com/docs/create-and-manage-apps#create-a-channel-type) and then [view the OAuth credentials](https://dev.frontapp.com/docs/create-and-manage-apps#obtain-oauth-credentials-for-your-app) from Front:
* `frontId` - The App UID of the app that contains your channel type feature, as defined in the **Basic information** tab. Learn more about apps on our [Developer Portal](https://dev.frontapp.com/docs/create-and-manage-apps).
* `frontSecret` - The OAuth secret key of the app that contains your channel type.
* `callbackHostname` - The hostname that this channel will use when generating webhooks. If running the server locally,
we recommend using a tool like [ngrok](https://ngrok.com/) to proxy requests to localhost. This variable should be the public URL of your `ngrok` proxy.

**Tip:** You can leave the `frontUrl` with the default `https://api2.frontapp.com` value unless you've specifically been given a different subdomain to use by Front.

### Step 3: Start the development server

```shell
yarn start
```

Once you have the development server running alongside the host that generates webhooks (for development purposes, this might be an `ngrok` proxy), you can [connect your channel to an inbox in Front](https://dev.frontapp.com/docs/getting-started-with-partner-channels#step-4-add-your-channel-in-front).

## Reading through the code

This channel is written for the sake of learning and understanding Front's Application Channel API.
It is written using [TypeScript](https://www.typescriptlang.org/), [Node](https://nodejs.org/en/), with
routes provided by [ExpressJs](https://expressjs.com/).
While it is not necessary to be an expert in these technologies to understand the code, you may find it useful to briefly
familiarize yourself with them.

The project contains three main files, `server.ts`, `routes.ts`, `front_connector.ts`.

### `server.ts`
This file is relatively simple and simply contains the configuration values for our channel and initializing routes for the server.

### `routes.ts`
This file contains routes for all of the Front-facing endpoints needed to implement a basic channel.
Routes associated with the OAuth flow are prefixed with `/oauth`, while Front related to message events
from Front are prefixed with `/front`. Each route declaration contains a detailed comment about its functionality.

### `front_connector.ts`
This file contains utility functions for making requests to Front's API from your channel.

### Further reading
Refer to our [in-depth tutorial](https://dev.frontapp.com/docs/getting-started-with-partner-channels) for a detailed walkthrough of this project and how you can use it to facilitate the development of a Front application channel integration.
