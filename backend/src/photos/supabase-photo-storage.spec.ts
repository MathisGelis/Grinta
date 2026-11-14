import { ServiceUnavailableException } from '@nestjs/common';
import { createServer, IncomingMessage, Server } from 'http';
import { AddressInfo } from 'net';
import { SupabasePhotoStorage } from './supabase-photo-storage';

/**
 * A stand-in for the Supabase Storage REST API, with the routes, headers and
 * bodies the official client (storage-js) uses. It checks the requests the
 * driver sends; the round trip against a real project is `npm run
 * photos:setup`.
 */
class FakeStorage {
  objects = new Map<string, Buffer>();
  requests: Array<{
    method: string;
    url: string;
    headers: IncomingMessage['headers'];
  }> = [];
  failNext = 0;
  server: Server;
  url = '';

  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];

      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks);
        const url = req.url ?? '';

        this.requests.push({
          method: req.method ?? '',
          url,
          headers: req.headers,
        });
        if (this.failNext > 0) {
          this.failNext--;
          res.writeHead(500).end('{"error":"boom"}');
          return;
        }
        const upload = /^\/storage\/v1\/object\/photos\/(.+)$/.exec(url);
        const publicRead = /^\/storage\/v1\/object\/public\/photos\/(.+)$/.exec(
          url,
        );

        if (req.method === 'POST' && url === '/storage/v1/object/list/photos') {
          const { prefix, limit, offset } = JSON.parse(body.toString());
          const names = [...this.objects.keys()]
            .filter((k) => k.startsWith(`${prefix}/`))
            .sort()
            .slice(offset, offset + limit);

          res.writeHead(200, { 'Content-Type': 'application/json' }).end(
            JSON.stringify(
              names.map((k) => ({
                name: k.slice(prefix.length + 1),
                id: 'id-' + k,
                created_at: '2026-01-01T00:00:00Z',
              })),
            ),
          );
        } else if (req.method === 'POST' && upload) {
          if (this.objects.has(upload[1])) res.writeHead(409).end();
          else {
            this.objects.set(upload[1], body);
            res.writeHead(200).end(`{"Key":"photos/${upload[1]}"}`);
          }
        } else if (
          req.method === 'DELETE' &&
          url === '/storage/v1/object/photos'
        ) {
          for (const key of JSON.parse(body.toString()).prefixes)
            this.objects.delete(key);
          res.writeHead(200).end('[]');
        } else if (
          req.method === 'GET' &&
          publicRead &&
          this.objects.has(publicRead[1])
        ) {
          res
            .writeHead(200, { 'Content-Type': 'image/webp' })
            .end(this.objects.get(publicRead[1]));
        } else res.writeHead(404).end();
      });
    });
    await new Promise<void>((r) => this.server.listen(0, '127.0.0.1', r));
    this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }

  stop() {
    return new Promise((r) => this.server.close(r));
  }
}

describe('SupabasePhotoStorage', () => {
  const fake = new FakeStorage();
  const storage = (serviceKey = 'eyJ.legacy.jwt') =>
    new SupabasePhotoStorage({ url: fake.url, serviceKey, bucket: 'photos' });

  beforeAll(() => fake.start());
  afterAll(() => fake.stop());
  beforeEach(() => {
    fake.objects.clear();
    fake.requests = [];
    fake.failNext = 0;
  });

  it('uploads under a random key and returns the public URL, which serves the photo', async () => {
    const url = await storage().save('workout', Buffer.from('webp-bytes'));

    expect(url).toMatch(
      new RegExp(
        `^${fake.url}/storage/v1/object/public/photos/workouts/[0-9a-f-]{36}\\.webp$`,
      ),
    );
    const upload = fake.requests[0];

    expect(upload.method).toBe('POST');
    expect(upload.headers['content-type']).toBe('image/webp');
    expect(upload.headers['cache-control']).toBe('max-age=31536000');
    expect(upload.headers['x-upsert']).toBe('false');
    expect(upload.headers.apikey).toBe('eyJ.legacy.jwt');
    expect(upload.headers.authorization).toBe('Bearer eyJ.legacy.jwt');
    const read = await fetch(url);

    expect(await read.text()).toBe('webp-bytes');
  });

  it('sends a new secret key only as apikey, never as a bearer token', async () => {
    await storage('sb_secret_abc').save('avatar', Buffer.from('x'));

    expect(fake.requests[0].headers.apikey).toBe('sb_secret_abc');
    expect(fake.requests[0].headers.authorization).toBeUndefined();
  });

  it('deletes by key, whatever the URL prefix, and only its own files', async () => {
    const url = await storage().save('avatar', Buffer.from('x'));

    await storage().remove(url);
    await storage().remove('https://evil.example/avatars/../../secret');
    await storage().remove(null);
    expect(fake.objects.size).toBe(0);
    expect(fake.requests.filter((r) => r.method === 'DELETE')).toHaveLength(1);
  });

  it('lists every stored photo, page after page', async () => {
    for (let i = 0; i < 3; i++)
      await storage().save('avatar', Buffer.from('a'));
    await storage().save('workout_thumbnail', Buffer.from('w'));

    const files = await storage().list();

    expect(files.map((f) => f.key.split('/')[0]).sort()).toEqual([
      'avatars',
      'avatars',
      'avatars',
      'workouts',
    ]);
    expect(
      files.every((f) =>
        /^(avatars|workouts)\/[0-9a-f-]{36}\.webp$/.test(f.key),
      ),
    ).toBe(true);
  });

  it('answers 503 in French when the upload fails, and never throws on a failed delete', async () => {
    fake.failNext = 1;
    await expect(
      storage().save('avatar', Buffer.from('x')),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    fake.failNext = 1;
    await expect(
      storage().remove(
        `${fake.url}/storage/v1/object/public/photos/avatars/00000000-0000-4000-8000-000000000000.webp`,
      ),
    ).resolves.toBeUndefined();
  });
});
