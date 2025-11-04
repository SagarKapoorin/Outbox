import fs from 'fs';
import path from 'path';
import pino from 'pino';
import 'dotenv/config';
import { connectMongo } from '../utils/mongo.js';
import { embed, KBModel } from '../ai/rag.js';

const log = pino();

async function main() {
  await connectMongo(log);
  const file = path.join(process.cwd(), 'seed', 'kb.txt');
  const text = fs.readFileSync(file, 'utf8');
  const chunks = text.split(/\n\n+/).map((t) => t.trim()).filter(Boolean);
  for (const ch of chunks) {
    const vec = await embed(ch);
    await KBModel.create({ text: ch, embedding: vec });
  }
  log.info({ chunks: chunks.length }, 'KB seeded');
}

main().then(() => process.exit(0));
