import { Client } from '@elastic/elasticsearch';
import type pino from 'pino';
import { env } from './config.js';

export const es = new Client({ node: env.ELASTICSEARCH_NODE });

export const EMAIL_INDEX = 'emails';

export async function initElasticsearch(log: pino.Logger) {
  // console.log("hit init es")
  const exists = await es.indices
    .exists({ index: EMAIL_INDEX })
    .then((r: any) => (typeof r === 'boolean' ? r : r?.body ?? false))
    .catch(() => false);
  if (!exists) {
    await es.indices.create({
      index: EMAIL_INDEX,
      settings: {
        analysis: {
          analyzer: {
            default: { type: 'standard' }
          }
        }
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          accountId: { type: 'keyword' },
          folder: { type: 'keyword' },
          messageId: { type: 'keyword' },
          subject: { type: 'text' },
          from: { type: 'keyword' },
          to: { type: 'keyword' },
          date: { type: 'date' },
          text: { type: 'text' },
          html: { type: 'text' },
          labels: { type: 'keyword' }
        }
      }
      
    });
    log.info('Elasticsearch index created');
  }
}
