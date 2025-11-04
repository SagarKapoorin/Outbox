import axios from 'axios';
import { env } from '../utils/config.js';

export async function triggerInterestedWebhook(email: { id: string; subject?: string; from?: string }) {
  // console.log("hitting webhook")
  if (!env.INTERESTED_WEBHOOK_URL) return;
  await axios.post(env.INTERESTED_WEBHOOK_URL, {
    type: 'interested',
    email
  });
}

