import OpenAI from 'openai';
import mongoose, { Schema } from 'mongoose';
import { env } from '../utils/config.js';

interface KBDoc extends mongoose.Document {
  text: string;
  embedding: number[];
}

const KBSchema = new Schema<KBDoc>({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
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
  const emailVec = await embed(contextText + '\n' + (email.body || ''));
  const results: Array<{ _id: any; text: string; score: number }> = await KBModel.aggregate([
    {
      $vectorSearch: {
        index: env.KB_VECTOR_INDEX || 'kb_embedding_index',
        path: 'embedding',
        queryVector: emailVec,
        numCandidates: 200,
        limit: 4
      }
    },
    {
      $project: {
        text: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).exec();

  const top = results.map((r) => ({ id: r._id, text: r.text, score: r.score }));
  // console.log('RAG top results:', top);
  const context = top.map((t) => t.text).join('\n---\n');
  const prompt = `You are an outreach assistant. Use the following context to draft a concise, polite reply.\nContext:\n${context}\n---\nEmail Subject: ${email.subject || ''}\nEmail Body: ${email.body || ''}\nReply:`;
  const res = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });
  return { reply: res.choices[0]?.message?.content || '', references: top.map((t) => ({ id: t.id, score: t.score })) };
}
