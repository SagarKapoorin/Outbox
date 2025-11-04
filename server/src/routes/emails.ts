import { Router } from 'express';
import { es, EMAIL_INDEX } from '../utils/elasticsearch.js';
import { EmailModel } from '../models/email.js';
import { suggestReply } from '../ai/rag.js';

const router = Router();

router.get('/', async (req, res) => {
  // console.log("hitting email route")
  const { q, account, folder, from, to, label, page = '0', size = '25' } = req.query as Record<string, string>;
  const must: any[] = [];
  if (q) {
    must.push({ multi_match: { query: q, fields: ['subject^2', 'text', 'html'] } });
  }
  if (account) must.push({ term: { accountId: account } });
  if (folder) must.push({ term: { folder } });
  if (label) must.push({ term: { labels: label } });
  if (from || to) {
    const range: any = { date: {} };
    if (from) range.date.gte = from;
    if (to) range.date.lte = to;
    must.push({ range });
  }
  // console.log("hitting email route 2")
  const query = must.length ? { bool: { must } } : { match_all: {} };
  const fromIdx = parseInt(page) * parseInt(size);
  const { hits } = await es.search({ index: EMAIL_INDEX, from: fromIdx, size: parseInt(size), body: { query } });
  res.json({
    total: (hits.total as any)?.value ?? 0,
    items: (hits.hits as any[]).map((h) => ({ id: h._id, ...(h._source || {}) }))
  });
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const doc = await EmailModel.findOne({ id }).lean();
  if (!doc) return res.status(404).json({ error: 'Not Found' });
  res.json(doc);
});

router.post('/:id/label', async (req, res) => {
  const id = req.params.id;
  const { label } = req.body as { label: string };
  if (!label) return res.status(400).json({ error: 'label required' });
  const updated = await EmailModel.findOneAndUpdate({ id }, { $addToSet: { labels: label } }, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not Found' });
  await es.update({ index: EMAIL_INDEX, id, doc: { labels: updated.labels } });
  res.json(updated);
});

router.post('/:id/suggest-reply', async (req, res) => {
  const id = req.params.id;
  const doc = await EmailModel.findOne({ id }).lean();
  if (!doc) return res.status(404).json({ error: 'Not Found' });
  const result = await suggestReply('Product and outreach agenda', {
    subject: doc.subject,
    body: doc.text || doc.html || ''
  });
  res.json(result);
});

export default router;
