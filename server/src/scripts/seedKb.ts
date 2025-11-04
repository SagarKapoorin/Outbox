import fs from 'fs';
import path from 'path';
import pino from 'pino';
import 'dotenv/config';
import { connectMongo } from '../utils/mongo.js';
import { embed, KBModel } from '../ai/rag.js';
import { KB_TEXT } from '../seed/kbText.js';

const log = pino();
async function main() {
  await connectMongo(log);
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  let text: string;
  const directText = getArg('text') || process.env.KB_TEXT;
  if ((KB_TEXT || '').trim().length > 0) {
    text = KB_TEXT;
    log.info('Seeding KB from embedded constant');
  } else if (directText && directText.trim().length > 0) {
    text = directText;
    log.info('Seeding KB from direct text input');
  } else {
    const file = getArg('file') || path.join(process.cwd(), 'seed', 'kb.txt');
    text = fs.readFileSync(file, 'utf8');
    log.info({ file }, 'Seeding KB from file');
  }
  const chunks = text.split(/\n\n+/).map((t) => t.trim()).filter(Boolean);
  for (const ch of chunks) {
    const vec = await embed(ch);
    await KBModel.create({ text: ch, embedding: vec });
  }
  log.info({ chunks: chunks.length }, 'KB seeded');
}

main().then(() => process.exit(0));
