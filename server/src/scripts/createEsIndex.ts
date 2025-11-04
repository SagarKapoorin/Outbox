import pino from 'pino';
import { initElasticsearch } from '../utils/elasticsearch.js';

const log = pino();
initElasticsearch(log).then(() => process.exit(0));

