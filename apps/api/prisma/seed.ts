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

const componentTypes = [
  { slug: 'cdn', label: 'CDN', description: 'Content Delivery Network — caches static assets at edge locations', category: 'networking' },
  { slug: 'dns', label: 'DNS', description: 'Domain Name System — translates domain names to IP addresses', category: 'networking' },
  { slug: 'load-balancer', label: 'Load Balancer', description: 'Distributes incoming traffic across multiple servers', category: 'networking' },
  { slug: 'api-gateway', label: 'API Gateway', description: 'Single entry point for client requests, handles routing and auth', category: 'networking' },
  { slug: 'app-server', label: 'Application Server', description: 'Processes business logic and application code', category: 'compute' },
  { slug: 'cache', label: 'Cache', description: 'In-memory data store for fast read access (e.g., Redis)', category: 'storage' },
  { slug: 'relational-db', label: 'Relational DB', description: 'Structured data storage with ACID guarantees (e.g., PostgreSQL)', category: 'storage' },
  { slug: 'nosql-db', label: 'NoSQL DB', description: 'Document or key-value store for flexible schemas (e.g., MongoDB)', category: 'storage' },
  { slug: 'message-queue', label: 'Message Queue', description: 'Async message broker for decoupled services (e.g., Kafka)', category: 'messaging' },
  { slug: 'object-storage', label: 'Object Storage', description: 'Stores unstructured files like images and videos (e.g., S3)', category: 'storage' },
  { slug: 'search-engine', label: 'Search Engine', description: 'Full-text search with indexing (e.g., Elasticsearch)', category: 'data' },
  { slug: 'media-server', label: 'Media Server', description: 'Transcodes and streams video or audio content', category: 'media' },
];

// Instagram architecture graph
// Column x: 0=actor, 280=ingress, 580=LB, 880=app servers, 1180=data layer, 1480=replica
// Row y spacing: 160px between nodes (node height ~80px + 80px gap)
const instagramNodes = [
  { id: 'user-1',  type: 'actor',     position: { x: 0,    y: 320 }, data: { label: 'User' } },
  { id: 'cdn-1',  type: 'component', position: { x: 280,  y: 80  }, data: { componentSlug: 'cdn',          label: 'CDN' } },
  { id: 'dns-1',  type: 'component', position: { x: 280,  y: 260 }, data: { componentSlug: 'dns',          label: 'DNS' } },
  { id: 'cdn-2',  type: 'component', position: { x: 280,  y: 440 }, data: { componentSlug: 'cdn',          label: 'CDN (Media)' } },
  { id: 'lb-1',   type: 'component', position: { x: 580,  y: 260 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
  { id: 'app-1',  type: 'component', position: { x: 880,  y: 140 }, data: { componentSlug: 'app-server',   label: 'App Server 1' } },
  { id: 'app-2',  type: 'component', position: { x: 880,  y: 380 }, data: { componentSlug: 'app-server',   label: 'App Server 2' } },
  { id: 'cache-1',type: 'component', position: { x: 1180, y: 80  }, data: { componentSlug: 'cache',        label: 'Cache (Redis)' } },
  { id: 'db-1',   type: 'component', position: { x: 1180, y: 300 }, data: { componentSlug: 'relational-db', label: 'Primary DB' } },
  { id: 'db-2',   type: 'component', position: { x: 1480, y: 300 }, data: { componentSlug: 'relational-db', label: 'Read Replica' } },
  { id: 'obj-1',  type: 'component', position: { x: 1180, y: 520 }, data: { componentSlug: 'object-storage', label: 'Object Storage' } },
];

const instagramEdges = [
  { id: 'e1', source: 'user-1', target: 'cdn-1', label: 'static assets' },
  { id: 'e2', source: 'user-1', target: 'dns-1', label: 'DNS lookup' },
  { id: 'e3', source: 'user-1', target: 'cdn-2', label: 'media' },
  { id: 'e4', source: 'dns-1', target: 'lb-1' },
  { id: 'e5', source: 'lb-1', target: 'app-1' },
  { id: 'e6', source: 'lb-1', target: 'app-2' },
  { id: 'e7', source: 'app-1', target: 'cache-1', label: 'read' },
  { id: 'e8', source: 'app-1', target: 'db-1', label: 'write' },
  { id: 'e9', source: 'app-2', target: 'cache-1', label: 'read' },
  { id: 'e10', source: 'app-2', target: 'db-1', label: 'write' },
  { id: 'e11', source: 'db-1', target: 'db-2', label: 'replication' },
  { id: 'e12', source: 'app-1', target: 'obj-1', label: 'upload' },
  { id: 'e13', source: 'cdn-2', target: 'obj-1', label: 'origin' },
];

const instagramAnswer: Record<string, string> = {
  'cdn-1': 'cdn',
  'dns-1': 'dns',
  'cdn-2': 'cdn',
  'lb-1': 'load-balancer',
  'app-1': 'app-server',
  'app-2': 'app-server',
  'cache-1': 'cache',
  'db-1': 'relational-db',
  'db-2': 'relational-db',
  'obj-1': 'object-storage',
};

// YouTube architecture graph
// Column x: 0=actors, 300=ingress, 600=LB, 900=routing, 1200=async/cache, 1500=storage
// Row y spacing: 160px between nodes
const youtubeNodes = [
  { id: 'user-1',   type: 'actor',     position: { x: 0,    y: 200 }, data: { label: 'Viewer' } },
  { id: 'creator-1',type: 'actor',     position: { x: 0,    y: 500 }, data: { label: 'Creator' } },
  { id: 'cdn-1',   type: 'component', position: { x: 300,  y: 120 }, data: { componentSlug: 'cdn',           label: 'CDN' } },
  { id: 'dns-1',   type: 'component', position: { x: 300,  y: 340 }, data: { componentSlug: 'dns',           label: 'DNS' } },
  { id: 'lb-1',    type: 'component', position: { x: 600,  y: 260 }, data: { componentSlug: 'load-balancer', label: 'Load Balancer' } },
  { id: 'api-gw',  type: 'component', position: { x: 900,  y: 120 }, data: { componentSlug: 'api-gateway',   label: 'API Gateway' } },
  { id: 'app-1',   type: 'component', position: { x: 900,  y: 380 }, data: { componentSlug: 'app-server',    label: 'App Server' } },
  { id: 'cache-1', type: 'component', position: { x: 1200, y: 120 }, data: { componentSlug: 'cache',         label: 'Cache' } },
  { id: 'mq-1',    type: 'component', position: { x: 1200, y: 340 }, data: { componentSlug: 'message-queue', label: 'Message Queue' } },
  { id: 'media-1', type: 'component', position: { x: 1200, y: 540 }, data: { componentSlug: 'media-server',  label: 'Transcoder' } },
  { id: 'db-1',    type: 'component', position: { x: 1500, y: 340 }, data: { componentSlug: 'relational-db', label: 'Metadata DB' } },
  { id: 'obj-1',   type: 'component', position: { x: 1500, y: 540 }, data: { componentSlug: 'object-storage',label: 'Video Storage' } },
];

const youtubeEdges = [
  { id: 'e1', source: 'user-1', target: 'cdn-1', label: 'stream video' },
  { id: 'e2', source: 'user-1', target: 'dns-1', label: 'lookup' },
  { id: 'e3', source: 'creator-1', target: 'lb-1', label: 'upload' },
  { id: 'e4', source: 'dns-1', target: 'lb-1' },
  { id: 'e5', source: 'lb-1', target: 'api-gw' },
  { id: 'e6', source: 'lb-1', target: 'app-1' },
  { id: 'e7', source: 'api-gw', target: 'cache-1' },
  { id: 'e8', source: 'app-1', target: 'mq-1', label: 'upload event' },
  { id: 'e9', source: 'mq-1', target: 'media-1', label: 'transcode job' },
  { id: 'e10', source: 'app-1', target: 'db-1', label: 'metadata' },
  { id: 'e11', source: 'media-1', target: 'obj-1', label: 'store' },
  { id: 'e12', source: 'cdn-1', target: 'obj-1', label: 'origin pull' },
];

const youtubeAnswer: Record<string, string> = {
  'cdn-1': 'cdn',
  'dns-1': 'dns',
  'lb-1': 'load-balancer',
  'api-gw': 'api-gateway',
  'app-1': 'app-server',
  'media-1': 'media-server',
  'mq-1': 'message-queue',
  'cache-1': 'cache',
  'db-1': 'relational-db',
  'obj-1': 'object-storage',
};

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
      description: 'Design a photo-sharing social network that handles millions of daily active users, supports image uploads, feeds, and follower relationships.',
      difficulty: 'MEDIUM',
      category: 'Social Media',
      isPublished: true,
    },
  });

  await prisma.problemGraph.upsert({
    where: { problemId: instagram.id },
    update: { nodes: instagramNodes, edges: instagramEdges, answer: instagramAnswer },
    create: {
      problemId: instagram.id,
      nodes: instagramNodes,
      edges: instagramEdges,
      answer: instagramAnswer,
    },
  });

  console.log('Seeding YouTube problem...');
  const youtube = await prisma.problem.upsert({
    where: { slug: 'youtube' },
    update: { isPublished: true },
    create: {
      slug: 'youtube',
      title: 'Design YouTube',
      description: 'Design a video streaming platform that supports video uploads, transcoding, and delivery to millions of concurrent viewers.',
      difficulty: 'HARD',
      category: 'Video Streaming',
      isPublished: true,
    },
  });

  await prisma.problemGraph.upsert({
    where: { problemId: youtube.id },
    update: { nodes: youtubeNodes, edges: youtubeEdges, answer: youtubeAnswer },
    create: {
      problemId: youtube.id,
      nodes: youtubeNodes,
      edges: youtubeEdges,
      answer: youtubeAnswer,
    },
  });

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
