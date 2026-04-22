
import { Router, Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import * as os from 'os';
import { callbackHostname, frontSecret, randomString } from './server';

const ChannelRouter = Router();

// FRONT ROUTES
ChannelRouter.use('/front', verifyFrontRequest);

/**
 * This route is called when a user in Front creates a new instance of this application channel.
 * We are expected to respond with a type of 'success' as well as a webhook URL that tells
 * Front where to send message sync updates about this channel.
 * 
 * In this implementation, we respond with /front/${randomString(16)}.
 */
ChannelRouter.post('/', async (req: Request, res: Response) => {
  if (req.body.type === 'list_addresses') {
    res.status(200).json({
      type: 'success',
      addresses: [
        {
          address: '+15551234',
          name: 'Support'
        }
      ],
      // Optional if you have more addresses to list
      pagination: {
        next_page_token: randomString(16)
      }
    })
  }
  
  if (req.body.type !== 'authorization') {
    res.send(400).json({ type: 'bad_request', message: 'Unknown type sent to channel' });
  }

  const webhookHostname = callbackHostname || os.hostname();
  const webhookId = randomString(16);
  const webhookUrl = `${webhookHostname}/front/${webhookId}`;
  console.log(`Creating webhook with URL ${webhookUrl} for channel with ID ${req.body.payload.channel_id}`);
 /**
  * If you want to sync messages from the external channel into Front, store the channel_id from 
  * req.body.payload.channel_id and maintain its value for use when you call the Channel API in the front_connector.ts file.
  */

  return res.status(200).json({
    type: 'success',
    webhook_url: webhookUrl,
  });
});

/**
 * This route is called whenever a message is sent from Front (either a new message _or_ an autoreply) OR
 * when a message was successfully imported and processed by Front.
 * 
 * We are expected to respond with an external_id which identifies the message as well as an external_conversation_id
 * which tells Front which conversation to thread that message into. Each conversation in Front contains a list of
 * conversation_ids which identify it. If we respond with _any_ of those IDs as the external_conversation_id, the message
 * will be threaded into that conversation.
 * 
 * Note that, in this implementation, we generate random external_ids and external_conversation_ids. 
 */
ChannelRouter.post('/front/:webhookId', async (req: Request, res: Response) => {
  if (!['message', 'message_autoreply', 'message_imported'].includes(req.body.type)) {
    return res.send(400).json({ type: 'bad_request', message: 'Unknown message type sent to channel' });
  }

  if (req.body.type === 'message_imported') {
    console.log('Message import notification received from Front');
    return res.status(200).json({});
  }

  console.log(`Received message from Front with ID ${req.body.payload.id}`);
  const external_id = randomString(16);
  const external_conversation_id = randomString(16);

  return res.status(200).json({
    type: 'success',
    external_id,
    external_conversation_id,
  });
});

/**
 * This route is called by Front whenever an instance of a channel is deleted by a user.
 */
ChannelRouter.delete('/front/:webhookId', async (req: Request, res: Response) => {
  if (req.body.type !== 'delete') {
    res.send(400).json({ type: 'bad_request', message: 'Unknown delete type sent to channel' });
  }

  console.log(`Channel with ID ${req.body.payload.channel_id} was deleted`);
  return res.sendStatus(200);
});

// OAUTH ROUTES

/**
 * If our channel is configured using OAuth, this route will be called by Front whenever a new channel
 * is instantiated in order to obtain an authorization code that can be exchanged for an access token in the future.
 * 
 * Note that this channel does not properly implement OAuth 2.0, and instead just responds with random credentials
 * for the sake of simplicity.
 */
ChannelRouter.get('/oauth/authorize', async (req: Request, res: Response) => {
  const frontRedirectUri = new URL(req.query.redirect_uri as string);
  const code = randomString(16);
  frontRedirectUri.searchParams.append('code', code);
  frontRedirectUri.searchParams.append('state', req.query.state as string);

  console.log('Returning authorization code to Front');
  return res.status(301).redirect(frontRedirectUri.toString());
});

/** 
 * Once Front has obtained an authorization code for our channel, it will call this endpoint to exchanged that
 * code for an access token (and, optionally, a refresh token).
 * 
 * Note that this channel does not properly implement OAuth 2.0, and instead just responds with random credentials
 * for the sake of simplicity. 
 */
ChannelRouter.post('/oauth/token', async (req: Request, res: Response) => {
  console.log('Returning access token to Front');
  return res.status(200).json({ access_token: randomString(32), refresh_token: randomString(32) });
});

/**
 * The following route handles token introspection for channel identification. If you are using private credentials,
 * you supply front_channel_name and front_channel_address. If you are using shared credentials, you supply
 * resource_owner_id and resource_owner_name. Both credential types support sending the active boolean.
 * 
 * To learn more, refer to https://dev.frontapp.com/docs/token-instrospection-for-channel-identification
 */
ChannelRouter.post('/oauth/token/introspect', async (req: Request, res: Response) => {
  console.log('Returning identity of the token to Front');
  return res.status(200).json({
    active: true,
    /* Private credentials
    front_channel_name: 'App Channel, Inc.',
    front_channel_address: randomString(16)
    /* End private credentials
    /* Shared credentials */
    resource_owner_id: randomString(16),
    resource_owner_name: 'App Channel, Inc.'
    /* End shared credentials */
  });
});

// HELPER FUNCTIONS
function verifyFrontRequest(req: Request, res: Response, next: NextFunction) {
  const timestamp = req.headers['x-front-request-timestamp'];
  const rawBody = JSON.stringify(req.body);
  const baseString = `${timestamp}:${rawBody}`;

  const hmac = createHmac('sha256', frontSecret)
    .update(baseString)
    .digest('base64');
    
  if (hmac !== req.headers['x-front-signature']) {
    return res.send(400).json({ type: 'bad_request', message: 'Signature not verified' });
  }

  next();
}

export default ChannelRouter;
