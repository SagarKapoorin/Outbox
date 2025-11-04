import OpenAI from 'openai';
import { env } from '../utils/config.js';

const LABELS = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'] as const;
export type Label = typeof LABELS[number];

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

export async function categorizeEmail(subject: string, body: string): Promise<Label | null> {
  if (!env.OPENAI_API_KEY) return null;
  const prompt = `You are a strict email classifier. Choose one label exactly from the set: ${LABELS.join(
    ', '
  )}.\nSubject: ${subject}\nBody: ${body}\nRespond with label only.`;
  const res = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  });
  const label = (res.choices[0]?.message?.content || '').trim();
  return (LABELS as readonly string[]).includes(label) ? (label as Label) : null;
}
