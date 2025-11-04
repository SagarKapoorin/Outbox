import { Router } from 'express';
import { env } from '../utils/config.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(env.IMAP_ACCOUNTS.map((a) => ({ id: a.id, host: a.host, user: a.user })));
});

router.get('/folders', (_req, res) => {
  res.json([{ id: 'INBOX', name: 'INBOX' }]);
});

export default router;
