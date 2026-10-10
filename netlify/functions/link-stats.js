import { eventsStore, getLink, json, requestSlug, sha256 } from './_shared.js';

export default async (request, context) => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, { allow: 'GET' });

  const slug = requestSlug(request, context, 'link-stats');
  const link = await getLink(slug);
  const key = request.headers.get('x-nod-key') || '';
  if (!link || !key || await sha256(key) !== link.manageKeyHash) {
    return json({ error: 'Not found or management key invalid.' }, 404);
  }

  const store = eventsStore();
  const prefix = `click:${slug}:`;
  const page = await store.list({ prefix });
  const items = page.blobs || [];
  const recentKeys = items.slice(-250).reverse().map(item => item.key);
  const events = (await Promise.all(recentKeys.map(keyName => store.get(keyName, { type: 'json' })))).filter(Boolean);

  return json({ clicks: items.length, events });
};
