import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import path from 'path';

loadEnv({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://stackdify:stackdify@localhost:5432/stackdify_dev',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ─── Component types ──────────────────────────────────────────────────────────

const componentTypes = [
  { slug: 'cdn',           label: 'CDN',              description: 'Content Delivery Network — caches static assets at edge locations',            category: 'networking' },
  { slug: 'dns',           label: 'DNS',              description: 'Domain Name System — translates domain names to IP addresses',                 category: 'networking' },
  { slug: 'load-balancer', label: 'Load Balancer',    description: 'Distributes incoming traffic across multiple servers',                         category: 'networking' },
  { slug: 'api-gateway',   label: 'API Gateway',      description: 'Single entry point for client requests, handles routing and auth',             category: 'networking' },
  { slug: 'app-server',    label: 'Application Server', description: 'Processes business logic and application code',                              category: 'compute'   },
  { slug: 'cache',         label: 'Cache',            description: 'In-memory data store for fast read access (e.g., Redis)',                      category: 'storage'   },
  { slug: 'relational-db', label: 'Relational DB',    description: 'Structured data storage with ACID guarantees (e.g., PostgreSQL)',              category: 'storage'   },
  { slug: 'nosql-db',      label: 'NoSQL DB',         description: 'Document or key-value store for flexible schemas (e.g., MongoDB)',             category: 'storage'   },
  { slug: 'message-queue', label: 'Message Queue',    description: 'Async message broker for decoupled services (e.g., Kafka)',                    category: 'messaging' },
  { slug: 'object-storage',label: 'Object Storage',   description: 'Stores unstructured files like images and videos (e.g., S3)',                  category: 'storage'   },
  { slug: 'search-engine', label: 'Search Engine',    description: 'Full-text search with indexing (e.g., Elasticsearch)',                         category: 'data'      },
  { slug: 'media-server',  label: 'Media Server',     description: 'Transcodes and streams video or audio content',                                category: 'media'     },
];

// ─── Instagram — 3 requirements (MEDIUM) ─────────────────────────────────────
//
// Req 1 — "Handle user traffic"
//   New nodes: User(actor), DNS, Load Balancer*, App Server 1*
//   Blanks: dns-1, lb-1
//
// Req 2 — "Serve and cache data"
//   New nodes: App Server 2*, Cache (Redis)*, Primary DB*
//   Blanks: app-2, cache-1, db-1
//   Cross-req edges: lb-1 → app-2
//
// Req 3 — "Store and deliver media"
//   New nodes: CDN (static)*, CDN (media)*, Object Storage*, Read Replica*
//   Blanks: cdn-1, cdn-2, obj-1, db-2
//   Cross-req edges: app-1/app-2 → obj-1, cdn-2 → obj-1, db-1 → db-2

const instagramReq1 = {
  order: 1,
  title: 'Handle user traffic',
  description: 'Route millions of daily requests through DNS and a load balancer to a fleet of application servers.',
  nodes: [
    { id: 'user-1', type: 'actor',     position: { x: 0,   y: 320 }, data: { label: 'User' } },
    { id: 'dns-1',  type: 'component', position: { x: 280, y: 200 }, data: { componentSlug: 'dns',           label: 'DNS' } },
    { id: 'lb-1',   type: 'component', position: { x: 560, y: 200 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
    { id: 'app-1',  type: 'component', position: { x: 840, y: 100 }, data: { componentSlug: 'app-server',    label: 'App Server 1' } },
  ],
  edges: [
    { id: 'e-u-dns',  source: 'user-1', target: 'dns-1',  label: 'DNS lookup' },
    { id: 'e-dns-lb', source: 'dns-1',  target: 'lb-1' },
    { id: 'e-lb-a1',  source: 'lb-1',   target: 'app-1' },
  ],
  answer: { 'dns-1': 'dns', 'lb-1': 'load-balancer' },
};

const instagramReq2 = {
  order: 2,
  title: 'Serve and cache data',
  description: 'Add a second app server, a Redis cache for hot data, and a relational database for persistent storage.',
  nodes: [
    { id: 'app-2',   type: 'component', position: { x: 840,  y: 340 }, data: { componentSlug: 'app-server',    label: 'App Server 2' } },
    { id: 'cache-1', type: 'component', position: { x: 1120, y: 100 }, data: { componentSlug: 'cache',          label: 'Cache (Redis)' } },
    { id: 'db-1',    type: 'component', position: { x: 1120, y: 340 }, data: { componentSlug: 'relational-db',  label: 'Primary DB' } },
  ],
  edges: [
    { id: 'e-lb-a2',   source: 'lb-1',   target: 'app-2' },
    { id: 'e-a1-ca',   source: 'app-1',  target: 'cache-1', label: 'read' },
    { id: 'e-a1-db',   source: 'app-1',  target: 'db-1',    label: 'write' },
    { id: 'e-a2-ca',   source: 'app-2',  target: 'cache-1', label: 'read' },
    { id: 'e-a2-db',   source: 'app-2',  target: 'db-1',    label: 'write' },
  ],
  answer: { 'app-2': 'app-server', 'cache-1': 'cache', 'db-1': 'relational-db' },
};

const instagramReq3 = {
  order: 3,
  title: 'Store and deliver media',
  description: 'Add CDNs for static assets and media, object storage for uploads, and a read replica for query offloading.',
  nodes: [
    { id: 'cdn-1', type: 'component', position: { x: 280,  y: 60  }, data: { componentSlug: 'cdn',            label: 'CDN (Static)' } },
    { id: 'cdn-2', type: 'component', position: { x: 280,  y: 500 }, data: { componentSlug: 'cdn',            label: 'CDN (Media)' } },
    { id: 'obj-1', type: 'component', position: { x: 1120, y: 560 }, data: { componentSlug: 'object-storage', label: 'Object Storage' } },
    { id: 'db-2',  type: 'component', position: { x: 1400, y: 340 }, data: { componentSlug: 'relational-db',  label: 'Read Replica' } },
  ],
  edges: [
    { id: 'e-u-cdn1',   source: 'user-1', target: 'cdn-1',  label: 'static assets' },
    { id: 'e-u-cdn2',   source: 'user-1', target: 'cdn-2',  label: 'media stream' },
    { id: 'e-a1-obj',   source: 'app-1',  target: 'obj-1',  label: 'upload' },
    { id: 'e-a2-obj',   source: 'app-2',  target: 'obj-1',  label: 'upload' },
    { id: 'e-cdn2-obj', source: 'cdn-2',  target: 'obj-1',  label: 'origin pull' },
    { id: 'e-db-rep',   source: 'db-1',   target: 'db-2',   label: 'replication' },
  ],
  answer: { 'cdn-1': 'cdn', 'cdn-2': 'cdn', 'obj-1': 'object-storage', 'db-2': 'relational-db' },
};

// ─── YouTube — 4 requirements (HARD) ─────────────────────────────────────────
//
// Req 1 — "Route viewer traffic"
//   New nodes: Viewer(actor), DNS*, CDN*, Load Balancer
//   Blanks: dns-1, cdn-1
//
// Req 2 — "Serve API requests"
//   New nodes: API Gateway*, App Server*
//   Cross-req edges: lb-1 → api-gw, lb-1 → app-1
//   Blanks: api-gw, app-1
//
// Req 3 — "Handle uploads and transcoding"
//   New nodes: Creator(actor), Message Queue*, Transcoder*
//   Cross-req edges: creator-1 → lb-1, app-1 → mq-1, mq-1 → media-1
//   Blanks: mq-1, media-1
//
// Req 4 — "Store and cache data"
//   New nodes: Cache*, Metadata DB*, Video Storage*
//   Cross-req edges: api-gw → cache-1, app-1 → db-1, media-1 → obj-1, cdn-1 → obj-1
//   Blanks: cache-1, db-1, obj-1

const youtubeReq1 = {
  order: 1,
  title: 'Route viewer traffic',
  description: 'Direct viewers from DNS through a CDN for edge caching, then to a central load balancer.',
  nodes: [
    { id: 'viewer-1', type: 'actor',     position: { x: 0,   y: 200 }, data: { label: 'Viewer' } },
    { id: 'dns-1',    type: 'component', position: { x: 300, y: 100 }, data: { componentSlug: 'dns',           label: 'DNS' } },
    { id: 'cdn-1',    type: 'component', position: { x: 300, y: 320 }, data: { componentSlug: 'cdn',           label: 'CDN' } },
    { id: 'lb-1',     type: 'component', position: { x: 600, y: 200 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
  ],
  edges: [
    { id: 'e-v-dns',  source: 'viewer-1', target: 'dns-1',  label: 'lookup' },
    { id: 'e-v-cdn',  source: 'viewer-1', target: 'cdn-1',  label: 'stream' },
    { id: 'e-dns-lb', source: 'dns-1',    target: 'lb-1' },
    { id: 'e-cdn-lb', source: 'cdn-1',    target: 'lb-1' },
  ],
  answer: { 'dns-1': 'dns', 'cdn-1': 'cdn' },
};

const youtubeReq2 = {
  order: 2,
  title: 'Serve API requests',
  description: 'Add an API gateway for routing and rate-limiting, backed by an application server for business logic.',
  nodes: [
    { id: 'api-gw', type: 'component', position: { x: 900, y: 80  }, data: { componentSlug: 'api-gateway', label: 'API Gateway' } },
    { id: 'app-1',  type: 'component', position: { x: 900, y: 320 }, data: { componentSlug: 'app-server',  label: 'App Server' } },
  ],
  edges: [
    { id: 'e-lb-gw',  source: 'lb-1', target: 'api-gw' },
    { id: 'e-lb-app', source: 'lb-1', target: 'app-1' },
  ],
  answer: { 'api-gw': 'api-gateway', 'app-1': 'app-server' },
};

const youtubeReq3 = {
  order: 3,
  title: 'Handle uploads and transcoding',
  description: 'Creators upload videos to the app server, which enqueues a transcoding job for the media server.',
  nodes: [
    { id: 'creator-1', type: 'actor',     position: { x: 0,    y: 500 }, data: { label: 'Creator' } },
    { id: 'mq-1',      type: 'component', position: { x: 1200, y: 320 }, data: { componentSlug: 'message-queue', label: 'Message Queue' } },
    { id: 'media-1',   type: 'component', position: { x: 1200, y: 520 }, data: { componentSlug: 'media-server',  label: 'Transcoder' } },
  ],
  edges: [
    { id: 'e-c-lb',    source: 'creator-1', target: 'lb-1',   label: 'upload' },
    { id: 'e-app-mq',  source: 'app-1',     target: 'mq-1',   label: 'enqueue job' },
    { id: 'e-mq-med',  source: 'mq-1',      target: 'media-1', label: 'transcode' },
  ],
  answer: { 'mq-1': 'message-queue', 'media-1': 'media-server' },
};

const youtubeReq4 = {
  order: 4,
  title: 'Store and cache data',
  description: 'Cache hot API responses in Redis, persist video metadata to a relational DB, and store video files in object storage.',
  nodes: [
    { id: 'cache-1', type: 'component', position: { x: 1200, y: 80  }, data: { componentSlug: 'cache',          label: 'Cache (Redis)' } },
    { id: 'db-1',    type: 'component', position: { x: 1500, y: 320 }, data: { componentSlug: 'relational-db',  label: 'Metadata DB' } },
    { id: 'obj-1',   type: 'component', position: { x: 1500, y: 520 }, data: { componentSlug: 'object-storage', label: 'Video Storage' } },
  ],
  edges: [
    { id: 'e-gw-ca',    source: 'api-gw',  target: 'cache-1', label: 'cache read' },
    { id: 'e-app-db',   source: 'app-1',   target: 'db-1',    label: 'metadata' },
    { id: 'e-med-obj',  source: 'media-1', target: 'obj-1',   label: 'store video' },
    { id: 'e-cdn-obj',  source: 'cdn-1',   target: 'obj-1',   label: 'origin pull' },
  ],
  answer: { 'cache-1': 'cache', 'db-1': 'relational-db', 'obj-1': 'object-storage' },
};

// ─── WhatsApp — 2 requirements (EASY) ────────────────────────────────────────
//
// Req 1 — "Route messaging traffic"
//   New nodes: User(actor), DNS*, Load Balancer*, App Server
//   Blanks: dns-1, lb-1
//
// Req 2 — "Store messages and media"
//   New nodes: Cache*, Relational DB*, Object Storage*
//   Blanks: cache-1, db-1, obj-1

const whatsappReq1 = {
  order: 1,
  title: 'Route messaging traffic',
  description: 'Resolve user requests via DNS, balance load across servers to handle hundreds of millions of concurrent connections.',
  nodes: [
    { id: 'user-1', type: 'actor',     position: { x: 0,   y: 250 }, data: { label: 'User' } },
    { id: 'dns-1',  type: 'component', position: { x: 280, y: 250 }, data: { componentSlug: 'dns',           label: 'DNS' } },
    { id: 'lb-1',   type: 'component', position: { x: 560, y: 250 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
    { id: 'app-1',  type: 'component', position: { x: 840, y: 250 }, data: { componentSlug: 'app-server',    label: 'App Server' } },
  ],
  edges: [
    { id: 'e-u-dns',  source: 'user-1', target: 'dns-1',  label: 'lookup' },
    { id: 'e-dns-lb', source: 'dns-1',  target: 'lb-1' },
    { id: 'e-lb-app', source: 'lb-1',   target: 'app-1' },
  ],
  answer: { 'dns-1': 'dns', 'lb-1': 'load-balancer' },
};

const whatsappReq2 = {
  order: 2,
  title: 'Store messages and media',
  description: 'Cache recent messages for fast delivery, persist chat history in a relational DB, and store photos and voice notes in object storage.',
  nodes: [
    { id: 'cache-1', type: 'component', position: { x: 1120, y: 100 }, data: { componentSlug: 'cache',          label: 'Cache (Redis)' } },
    { id: 'db-1',    type: 'component', position: { x: 1120, y: 280 }, data: { componentSlug: 'relational-db',  label: 'Message DB' } },
    { id: 'obj-1',   type: 'component', position: { x: 1120, y: 460 }, data: { componentSlug: 'object-storage', label: 'Media Storage' } },
  ],
  edges: [
    { id: 'e-app-ca',  source: 'app-1', target: 'cache-1', label: 'recent msgs' },
    { id: 'e-app-db',  source: 'app-1', target: 'db-1',    label: 'persist' },
    { id: 'e-app-obj', source: 'app-1', target: 'obj-1',   label: 'media upload' },
  ],
  answer: { 'cache-1': 'cache', 'db-1': 'relational-db', 'obj-1': 'object-storage' },
};

// ─── TikTok — 3 requirements (MEDIUM) ────────────────────────────────────────
//
// Req 1 — "Route mobile traffic"
//   New nodes: User(actor), DNS*, CDN*, Load Balancer
//   Blanks: dns-1, cdn-1
//
// Req 2 — "Serve the feed"
//   New nodes: API Gateway*, App Server*, NoSQL DB*
//   Cross-req edges: lb-1 → api-gw, lb-1 → app-1
//   Blanks: api-gw, app-1, nosql-1
//
// Req 3 — "Deliver short videos"
//   New nodes: Object Storage*, Media Server*, Cache*
//   Cross-req edges: app-1 → obj-1, obj-1 → media-1, media-1 → cdn-1, api-gw → cache-1
//   Blanks: obj-1, media-1, cache-1

const tiktokReq1 = {
  order: 1,
  title: 'Route mobile traffic',
  description: 'Resolve DNS, serve static content and video at the edge via CDN, and balance API requests across the backend.',
  nodes: [
    { id: 'user-1', type: 'actor',     position: { x: 0,   y: 300 }, data: { label: 'User' } },
    { id: 'dns-1',  type: 'component', position: { x: 280, y: 150 }, data: { componentSlug: 'dns',           label: 'DNS' } },
    { id: 'cdn-1',  type: 'component', position: { x: 280, y: 460 }, data: { componentSlug: 'cdn',           label: 'CDN' } },
    { id: 'lb-1',   type: 'component', position: { x: 560, y: 300 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
  ],
  edges: [
    { id: 'e-u-dns',  source: 'user-1', target: 'dns-1',  label: 'lookup' },
    { id: 'e-u-cdn',  source: 'user-1', target: 'cdn-1',  label: 'stream' },
    { id: 'e-dns-lb', source: 'dns-1',  target: 'lb-1' },
    { id: 'e-cdn-lb', source: 'cdn-1',  target: 'lb-1' },
  ],
  answer: { 'dns-1': 'dns', 'cdn-1': 'cdn' },
};

const tiktokReq2 = {
  order: 2,
  title: 'Serve the feed',
  description: 'Route requests through an API gateway for auth and rate-limiting, process business logic in app servers, and store the personalised feed in a NoSQL store.',
  nodes: [
    { id: 'api-gw',  type: 'component', position: { x: 840,  y: 150 }, data: { componentSlug: 'api-gateway', label: 'API Gateway' } },
    { id: 'app-1',   type: 'component', position: { x: 840,  y: 380 }, data: { componentSlug: 'app-server',  label: 'App Server' } },
    { id: 'nosql-1', type: 'component', position: { x: 1120, y: 380 }, data: { componentSlug: 'nosql-db',    label: 'Feed Store (NoSQL)' } },
  ],
  edges: [
    { id: 'e-lb-gw',    source: 'lb-1',   target: 'api-gw',  label: 'API calls' },
    { id: 'e-lb-app',   source: 'lb-1',   target: 'app-1' },
    { id: 'e-app-ns',   source: 'app-1',  target: 'nosql-1', label: 'feed read/write' },
  ],
  answer: { 'api-gw': 'api-gateway', 'app-1': 'app-server', 'nosql-1': 'nosql-db' },
};

const tiktokReq3 = {
  order: 3,
  title: 'Deliver short videos',
  description: 'Upload videos to object storage, transcode with a media server, push to CDN for edge delivery, and cache hot feed metadata.',
  nodes: [
    { id: 'obj-1',   type: 'component', position: { x: 1400, y: 380 }, data: { componentSlug: 'object-storage', label: 'Video Storage' } },
    { id: 'media-1', type: 'component', position: { x: 1120, y: 560 }, data: { componentSlug: 'media-server',   label: 'Transcoder' } },
    { id: 'cache-1', type: 'component', position: { x: 1120, y: 100 }, data: { componentSlug: 'cache',          label: 'Cache (Redis)' } },
  ],
  edges: [
    { id: 'e-app-obj',  source: 'app-1',   target: 'obj-1',   label: 'upload' },
    { id: 'e-obj-med',  source: 'obj-1',   target: 'media-1', label: 'transcode' },
    { id: 'e-med-cdn',  source: 'media-1', target: 'cdn-1',   label: 'push' },
    { id: 'e-gw-ca',    source: 'api-gw',  target: 'cache-1', label: 'hot metadata' },
  ],
  answer: { 'obj-1': 'object-storage', 'media-1': 'media-server', 'cache-1': 'cache' },
};

// ─── Zoom — 3 requirements (MEDIUM) ──────────────────────────────────────────
//
// Req 1 — "Connect users"
//   New nodes: User(actor), DNS*, Load Balancer*, App Server (signaling)
//   Blanks: dns-1, lb-1
//
// Req 2 — "Handle real-time media"
//   New nodes: CDN*, Media Server*, Message Queue*
//   Cross-req edges: lb-1 → media-1, app-1 → mq-1, user-1 → cdn-1
//   Blanks: cdn-1, media-1, mq-1
//
// Req 3 — "Persist sessions and recordings"
//   New nodes: Cache*, Relational DB*, Object Storage*
//   Cross-req edges: app-1 → cache-1, app-1 → db-1, media-1 → obj-1
//   Blanks: cache-1, db-1, obj-1

const zoomReq1 = {
  order: 1,
  title: 'Connect users',
  description: 'Resolve meeting URLs via DNS, load-balance signalling traffic, and negotiate WebRTC sessions through the app server.',
  nodes: [
    { id: 'user-1', type: 'actor',     position: { x: 0,   y: 250 }, data: { label: 'User' } },
    { id: 'dns-1',  type: 'component', position: { x: 280, y: 250 }, data: { componentSlug: 'dns',           label: 'DNS' } },
    { id: 'lb-1',   type: 'component', position: { x: 560, y: 250 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
    { id: 'app-1',  type: 'component', position: { x: 840, y: 250 }, data: { componentSlug: 'app-server',    label: 'Signalling Server' } },
  ],
  edges: [
    { id: 'e-u-dns',  source: 'user-1', target: 'dns-1',  label: 'lookup' },
    { id: 'e-dns-lb', source: 'dns-1',  target: 'lb-1' },
    { id: 'e-lb-app', source: 'lb-1',   target: 'app-1',  label: 'signalling' },
  ],
  answer: { 'dns-1': 'dns', 'lb-1': 'load-balancer' },
};

const zoomReq2 = {
  order: 2,
  title: 'Handle real-time media',
  description: 'Deliver static assets and screen-share streams via CDN, relay and mix audio/video through a media server, and propagate meeting events via a message queue.',
  nodes: [
    { id: 'cdn-1',   type: 'component', position: { x: 280,  y: 500 }, data: { componentSlug: 'cdn',           label: 'CDN' } },
    { id: 'media-1', type: 'component', position: { x: 1120, y: 250 }, data: { componentSlug: 'media-server',  label: 'Media Server' } },
    { id: 'mq-1',    type: 'component', position: { x: 1120, y: 500 }, data: { componentSlug: 'message-queue', label: 'Event Queue' } },
  ],
  edges: [
    { id: 'e-u-cdn',   source: 'user-1', target: 'cdn-1',   label: 'static' },
    { id: 'e-lb-med',  source: 'lb-1',   target: 'media-1', label: 'WebRTC relay' },
    { id: 'e-app-mq',  source: 'app-1',  target: 'mq-1',    label: 'events' },
  ],
  answer: { 'cdn-1': 'cdn', 'media-1': 'media-server', 'mq-1': 'message-queue' },
};

const zoomReq3 = {
  order: 3,
  title: 'Persist sessions and recordings',
  description: 'Cache active session state for fast lookup, store meeting metadata in a relational DB, and archive cloud recordings to object storage.',
  nodes: [
    { id: 'cache-1', type: 'component', position: { x: 1400, y: 100 }, data: { componentSlug: 'cache',          label: 'Session Cache' } },
    { id: 'db-1',    type: 'component', position: { x: 1400, y: 300 }, data: { componentSlug: 'relational-db',  label: 'Meeting DB' } },
    { id: 'obj-1',   type: 'component', position: { x: 1400, y: 500 }, data: { componentSlug: 'object-storage', label: 'Recording Storage' } },
  ],
  edges: [
    { id: 'e-app-ca',  source: 'app-1',   target: 'cache-1', label: 'session state' },
    { id: 'e-app-db',  source: 'app-1',   target: 'db-1',    label: 'meeting data' },
    { id: 'e-med-obj', source: 'media-1', target: 'obj-1',   label: 'save recording' },
  ],
  answer: { 'cache-1': 'cache', 'db-1': 'relational-db', 'obj-1': 'object-storage' },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding component types...');
  for (const ct of componentTypes) {
    await prisma.componentType.upsert({
      where: { slug: ct.slug },
      update: ct,
      create: ct,
    });
  }

  console.log('Seeding Instagram problem...');
  const instagram = await prisma.problem.upsert({
    where: { slug: 'instagram' },
    update: { isPublished: true },
    create: {
      slug: 'instagram',
      title: 'Design Instagram',
      description:
        'Design a photo-sharing social network that handles millions of daily active users, supports image uploads, feeds, and follower relationships.',
      difficulty: 'MEDIUM',
      category: 'Social Media',
      isPublished: true,
    },
  });

  for (const req of [instagramReq1, instagramReq2, instagramReq3]) {
    await prisma.requirement.upsert({
      where: { problemId_order: { problemId: instagram.id, order: req.order } },
      update: { title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
      create: { problemId: instagram.id, order: req.order, title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
    });
  }

  console.log('Seeding YouTube problem...');
  const youtube = await prisma.problem.upsert({
    where: { slug: 'youtube' },
    update: { isPublished: true },
    create: {
      slug: 'youtube',
      title: 'Design YouTube',
      description:
        'Design a video streaming platform that supports video uploads, transcoding, and delivery to millions of concurrent viewers.',
      difficulty: 'HARD',
      category: 'Video Streaming',
      isPublished: true,
    },
  });

  for (const req of [youtubeReq1, youtubeReq2, youtubeReq3, youtubeReq4]) {
    await prisma.requirement.upsert({
      where: { problemId_order: { problemId: youtube.id, order: req.order } },
      update: { title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
      create: { problemId: youtube.id, order: req.order, title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
    });
  }

  console.log('Seeding WhatsApp problem...');
  const whatsapp = await prisma.problem.upsert({
    where: { slug: 'whatsapp' },
    update: { isPublished: true },
    create: {
      slug: 'whatsapp',
      title: 'Design WhatsApp',
      description: 'Design a real-time messaging platform that delivers billions of messages per day with low latency, supporting text, voice notes, and media sharing.',
      difficulty: 'EASY',
      category: 'Messaging',
      isPublished: true,
    },
  });
  for (const req of [whatsappReq1, whatsappReq2]) {
    await prisma.requirement.upsert({
      where: { problemId_order: { problemId: whatsapp.id, order: req.order } },
      update: { title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
      create: { problemId: whatsapp.id, order: req.order, title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
    });
  }

  console.log('Seeding TikTok problem...');
  const tiktok = await prisma.problem.upsert({
    where: { slug: 'tiktok' },
    update: { isPublished: true },
    create: {
      slug: 'tiktok',
      title: 'Design TikTok',
      description: 'Design a short-video platform that delivers personalised video feeds to hundreds of millions of users with a recommendation engine and global video delivery.',
      difficulty: 'MEDIUM',
      category: 'Video Streaming',
      isPublished: true,
    },
  });
  for (const req of [tiktokReq1, tiktokReq2, tiktokReq3]) {
    await prisma.requirement.upsert({
      where: { problemId_order: { problemId: tiktok.id, order: req.order } },
      update: { title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
      create: { problemId: tiktok.id, order: req.order, title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
    });
  }

  console.log('Seeding Zoom problem...');
  const zoom = await prisma.problem.upsert({
    where: { slug: 'zoom' },
    update: { isPublished: true },
    create: {
      slug: 'zoom',
      title: 'Design Zoom',
      description: 'Design a video-conferencing platform that supports real-time audio/video for hundreds of participants, screen sharing, cloud recording, and meeting scheduling.',
      difficulty: 'MEDIUM',
      category: 'Real-Time Communication',
      isPublished: true,
    },
  });
  for (const req of [zoomReq1, zoomReq2, zoomReq3]) {
    await prisma.requirement.upsert({
      where: { problemId_order: { problemId: zoom.id, order: req.order } },
      update: { title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
      create: { problemId: zoom.id, order: req.order, title: req.title, description: req.description, nodes: req.nodes, edges: req.edges, answer: req.answer },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
