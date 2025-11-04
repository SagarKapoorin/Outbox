import 'dotenv/config';
import { z } from 'zod';

const ImapAccount = z.object({
  id: z.string(),
  host: z.string(),
  port: z.number().int(),
  secure: z.boolean(),
  user: z.string(),
  pass: z.string()
});

const schema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  MONGODB_URI: z.string(),
  ELASTICSEARCH_NODE: z.string().default('http://localhost:9200'),
  SLACK_WEBHOOK_URL: z.string().optional(),
  INTERESTED_WEBHOOK_URL: z.string().optional(),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  PORT: z.coerce.number().default(4000),
  IMAP_ACCOUNTS_JSON: z.string().default('[]'),
  KB_VECTOR_INDEX: z.string().default('kb_embedding_index')
});

const parsed = schema.parse(process.env);

export const env = {
  OPENAI_API_KEY: parsed.OPENAI_API_KEY,
  MONGODB_URI: parsed.MONGODB_URI,
  ELASTICSEARCH_NODE: parsed.ELASTICSEARCH_NODE,
  SLACK_WEBHOOK_URL: parsed.SLACK_WEBHOOK_URL,
  INTERESTED_WEBHOOK_URL: parsed.INTERESTED_WEBHOOK_URL,
  FRONTEND_ORIGIN: parsed.FRONTEND_ORIGIN,
  PORT: parsed.PORT,
  IMAP_ACCOUNTS: JSON.parse(parsed.IMAP_ACCOUNTS_JSON) as z.infer<typeof ImapAccount>[],
  KB_VECTOR_INDEX: parsed.KB_VECTOR_INDEX
};

export type ImapAccountConfig = z.infer<typeof ImapAccount>;
