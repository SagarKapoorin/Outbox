import { IncomingWebhook } from '@slack/webhook';
import { env } from '../utils/config.js';

let webhook: IncomingWebhook | null = null;

export async function notifyInterested(email: { subject?: string; from?: string; id: string }) {
  // console.log("hitting slack")
  if (!env.SLACK_WEBHOOK_URL) return;
  if (!webhook) webhook = new IncomingWebhook(env.SLACK_WEBHOOK_URL);
  await webhook.send({
    text: `New Interested email from ${email.from || 'unknown'}: ${email.subject || ''} (id: ${email.id})`
  });
}

