// Shared state lives in Upstash Redis (Vercel Marketplace → "Upstash for Redis").
// The assignment runs as one Lua script, so two people spinning at the same
// second can never get the same course.

export const COURSES = ['starter', 'main', 'dessert'];
export const MAX_PARTICIPANTS = 3;

const KEY_BY_PERSON = 'cineclub:by_person'; // normalized name -> course
const KEY_BY_COURSE = 'cineclub:by_course'; // course -> display name

const ASSIGN_LUA = `
local key = ARGV[1]
local display = ARGV[2]
local existing = redis.call('HGET', KEYS[1], key)
if existing then return {existing, '0'} end
for i = 3, #ARGV do
  if redis.call('HSETNX', KEYS[2], ARGV[i], display) == 1 then
    redis.call('HSET', KEYS[1], key, ARGV[i])
    return {ARGV[i], '1'}
  end
end
return {'FULL', '0'}
`;

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// In-memory fallback for local testing only. Never used on Vercel, where
// separate function instances would not share it.
const memory = { byPerson: new Map(), byCourse: new Map() };
const useMemory = !url || !token;
if (useMemory && process.env.VERCEL) {
  throw new Error('Redis is not configured: add Upstash for Redis to this Vercel project.');
}

export function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 30);
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function assign(displayName) {
  const key = displayName.toLowerCase();
  const order = shuffle(COURSES);

  if (useMemory) {
    const existing = memory.byPerson.get(key);
    if (existing) return { course: existing, isNew: false };
    const free = order.find((c) => !memory.byCourse.has(c));
    if (!free) return { course: null, isNew: false };
    memory.byCourse.set(free, displayName);
    memory.byPerson.set(key, free);
    return { course: free, isNew: true };
  }

  const [course, isNew] = await redis(['EVAL', ASSIGN_LUA, '2', KEY_BY_PERSON, KEY_BY_COURSE, key, displayName, ...order]);
  return course === 'FULL' ? { course: null, isNew: false } : { course, isNew: isNew === '1' };
}

export async function getBoard() {
  let flat;
  if (useMemory) {
    flat = [...memory.byCourse.entries()].flat();
  } else {
    flat = (await redis(['HGETALL', KEY_BY_COURSE])) || [];
  }
  const board = Object.fromEntries(COURSES.map((c) => [c, null]));
  for (let i = 0; i < flat.length; i += 2) board[flat[i]] = flat[i + 1];
  return board;
}

export async function reset() {
  if (useMemory) {
    memory.byPerson.clear();
    memory.byCourse.clear();
    return;
  }
  await redis(['DEL', KEY_BY_PERSON, KEY_BY_COURSE]);
}
