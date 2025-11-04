import { ImapFlow, type ImapFlowOptions } from 'imapflow';
import { simpleParser } from 'mailparser';
import pino from 'pino';
import { env, type ImapAccountConfig } from '../utils/config.js';
import { EmailModel } from '../models/email.js';
import { es, EMAIL_INDEX } from '../utils/elasticsearch.js';
import { categorizeEmail } from '../ai/categorize.js';
import { notifyInterested } from '../notifications/slack.js';
import { triggerInterestedWebhook } from '../notifications/webhook.js';

function sinceDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export class ImapManager {
  private accounts: ImapAccountConfig[];
  private log: pino.Logger;
  private clients = new Map<string, ImapFlow>();

  constructor(accounts: ImapAccountConfig[], log: pino.Logger) {
    this.accounts = accounts;
    this.log = log.child({ mod: 'imap' });
  }

  async start() {
    await Promise.all(this.accounts.map((a) => this.connectAccount(a)));
  }

  private async connectAccount(acc: ImapAccountConfig) {
    const imapLogger = (() => {
      const lvl = (env.IMAPFLOW_LOG || 'none').toLowerCase();
      if (['none', 'false', 'off'].includes(lvl)) return false as any;
      const child = this.log.child({ src: 'imapflow' });
      child.level = lvl;
      return child as any;
    })();

    const client = new ImapFlow({
      host: acc.host,
      port: acc.port,
      secure: acc.secure,
      auth: { user: acc.user, pass: acc.pass },
      logger: imapLogger
    } as ImapFlowOptions);
    // console.log('Connecting IMAP account:', acc.id);
    this.clients.set(acc.id, client);
    // console.log( acc.id);
    client.on('error', (err) => this.log.error({ err, acc: acc.id }, 'IMAP error'));
    await client.connect();
    this.log.info({ acc: acc.id }, 'IMAP connected');
    await this.syncMailbox(client, acc, 'INBOX');
    client.on('exists', async () => {
      try {
        await this.syncMailbox(client, acc, 'INBOX');
      } catch (e) {
        this.log.error({ err: e, acc: acc.id }, 'exists handler failed');
      }
    });
  }

  private async syncMailbox(client: ImapFlow, acc: ImapAccountConfig, folder: string) {
    const lock = await client.getMailboxLock(folder);
    try {
      const since = sinceDate(30);
      const searchRes = await client.search({ since });
      const seqs: number[] = Array.isArray(searchRes) ? searchRes : [];
      if (seqs.length === 0) {
        this.log.info({ acc: acc.id, folder, synced: 0 }, 'sync complete (no messages)');
      } else {
        const range = `${Math.min(...seqs)}:${Math.max(...seqs)}`;
        for await (const msg of client.fetch(range, { source: true, envelope: true, internalDate: true })) {
          const messageId = (msg.envelope?.messageId as string) || `${acc.id}-${folder}-${msg.uid}`;
          // console.log(messageId);
          await this.processMessage(acc, folder, msg.uid as number, messageId, msg.source as Buffer, msg.internalDate as Date);
        }
        this.log.info({ acc: acc.id, folder, synced: seqs.length }, 'sync complete');
      }
    } finally {
      lock.release();
    }
  }

  private async processMessage(acc: ImapAccountConfig, folder: string, uid: number, messageId: string, raw: Buffer, internalDate?: Date) {
    const parsed = await simpleParser(raw);
    const fromText = addressText(parsed.from as any);
    const toText = addressText(parsed.to as any);
    const id = `${acc.id}:${folder}:${uid}`;
    const doc = {
      id,
      accountId: acc.id,
      folder,
      messageId,
      uid,
      subject: parsed.subject || '',
      from: fromText,
      to: toText,
      date: internalDate || parsed.date || new Date(),
      text: parsed.text || '',
      html: parsed.html ? (typeof parsed.html === 'string' ? parsed.html : '') : '',
      labels: [] as string[]
    };

    await EmailModel.updateOne({ id }, doc, { upsert: true });
    // console.log("hit1")
    await es.index({ index: EMAIL_INDEX, id, document: doc, refresh: false });

    try {
      const label = await categorizeEmail(doc.subject, doc.text);
      if (label) {
        await EmailModel.updateOne({ id }, { $addToSet: { labels: label } });
        await es.update({ index: EMAIL_INDEX, id, doc: { labels: [label] } });
        this.log.info({ id, label }, 'email labeled');
        if (label === 'Interested') {
          try {
            await notifyInterested({ id, subject: doc.subject, from: doc.from });
            await triggerInterestedWebhook({ id, subject: doc.subject, from: doc.from });
            this.log.info({ id }, 'interested notifications sent');
          } catch (notifyErr) {
            this.log.warn({ err: notifyErr as any, id }, 'notification failed');
          }
        }
      }
    } catch (e) {
      this.log.warn({ err: e as any, id }, 'categorization failed');
    }
  }
}

function addressText(a: any): string {
  if (!a) return '';
  if (Array.isArray(a)) return a.map(addressText).filter(Boolean).join(', ');
  if (typeof a.text === 'string') return a.text;
  if (Array.isArray(a.value)) {
    return a.value
      .map((v: any) => (v?.name ? `${v.name} <${v.address}>` : v?.address || ''))
      .filter(Boolean)
      .join(', ');
  }
  return '';
}
