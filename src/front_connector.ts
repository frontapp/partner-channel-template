import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import needle from 'needle';
import { frontAppUid, frontSecret, frontUrl, randomString } from "./server";

export interface FrontSender {
    name?: string;
    handle: string;
}

interface FrontMessageMetadata {
    external_id: string;
    external_conversation_id: string;
}

interface AttachmentData {
    buffer: Buffer;
    filename: string;
    content_type: string;
}

interface BaseMessageRequest {
    body: string;
    subject?: string;
    metadata: FrontMessageMetadata;
    delivered_at?: number;
    attachments?: AttachmentData[];
}

interface InboundMessageRequest extends BaseMessageRequest {
    sender: FrontSender;
}

interface OutboundMessageRequest extends BaseMessageRequest {
    sender_name?: string;
    to: FrontSender;
}


export class FrontConnector {
  /**
	 * Sync the given message as an inbound message into Front on the given channel
	 *
	 * @param channelId ID of the channel to sync the message with
	 * @returns
	 */
  static async importInboundMessage(channelId: string, payload: InboundMessageRequest) {
    const endpoint = `${frontUrl}/channels/${channelId}/inbound_messages`;
    return this.makeChannelAPIRequest(channelId, endpoint, payload);
  }

  /**
	 * Sync the given message as an outbound message into Front on the given channel
	 *
	 * @param channelId ID of the channel to sync the message with
	 * @returns
	 */
  static async importOutboundMessage(channelId: string, payload: OutboundMessageRequest) {
    const endpoint = `${frontUrl}/channels/${channelId}/outbound_messages`;
    return this.makeChannelAPIRequest(channelId, endpoint, payload);
  }

  private static async makeChannelAPIRequest(channelId: string, path: string, payload: InboundMessageRequest | OutboundMessageRequest) {
    // If the payload has any attachments then we must send the request as multipart instead of application/json
    const hasAttachments = payload.attachments && payload.attachments.length > 0;
    const options = { headers: this.buildHeaders(channelId, hasAttachments), multipart: hasAttachments };

    return await needle('post', path, payload, options);
  }

  private static buildHeaders(channelId: string, hasAttachments?: boolean) {
    const frontToken = this.buildToken(channelId);
    return {
      Authorization: `Bearer ${frontToken}`,
      'Content-Type': hasAttachments ? 'multipart/from-data' : 'application/json',
    };
  }

  /**
   * Builds a JWT auth token for the given channel ID, for your application
   * See Authenticating Requests to Front docs for details:
   *   https://dev.frontapp.com/docs/creating-a-partner-channel#authenticating-requests-to-front
   * @param channelId (cha_123)
   * @returns Signed JWT
   */
  static buildToken(channelId: string) {
    const signature = frontSecret;
    const exp = moment.utc(Date.now()).add('10', 'seconds').unix();
    const payload = {
      iss: frontAppUid,
      jti: randomString(8),
      sub: channelId,
      exp
    };

    return jwt.sign(payload, signature);
  }
}
