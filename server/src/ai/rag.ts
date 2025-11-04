import OpenAI from 'openai';
import mongoose, { Schema } from 'mongoose';
import { env } from '../utils/config.js';

interface KBDoc extends mongoose.Document {
  text: string;
  embedding: number[];
}

const KBSchema = new Schema<KBDoc>({
  text: { type: String, required: true },
  embedding: { type: [Number], index: '2dsphere', required: true }
});

export const KBModel = mongoose.model<KBDoc>('KB', KBSchema);

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

export async function embed(text: string) {
  const res = await getClient().embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding as number[];
}

export async function suggestReply(contextText: string, email: { subject?: string; body?: string }) {
  const kb = await KBModel.find({}).limit(50).lean();
  //simple local vector similarity (cosine) as a fallback when Atlas Vector Search is not configured here.
  const emailVec = await embed(contextText + '\n' + (email.body || ''));
  const top = kb
    .map((d) => ({ d, score: cosineSim(emailVec, d.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const context = top.map((t) => t.d.text).join('\n---\n');
  const prompt = `You are an outreach assistant. Use the following context to draft a concise, polite reply.\nContext:\n${context}\n---\nEmail Subject: ${email.subject || ''}\nEmail Body: ${email.body || ''}\nReply:`;
  const res = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });
  return { reply: res.choices[0]?.message?.content || '', references: top.map((t) => ({ id: t.d._id, score: t.score })) };
}

function cosineSim(a: number[], b: number[]) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return na && nb ? dot / (na * nb) : 0;
}
