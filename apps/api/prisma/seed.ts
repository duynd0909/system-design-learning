import { PrismaClient, type Difficulty, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

loadEnv({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://stackdify:stackdify@localhost:5432/stackdify_dev',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ─── Source data (loaded from docs/) ─────────────────────────────────────────

const DOCS_DIR = path.join(__dirname, '../../../docs');

interface SourceComponent {
  type: string;
  name: string;
  description: string;
  icon: string;
  meta_data: { backgroundColor: string; borderColor: string };
}

interface SourceNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { componentType: string; hint?: string; isBlank?: boolean };
}

interface SourceEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  markerEnd?: Record<string, unknown>;
  markerStart?: Record<string, unknown>;
  data?: unknown;
  type?: string;
}

interface SourceRequirement {
  id: string;
  title: string;
  description: string;
  node_ids: string[];
}

interface SourceProblem {
  id: string;
  title: string;
  description: string;
  design: {
    component_options: string[];
    nodes: SourceNode[];
    edges: SourceEdge[];
  };
  requirements: SourceRequirement[];
}

const componentsJson = JSON.parse(
  fs.readFileSync(path.join(DOCS_DIR, 'components.json'), 'utf-8'),
) as SourceComponent[];

const questionsJson = JSON.parse(
  fs.readFileSync(path.join(DOCS_DIR, 'first-start-questions.json'), 'utf-8'),
) as SourceProblem[];

// ─── Component type mapping ───────────────────────────────────────────────────

const ACTOR_TYPES = new Set(['DESKTOP', 'CLIENT']);

const COMPONENT_CATEGORIES: Record<string, string> = {
  // networking
  CDN: 'networking', DNS: 'networking', LOAD_BALANCER: 'networking',
  CONNECTION_GATEWAY: 'networking', RATE_LIMITER: 'networking',
  SWITCH: 'networking', NETWORK_TOWER: 'networking', TOWERS: 'networking',
  // compute
  SERVER: 'compute', AUTH_SERVER: 'compute', CODE_EXECUTION_SERVER: 'compute',
  EXTERNAL_SERVER: 'compute', MEDIA_SERVER: 'compute', CHESS_SERVER: 'compute',
  GAME_SERVER: 'compute', GAMING_CLIENT: 'compute', CLIENT: 'compute', DESKTOP: 'compute',
  // storage
  DATABASE: 'storage', NOSQL_DATABASE: 'storage', CACHE: 'storage',
  FILE_SERVER: 'storage', DATA_LAKE: 'storage', GRAPH_DATABASE: 'storage',
  TIME_SERIES_DATABASE: 'storage', BACKUP_STORAGE: 'storage', ELASTIC_SEARCH: 'storage',
  // async
  MESSAGE_QUEUE: 'async', CHANGE_DATA_CAPTURE: 'async', TASK_SCHEDULER: 'async',
  // monitoring
  METRICS_ENGINE: 'monitoring', ANOMALY_DETECTION_SERVICE: 'monitoring',
  ANALYTICS_ENGINE: 'monitoring', DASHBOARD: 'monitoring', HEALTH_CHECKER: 'monitoring',
  // service
  NOTIFICATION_SERVICE: 'service', EMAIL_SERVICE: 'service', SMS_SERVICE: 'service',
  PAYMENTS_SERVICE: 'service', PROFILE_SERVICE: 'service', CHAT_SERVICE: 'service',
  DOCUMENT_SERVICE: 'service', GROUP_SERVICE: 'service', VERSIONING_SERVICE: 'service',
  BOOKING_SERVICE: 'service', NEWS_FEED: 'service', POSTS_SERVICE: 'service',
  DISCUSSION_SERVICE: 'service', LOCKING_SERVICE: 'service',
  TOKEN_GENERATION_SERVICE: 'service', SOCIAL_NETWORK_MANAGER: 'service',
  SESSION_SERVICE: 'service', FRAUD_DETECTION_SERVICE: 'service',
  INVENTORY_SERVICE: 'service', ORDER_SERVICE: 'service', PRODUCTS_SERVICE: 'service',
  TRIE_BUILDER_SERVICE: 'service', MATCHING_SERVICE: 'service',
  AGGREGATOR_SERVICE: 'service', RANKING_SERVICE: 'service',
  RECOMMENDATION_ENGINE: 'service', PREDICTION_ENGINE: 'service',
  CRAWLER_SERVICE: 'service', IMAGE_SEARCH_SERVICE: 'service',
  AUDIO_PROCESSING_ENGINE: 'service', CONVERSATIONAL_MODEL_SERVICE: 'service',
  IMAGE_GENERATION_SERVICE: 'service', IMAGE_ANALYSIS_ENGINE: 'service',
  MAP_SERVICE: 'service', GRAPH_SERVICE: 'service',
  VIDEO_TRANSPORTER: 'service', TRANSFORMER: 'service', VIDEO_CAMERA: 'compute',
};

// ─── Answer keys  (problemId → blankNodeId → correct component slug) ─────────
// Inferred from hint text, edge labels, and graph context.

const ANSWER_KEYS: Record<string, Record<string, string>> = {
  '8e9fc737-fff9-45e2-a835-418475ee52c0': { // URL Shortener
    'f1435290-a7ac-46cf-b8fd-2c40e7e94468': 'dns',            // "RESOLVE www.shortened.url"
    'a6d3f9b6-b722-4474-a34a-f3bbdd88af6c': 'load-balancer',  // "equally distributes load"
    'b5ea9352-59d0-4614-b000-8c8cc4b80eb7': 'cache',          // "fast read and write access"
  },
  '2e015b5b-5a4a-4204-a69f-4349ebb8a5c7': { // Online File Converter
    '0c82ceec-a794-46b7-b3ec-69033244a6de': 'message-queue',  // "PUBLISH/CONSUME CONVERSION EVENT"
    'a5069eba-194e-4247-b99e-9edb6e2868b0': 'file-server',    // "Storing files in database is expensive"
    '93902df4-e353-4530-9d46-054b7faa396c': 'cache',          // "speed up by access patterns"
  },
  '683f09f8-f317-4fb9-87c1-e0e346b68311': { // CricBuzz ScoreBoard
    '8b519817-157e-440c-849d-1a300f98179c': 'connection-gateway', // edge "SERVER-SIDE EVENTS"
    'afc792f7-121d-4928-a6ea-c56bad45b92d': 'cdn',                // "close to user reduces latency"
    'fc39d2b7-22ed-4c92-8229-9c66ca8259b6': 'message-queue',      // "real-time updates managed"
  },
  '8c3fcac4-6232-4ac8-8989-8bc38952b5ee': { // CodeForces Online Judge
    '5f9b5a65-dfad-44cd-97df-33ede52dec27': 'rate-limiter',   // edge "TOO MANY REQUESTS?"
    '9126e826-c270-4852-8995-2992bc130bbd': 'file-server',    // "cost-effective storage of large data"
    'dd890376-8878-4473-9d49-6a8e186357de': 'message-queue',  // "events to prevent sudden spikes"
  },
  '7b9a310b-37a3-4b73-87bd-af1cddd6cfab': { // Adobe PDF Files Manager
    'd71e2ffa-6ac8-4d82-bb20-990ecdad2481': 'cache',                   // "LRU" cache hint
    'df2c099e-e480-42ec-8f0c-ebf326c93fbf': 'token-generation-service', // "unique ID / Aadhaar"
    '2d477901-b6d1-43bc-ae52-56e59aee4305': 'cdn',                     // "static files kept"
  },
  'a4d0fee5-04c4-4969-bf17-7c608c3b0122': { // AWS CloudWatch
    'afd05a7c-2cbf-4d10-a18d-5056fbcfe6ee': 'dashboard',             // "visual interface for metrics"
    '7e4d750c-0f16-47d9-bdfe-a8f7c0503037': 'notification-service',  // "dispatches alerts"
    '07b90a96-6b62-47cf-9a90-ff8fd5a790af': 'file-server',           // "economical archiving"
  },
  '17f67c40-49ad-4bd3-806e-f1db45f2bd4e': { // Google Drive File Storage
    '6349a293-d2f7-4e1a-a4db-ec2e893b9fc8': 'database',       // "GET / STORE METADATA"
    'd9c35b3b-53b9-415e-aca4-d6ad25417293': 'task-scheduler',  // "TRIGGER / MANAGE JOBS"
    '04575a86-fd50-4ee5-b780-21c02c593ab3': 'elastic-search',  // "Accelerates complex search"
    '9ec1d1ef-772b-4308-9708-d8f68a9c772b': 'cache',           // "RECENT FILES"
    'ee95433c-168f-4c45-aa28-87174e4700c3': 'file-server',     // "SEND FILE / STORE VERSION"
  },
  'aa2de678-54f8-4930-bdff-445f27924d62': { // Pastebin Text Storage
    'a808e173-9d4e-496d-a7c0-e63267401bc4': 'load-balancer',   // "distributes traffic"
    '668dc48d-2ebe-4a0d-b524-4f3ee2838d58': 'cache',           // "WRITE-THROUGH ALGORITHM"
    '90821744-eb4f-4036-9c52-aac75cd132d5': 'task-scheduler',  // "TRIGGER EXPIRATION"
  },
  '5be732bc-778a-4de6-bc30-c495d116812d': { // Udemy Course Manager
    '9ff2753f-3b76-4f96-987e-35a47dec9323': 'cdn',             // "global access, load times"
    '1c7cf077-9c84-481f-8950-99735ab511cc': 'file-server',     // "central hub for course files"
    'ce7e88cb-e7fb-44b5-a8d4-fe18feead973': 'elastic-search',  // "search for courses"
  },
  '814b85f1-5bc4-47a8-bafa-6534904ef4da': { // AirBnb Aggregator
    '7ad4e137-ca0f-4e66-a64d-2b6904077a25': 'elastic-search',    // "indexes data for search"
    'b40d655d-7f2a-4f6c-b0b5-7c603b71625b': 'aggregator-service', // "collects and sanitizes"
    '52af8b83-6038-49bb-841a-3109cee94d82': 'cache',              // "popular listings"
  },
  'd9a47814-da87-490f-bad2-2d800f3e74c3': { // LinkedIn Connection Search
    'aa03e12d-2912-4c69-b8c9-1b709e09ac0b': 'load-balancer',   // "distributes traffic"
    'd746a3f2-ca13-4698-b86c-b52cf926b226': 'graph-database',  // "complex network relationships"
    'fa71b271-dba6-4aaa-ae70-1638494ca7d7': 'file-server',     // "cheap static file storage"
  },
  '89dc1bd0-e531-4df7-9f6a-6ab616d35496': { // GitHub Code Search
    'a86ee280-06f5-4c51-8f72-695999eedeb6': 'elastic-search',  // "search inside files"
    '2aea360d-ff45-44e4-9016-87f904712948': 'load-balancer',   // "point of entry for requests"
    '9d3ee192-2fea-42c9-9c3f-36baf203f321': 'cdn',             // "REPLICATE GLOBALLY"
  },
};

// ─── Problem metadata ─────────────────────────────────────────────────────────

interface ProblemMeta {
  slug: string;
  difficulty: Difficulty;
  category: string;
}

const PROBLEM_META: Record<string, ProblemMeta> = {
  '8e9fc737-fff9-45e2-a835-418475ee52c0': { slug: 'url-shortener',      difficulty: 'EASY',   category: 'Web Infrastructure' },
  '2e015b5b-5a4a-4204-a69f-4349ebb8a5c7': { slug: 'file-converter',     difficulty: 'EASY',   category: 'File Processing' },
  '683f09f8-f317-4fb9-87c1-e0e346b68311': { slug: 'cricbuzz-scoreboard', difficulty: 'MEDIUM', category: 'Real-Time Systems' },
  '8c3fcac4-6232-4ac8-8989-8bc38952b5ee': { slug: 'codeforces-judge',   difficulty: 'HARD',   category: 'Code Execution' },
  '7b9a310b-37a3-4b73-87bd-af1cddd6cfab': { slug: 'adobe-pdf-manager',  difficulty: 'MEDIUM', category: 'File Storage' },
  'a4d0fee5-04c4-4969-bf17-7c608c3b0122': { slug: 'aws-cloudwatch',     difficulty: 'MEDIUM', category: 'Monitoring' },
  '17f67c40-49ad-4bd3-806e-f1db45f2bd4e': { slug: 'google-drive',       difficulty: 'HARD',   category: 'Cloud Storage' },
  'aa2de678-54f8-4930-bdff-445f27924d62': { slug: 'pastebin',           difficulty: 'EASY',   category: 'Text Storage' },
  '5be732bc-778a-4de6-bc30-c495d116812d': { slug: 'udemy-courses',      difficulty: 'MEDIUM', category: 'Content Delivery' },
  '814b85f1-5bc4-47a8-bafa-6534904ef4da': { slug: 'airbnb-aggregator',  difficulty: 'MEDIUM', category: 'Marketplace' },
  'd9a47814-da87-490f-bad2-2d800f3e74c3': { slug: 'linkedin-search',    difficulty: 'HARD',   category: 'Social Network' },
  '89dc1bd0-e531-4df7-9f6a-6ab616d35496': { slug: 'github-code-search', difficulty: 'HARD',   category: 'Search' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(type: string): string {
  return type.toLowerCase().replace(/_/g, '-');
}

const componentLabelMap = new Map<string, string>(
  componentsJson.map((c) => [c.type, c.name]),
);

function getLabel(componentType: string): string {
  return (
    componentLabelMap.get(componentType) ??
    componentType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
  );
}

// ─── Design splitting ─────────────────────────────────────────────────────────

interface SplitRequirement {
  req: SourceRequirement;
  order: number;
  newNodeIds: string[];
  accumulatedIds: Set<string>;
}

function splitDesignToRequirements(
  design: SourceProblem['design'],
  requirements: SourceRequirement[],
): SplitRequirement[] {
  const nodeMap = new Map(design.nodes.map((n) => [n.id, n]));
  const assignedIds = new Set<string>();

  return requirements.map((req, idx) => {
    const inDesign = req.node_ids.filter((id) => nodeMap.has(id));
    const newIds = inDesign.filter((id) => !assignedIds.has(id));
    newIds.forEach((id) => assignedIds.add(id));
    return {
      req,
      order: idx + 1,
      newNodeIds: newIds,
      accumulatedIds: new Set(assignedIds),
    };
  });
}

function assignEdgesToRequirements(
  edges: SourceEdge[],
  splits: SplitRequirement[],
): SourceEdge[][] {
  return splits.map(({ newNodeIds, accumulatedIds }) => {
    const newSet = new Set(newNodeIds);
    return edges.filter(
      (e) =>
        accumulatedIds.has(e.source) &&
        accumulatedIds.has(e.target) &&
        (newSet.has(e.source) || newSet.has(e.target)),
    );
  });
}

function convertNode(
  sourceNode: SourceNode,
  answerKeys: Record<string, string>,
): Record<string, unknown> {
  const { id, position, data } = sourceNode;
  const cType = data.componentType;

  if (ACTOR_TYPES.has(cType)) {
    return { id, type: 'actor', position, data: { label: getLabel(cType) } };
  }

  if (data.isBlank) {
    const correctSlug = answerKeys[id] ?? 'unknown';
    const correctType = correctSlug.toUpperCase().replace(/-/g, '_');
    return {
      id,
      type: 'component',
      position,
      data: {
        componentSlug: correctSlug,
        label: getLabel(correctType),
        ...(data.hint ? { hint: data.hint } : {}),
      },
    };
  }

  return {
    id,
    type: 'component',
    position,
    data: { componentSlug: toSlug(cType), label: getLabel(cType) },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Wipe existing data
  console.log('Clearing problems and component types...');
  await prisma.problem.deleteMany({});
  await prisma.componentType.deleteMany({});

  // 2. Seed ComponentTypes from docs/components.json
  console.log(`Seeding ${componentsJson.length} component types...`);
  for (const c of componentsJson) {
    await prisma.componentType.create({
      data: {
        slug: toSlug(c.type),
        label: c.name,
        description: c.description,
        iconUrl: c.icon,
        category: COMPONENT_CATEGORIES[c.type] ?? 'service',
      },
    });
  }
  console.log('Component types done.');

  // 3. Seed Problems from docs/first-start-questions.json
  console.log(`Seeding ${questionsJson.length} problems...`);
  for (const problem of questionsJson) {
    const meta = PROBLEM_META[problem.id];
    if (!meta) {
      console.warn(`  Skipping unknown problem: ${problem.id}`);
      continue;
    }

    const answerKeys = ANSWER_KEYS[problem.id] ?? {};
    const splits = splitDesignToRequirements(problem.design, problem.requirements);
    const edgesPerReq = assignEdgesToRequirements(problem.design.edges, splits);
    const componentOptions = problem.design.component_options.map(toSlug);
    const nodeMap = new Map(problem.design.nodes.map((n) => [n.id, n]));

    const created = await prisma.problem.create({
      data: {
        slug: meta.slug,
        title: problem.title,
        description: problem.description,
        difficulty: meta.difficulty,
        category: meta.category,
        componentOptions,
        isPublished: true,
      },
    });

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const reqEdges = edgesPerReq[i];
      const reqNodes = split.newNodeIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is SourceNode => n !== undefined);

      const nodes = reqNodes.map((n) => convertNode(n, answerKeys));

      const edges = reqEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        markerEnd: e.markerEnd,
        markerStart: e.markerStart,
        data: e.data,
        type: e.type,
      }));

      const answer: Record<string, string> = {};
      for (const node of reqNodes) {
        if (node.data.isBlank && answerKeys[node.id]) {
          answer[node.id] = answerKeys[node.id];
        }
      }

      await prisma.requirement.create({
        data: {
          problemId: created.id,
          order: split.order,
          title: split.req.title,
          description: split.req.description,
          nodes: nodes as Prisma.InputJsonArray,
          edges: edges as Prisma.InputJsonArray,
          answer: answer as Prisma.InputJsonObject,
        },
      });
    }

    console.log(`  ✓ ${problem.title} (${splits.length} reqs, ${Object.keys(answerKeys).length} blanks)`);
  }

  // 4. Admin user (env-driven, idempotent)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'ADMIN',
        username: process.env.ADMIN_USERNAME ?? 'admin',
        password: hashed,
      },
      create: {
        email: adminEmail,
        password: hashed,
        username: process.env.ADMIN_USERNAME ?? 'admin',
        displayName: process.env.ADMIN_DISPLAY_NAME ?? 'Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Admin user seeded: ${adminEmail}`);
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
