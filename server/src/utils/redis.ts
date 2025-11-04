import type pino from 'pino';
import { createClient, type RedisClientType } from 'redis';
import { env } from './config.js';

let client: RedisClientType | null = null;
export async function initRedis(log: pino.Logger) {
  if (!env.REDIS_URL) {
    log.info('redis disabled (REDIS_URL not set)');
    return;
  }
  // console.log("hitting redis")
  client = createClient({ url: env.REDIS_URL });
  client.on('error', (err) => log.warn({ err }, 'redis error'));
  await client.connect();
  log.info('redis connected');
}
export function hasRedis() {
  return !!client;
}
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client) return null;
  const raw = await client.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
export async function cacheSet(key: string, value: any, ttlSeconds: number) {
  if (!client) return;
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}
export async function cacheDel(key: string) {
  if (!client) return;
  await client.del(key);
}
export async function checkRateLimit(ip: string, routeKey: string, max: number, windowSec: number) {
  if (!client) return true; 
  const key = `rl:${routeKey}:${ip}`;
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, windowSec);
  }
  return count <= max;
}

