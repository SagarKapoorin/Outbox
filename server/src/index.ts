import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { env } from './utils/config.js';
import { connectMongo } from './utils/mongo.js';
import { initElasticsearch } from './utils/elasticsearch.js';
import { ImapManager } from './imap/imapManager.js';
import emailsRouter from './routes/emails.js';
import accountsRouter from './routes/accounts.js';

const log = pino({ name: 'onebox', level: env.LOG_LEVEL, base: undefined });

async function main() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/emails', emailsRouter);
  app.use('/accounts', accountsRouter);

  await connectMongo(log);
  await initElasticsearch(log);

  const imap = new ImapManager(env.IMAP_ACCOUNTS, log);
  imap.start().catch((e) => log.error({ err: e }, 'IMAP start error'));

  const port = env.PORT;
  app.listen(port, () => log.info({ port }, 'server listening'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
