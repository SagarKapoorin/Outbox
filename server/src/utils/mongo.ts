import mongoose from 'mongoose';
import type pino from 'pino';
import { env } from './config.js';

export async function connectMongo(log: pino.Logger) {
  await mongoose.connect(env.MONGODB_URI);
  log.info('Mongo connected');
}
