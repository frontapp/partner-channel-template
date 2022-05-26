import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { frontId, frontSecret, frontUrl, randomString } from './server';
import needle from 'needle';

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

  static buildToken(channelId: string) {
    const signature = frontSecret;
    const exp = moment.utc(Date.now()).add('10', 'seconds').unix();
    const payload = {
      iss: frontId,
      jti: randomString(8),
      sub: channelId,
      exp
    };

    return jwt.sign(payload, signature);
  }
}
