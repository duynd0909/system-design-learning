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

// ─── Source data (loaded from prisma/) ─────────────────────────────────────────

const SEED_DIR = __dirname;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSourceProblem(value: unknown): value is SourceProblem {
  if (!isRecord(value)) return false;
  const design = value.design;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    isRecord(design) &&
    Array.isArray(design.component_options) &&
    Array.isArray(design.nodes) &&
    Array.isArray(design.edges) &&
    Array.isArray(value.requirements)
  );
}

function readSourceProblems(fileName: string): SourceProblem[] {
  const raw = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, fileName), 'utf-8'),
  ) as unknown;

  if (!Array.isArray(raw)) {
    throw new Error(`${fileName} must contain an array of problems`);
  }

  const problems = raw.filter(isSourceProblem);
  const skipped = raw.length - problems.length;
  if (skipped > 0) {
    console.warn(`Skipped ${skipped} invalid entries from ${fileName}.`);
  }

  return problems;
}

const componentsJson = JSON.parse(
  fs.readFileSync(path.join(SEED_DIR, 'components.json'), 'utf-8'),
) as SourceComponent[];

const questionsJson = [
  ...readSourceProblems('first-start-questions.json'),
  ...readSourceProblems('next-phase-questions.json'),
];

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
  'e333b02d-2431-47e0-80cf-088826c9a648': { // Image Search Engine
    'c290331e-04e1-4408-bdd6-29c3c9219049': 'task-scheduler',
    'df37da6e-ff83-4e3b-aaf0-4fe837f52830': 'elastic-search',
    '7cb0a0be-e996-4a35-8b84-bab2a85b5b77': 'cache',
  },
  '5d3c4650-7e64-4607-8d93-614df78d0784': { // Shazam
    'd17cbbf1-761d-4028-9db9-7ce7271a87b2': 'load-balancer',
    '463ee390-975d-4973-9b21-eb8f0322cc1a': 'task-scheduler',
    '840fa2eb-df04-4a1c-ad60-3d0f9fe392a4': 'file-server',
  },
  'af26536b-202a-44e7-8815-0206319306c3': { // Web Crawler and Indexer
    'e76fe61a-12db-483c-bfa2-01b4f9a8dda7': 'load-balancer',
    'c16012ce-0c71-4c55-a108-0c0f70a15ddc': 'cache',
    '7bd4bd84-128c-41a6-b054-833a750112a3': 'graph-database',
    '462410b1-ff36-4abb-af94-47be2fcdbe75': 'task-scheduler',
    '49b4d87e-15a9-4a5a-a0b4-9e481c8c3586': 'message-queue',
  },
  'fe74fd8a-2de2-41c8-94a5-d89d0019b648': { // BookMyShow
    '5752d0fd-9c6f-4381-a5cd-41d4ba528ad2': 'locking-service',
    '2b019850-5ba2-4977-9275-130bb3142a02': 'load-balancer',
    'a73cb8b9-c0f7-4fc3-95bc-1992a23b46b5': 'message-queue',
  },
  'b94b6c0c-36d8-466d-a83f-f04a5042f673': { // Calendly
    'be201249-0855-4174-82ae-a21a842d97d1': 'cache',
    '08b7eb0d-b316-4534-a0f8-05b243c7675a': 'auth-server',
    '47bc875d-5ead-46db-9818-54b58675c2d6': 'task-scheduler',
  },
  '593c7ad7-b2ca-4907-bdbf-9b4b2a461d46': { // IRCTC Tatkal
    '938a2ba9-dd2b-4be1-996d-c72828b48a44': 'locking-service',
    '4f75394a-b5c6-4a89-a3bc-f9252b5a4191': 'cache',
    'd9afcefd-0e77-4ab9-8b03-147fc00007fd': 'message-queue',
  },
  'd7ee4f3a-ea18-415f-840a-7dabfb718600': { // Google Calendar
    '55af8518-b5bb-43e7-88dd-a907bea44612': 'task-scheduler',
    '1521f1cb-efbd-49bb-a04a-a140d2cbae0b': 'session-service',
    '2102289f-3d2c-473b-bf11-1e1f0f256a74': 'auth-server',
  },
  '90fda00d-1dba-4f73-b81c-0f96df2d105d': { // Instagram Feed
    'a49fd6d6-5f88-41ee-9572-a25e0d33a290': 'cdn',
    '89fb4288-d74c-423c-891d-eed3a101748c': 'file-server',
    '67a698d9-9527-4ee4-beff-f3782b3e6945': 'cache',
    '7f21dafb-ac99-4e2c-9401-588f60e5bdda': 'data-lake',
    '0598e9b7-ad3b-47a8-9fd3-f767755c4ff7': 'connection-gateway',
  },
  'c80fd8b6-603c-4e3d-8bc4-7dd4c7a332bf': { // TikTok Feed
    '38732abf-b22b-4d30-ae88-5f8c82d84a70': 'load-balancer',
    'f7ccb9ee-0bb1-43ca-a6b0-290e405706b9': 'data-lake',
    '5637ebc0-56ae-46c3-9693-0a6b88182c1e': 'nosql-database',
  },
  '986b089c-85ef-45de-bf60-75b4d72e8d23': { // Twitter Feed
    'a1ea96d6-051a-4db1-89c6-8e0cef00def4': 'load-balancer',
    'e398416d-cb96-4562-b200-bd7e5bb1ac8f': 'cache',
    '66d0de16-7710-4487-be73-915be2db1382': 'graph-database',
  },
  '9afd4247-dd67-4dfd-9aa4-f7bd1b7c62cd': { // Zepto Inventory
    'e9f33e3e-cc6f-452d-adab-9fab3babf91c': 'data-lake',
    '632c54e0-7b5a-474e-834a-c2d6a8cf392e': 'message-queue',
    '76ee434f-0b06-49fd-a18b-78ed0a81e2cd': 'database',
    'f9f4a507-9e0d-4f3d-9766-fa26df6bbd81': 'connection-gateway',
  },
  '169f4fa6-c021-431e-aeb1-c5e123c359db': { // Uber Matching
    '86613b25-057c-49aa-a6bf-45d437949747': 'cache',
    'b32ddfd8-ffb2-4cc2-a477-9a4441223aff': 'connection-gateway',
    '384592ac-12de-4c38-8a96-7813f2dcd5f1': 'graph-database',
  },
  '081d7bb1-c215-4bad-ae9b-bf4b49d960c2': { // Google Maps
    '8569989f-aaec-4fbf-a3a0-a6bb6f21df81': 'cache',
    '8ce7ba7b-b3ce-4a7f-aa0b-7cba964b6381': 'load-balancer',
    '1761ee4d-a41e-4d3e-8c2e-e325ba0a52da': 'graph-database',
    'e47a2c86-b0bd-4549-ab72-ef8f70d7099f': 'change-data-capture',
  },
  'fd4bf5a1-1828-4413-b506-749665abc8ad': { // Zomato Tracking
    'a77c3fbe-2d0e-42f8-8105-bb91983585a0': 'load-balancer',
    '31071efd-1d1c-4a50-9833-2ae63b598098': 'connection-gateway',
    '5fd3c2b9-f3ec-40bb-af51-2e3bafb2fab6': 'cache',
    'f6858a6b-3478-48af-b063-0cac5c1905b7': 'load-balancer',
  },
  'ccbb5ca6-e5da-4b00-9839-084cbcc33aef': { // Amazon SES
    '02e3a1ec-3467-40d7-bd48-67d5270e9d0c': 'auth-server',
    'f6ee694d-3e7e-4f0c-ba4a-b63a023ad352': 'file-server',
    '2fec2f13-967d-41d2-b7d7-43aa846510fa': 'message-queue',
  },
  '11a8b7e5-e26e-4ddf-a3ca-55be15e6202c': { // Gmail
    'a9201fef-4e68-4f5b-81dc-e3b883f3f179': 'message-queue',
    '16f21955-a03a-408b-a7e2-6574ba9a16f7': 'load-balancer',
    '3a9f4947-fa5f-4bf6-a373-d05ccdd8c260': 'file-server',
  },
  '36b4c22f-af41-4679-a1f5-1e0cc22b7833': { // Mailchimp
    '8e949a4b-7dd5-4263-8528-7ba5ba64650a': 'message-queue',
    '6c5a763c-30ae-4f20-951c-3abac52427d0': 'cdn',
    'bf6e9ef3-573d-40f8-9d29-cf16b589a708': 'time-series-database',
  },
  '4bf6a6c5-5fe3-4fe4-bb27-9899f841474b': { // WhatsApp VoIP
    'ebdd3a62-9567-49c2-8c07-a939023da920': 'switch',
    '744f183f-22c3-4a91-a1d8-c16da46e9f83': 'message-queue',
    'd06d3c51-45b1-4a1f-b756-c0645b8896ee': 'health-checker',
  },
  '4f48a75b-cb52-4820-8a85-6ab4c974bb7e': { // Google Meet
    'c8f56078-80c6-4642-aefb-fd6b5d91b94a': 'file-server',
    '6dfd53a0-ebdc-4ea8-8df1-1477d37e67e2': 'media-server',
    'd126e346-2721-4ceb-86f2-fbaf4a632531': 'load-balancer',
  },
  '4d69def5-6d18-436d-ab32-a313cab59cd1': { // Zoom
    '449fc624-6a34-4225-8279-453824a58829': 'media-server',
    '7de02f90-ccda-4423-957f-63c24b95b5ab': 'external-server',
    'ec92eece-e81b-48b4-a889-c21b84a07d64': 'health-checker',
    'c5eff54c-7bb2-47ed-b324-aa44c79d114a': 'cache',
  },
  'ae008faa-9fd4-4369-b6c6-f440fb2ad274': { // Netflix CDN
    'a68dcab5-a1b4-4c2c-9576-194c95073202': 'auth-server',
    'f4d45826-becb-450d-86f3-c1e876fdcb7d': 'dns',
    '4dbdbc8b-2e72-4df8-ad0d-bc0b917c0a43': 'task-scheduler',
  },
  'd674daa7-d391-433e-b300-deb024cccc0e': { // YouTube
    'c0179160-e68b-43c7-81f2-b3fa457d6172': 'cdn',
    'f9d2cbfa-d5ea-4854-91da-18c801d553ff': 'cache',
    'e2a99846-2625-41f5-8d19-cb192833caa9': 'file-server',
  },
  'bd9bf8f2-3498-412d-8387-7e76319cffe6': { // Hotstar
    '98203fb5-eac7-409a-8913-972f2793684f': 'cdn',
    '660a668e-60fa-412f-a828-c7010c91df4b': 'message-queue',
    '930daaae-7dfd-4b95-b68d-b129781c10c3': 'file-server',
  },
  '2bcf9846-75a1-4f77-9e20-c660c6a7c99c': { // PayTM
    '936949f4-b020-4339-9472-f36cb10370ed': 'locking-service',
    '7a04aceb-a4db-40dc-8692-e5eeb221e38c': 'connection-gateway',
    'c1dcc406-9688-4045-9312-129a7fcf088f': 'file-server',
  },
  'bda46148-7bfa-4cba-b221-20c7dc3c62b9': { // Zerodha
    'daf217af-ac5d-46fe-9308-a20a271f9edf': 'fraud-detection-service',
    'dfb22458-37c7-4e7b-bb5b-7902f01d8108': 'notification-service',
    'c183cffa-d64f-48ad-99f3-ecd1a1e16765': 'cache',
  },
  'f40e011f-fc9c-43bd-aeca-e9c584d43afa': { // Google Pay
    '6debf967-fd4d-4377-a55e-ad8bbeed68ce': 'anomaly-detection-service',
    '4b127c57-9d9a-4eb6-a97c-8b9ee8345231': 'task-scheduler',
    'e2d27ba5-edbc-4611-8fa9-a6e198b93d33': 'change-data-capture',
  },
  '72b05eb2-3cb2-485e-9ced-0de4d81d78ae': { // Razorpay Gateway
    '9ec53ff1-517f-4152-be86-85f3f152e75d': 'change-data-capture',
    'd5a58148-fd54-4c30-9ac0-496f56078412': 'message-queue',
    'e170033c-8537-464e-806c-e0fc8ec6f073': 'load-balancer',
  },
  '33fadd29-8187-44d4-a1f4-768cdebbd8da': { // Zomato Orders
    '8cb0a02b-6665-4f06-a5a8-9392f31cb337': 'connection-gateway',
    '65aab7d9-8d19-4a1b-b7f3-0efeebe53e2f': 'graph-database',
    '373281a5-a430-4b42-9900-d2b4c11241f3': 'load-balancer',
    'bb59db4d-f52e-47c7-982c-dfcebded81a2': 'data-lake',
  },
  'cbca38d0-c27e-4467-aeca-c0e9657c1284': { // Canva
    'b4bdcea2-1a0d-42c6-99ee-ce45365bc352': 'file-server',
    '9f4a6300-52b8-4e15-8200-8d0804a8ea45': 'cdn',
    '3fabc6d7-e652-4781-9adf-3b09d9b8455a': 'cache',
  },
  '65f9c8f5-8557-47a0-aace-f46d7d5cc00a': { // Excalidraw
    '8131413e-dd07-473e-adb5-8536ac82c0e7': 'cache',
    'c4e3f3b2-a6a7-428f-8fa3-7a672955e527': 'connection-gateway',
    '607cbba5-dc5c-4bf5-85e5-036f3561a161': 'task-scheduler',
    '11e7d675-2a46-41f4-b427-7f1c4cfdab60': 'nosql-database',
  },
  'dad13db1-7b4d-4cd4-bc8d-3a2291920fde': { // Google Docs
    '750bd766-a5b1-4bb3-bd82-e434ddf45f3b': 'cache',
    'b53002fc-e551-4331-960c-9c0c53705021': 'message-queue',
    'ddd1df96-f9a3-4aac-aa96-82df2d4a8d3c': 'nosql-database',
    'b59e9a4c-11c0-405a-97aa-6c318d89f202': 'dns',
  },
  'f07d4552-42a8-41c8-9e6f-f509799bdfcb': { // Lichess
    '073fde4d-131e-4dea-8638-0e4e4b120902': 'cache',
    'aaeac4c3-6d79-4c56-b6b1-2faedbd471d7': 'notification-service',
    '1b30b9b4-b444-4d28-b8dd-30c6f662eeb2': 'connection-gateway',
    '602e5aac-0819-401e-b7b2-63741bd3684a': 'profile-service',
    'd0a5d165-8b96-4b06-976e-1459bbee1cbb': 'chat-service',
  },
  'de1f6990-1e00-4c4b-84d9-81d0e645eeca': { // Counter-Strike
    '94539cd0-2e28-4393-99de-2f6b281574e0': 'cache',
    '56650ff4-827d-4e98-a514-d5415bc6e5cc': 'connection-gateway',
    '1fcd0daa-0023-4740-aa5a-08e880e4e20e': 'connection-gateway',
    'af857ae0-e3ad-4d34-b26a-ab889dcbd701': 'media-server',
    '5ff643bf-31d9-4578-9c1b-47a224096839': 'file-server',
    'a8b6f750-91f1-462a-b22f-a6fb0a602a56': 'dns',
  },
  'f75bf145-cabe-408d-99c3-a9995abeeb5d': { // Among Us
    'e165a7f1-6eb2-4192-95ac-a10ab1057f2f': 'cache',
    '3e6a91ca-4c4f-4955-ae74-263a76271472': 'anomaly-detection-service',
    '1b0fa02a-77ff-42cd-94db-ceffe33eab37': 'connection-gateway',
    'acb65b3f-f8df-462d-ac57-1c4ccab1fe8d': 'message-queue',
  },
  '017335fe-64b4-4355-97bf-97d1f9befa6a': { // Dream11
    '67ea855d-8ac2-41dc-b249-769b3047ad0e': 'external-server',
    '37556469-ecb3-4fbe-a3db-1ac569670a46': 'load-balancer',
    '5836bd3e-3585-4a9c-a579-5ba381a7bed2': 'message-queue',
  },
  '585bdcd1-c078-4f17-8d38-ded37fcd1e4c': { // Slido
    'd9525225-21b3-4b05-a3f2-bf4af0950748': 'load-balancer',
    'e1dbce4d-98ee-4a7c-a278-38d7161ca2eb': 'cache',
    '86f1ff3b-2635-424c-823d-eab12d68b1cd': 'change-data-capture',
  },
  'b11228ad-cb8c-428b-ac32-6947340a2ff9': { // Reddit
    '71c382c2-3d69-4fe3-8ac6-81ac97da7e26': 'cache',
    '1abd6d4f-f049-452f-beaf-787263c07c9f': 'elastic-search',
    '3ee60f90-cc0f-47ec-b066-1a9ed9e74184': 'cdn',
    '9f113a22-de45-4340-a9ab-0036fba376ae': 'crawler-service',
  },
  'caef4ff7-b574-4d86-95c6-27423c401164': { // Stack Overflow
    '72b6515c-78ad-4832-8932-2ab2e875e2fd': 'change-data-capture',
    'f8aaad0b-5e73-48cf-ad3f-efbe144b0313': 'metrics-engine',
    'bd6b6425-84ad-454e-af75-4d818cd45aed': 'versioning-service',
    '53b7cdd4-46b7-4769-a3ce-bdff6275cd90': 'posts-service',
    'c8893e7b-9c8c-4245-bfb3-6ab151fbb057': 'elastic-search',
  },
  '01799bd4-8fba-4b5d-a25d-d49daf042a2c': { // DigiYatra
    'e72bbdbc-6b3c-471a-8605-c1dd3f71dc70': 'profile-service',
    '551e6914-504f-4ec0-9fe6-8824ed3b86ab': 'external-server',
    'bf801020-4a2c-4d27-a69e-f518b388876d': 'dashboard',
  },
  '1d83b302-6353-4829-9514-7c828e2d126c': { // Google Drive Authorization
    '90a9bfae-52ba-40a7-9493-2cc7446cd047': 'cache',
    'e8d69c50-1256-427c-a166-8c6f7b38b7dd': 'message-queue',
    'd221cc02-e0ce-456e-9385-20213f01ac27': 'change-data-capture',
  },
  'edf823f9-8de0-4281-8328-e067c9433b2d': { // Razorpay Fraud Detection
    '1f751fd3-7ce1-4c8d-bd11-2e4e30bc5eb9': 'anomaly-detection-service',
    'ced77eaf-e4ca-4feb-ac4e-e2c1bb1f19de': 'time-series-database',
    '234549c4-528a-401e-9b35-59d727762ef0': 'change-data-capture',
    '229158f9-0d28-4b34-a2f6-a49a8e7997f6': 'cache',
  },
  'e6fae8be-8ac5-42f1-b1f1-812a64a14950': { // Netflix Billing
    '30e30039-7021-486f-be95-7d040440d9d7': 'dashboard',
    'b6006141-04ce-483c-979a-aef9760211c8': 'auth-server',
    'f618eca5-dffd-426a-b0ea-9a80c718c810': 'notification-service',
    'fea241ef-2100-4c7d-9e77-029e1f91e34c': 'cdn',
  },
  '56bef3e4-3c31-4294-9f9a-85aa7e32684e': { // Discord
    '2e156ce7-d132-4f97-a638-18bba990cd0b': 'connection-gateway',
    '78c54626-9293-44c1-acd3-9e5875aab325': 'file-server',
    'cb594434-5eaf-43aa-bad4-2de597df4a6c': 'message-queue',
    'ac5184d9-97cf-484d-bc6e-8484415da69a': 'elastic-search',
  },
  '1266e449-e3a5-4135-bfeb-05be82eac795': { // Slack
    '78e3f92a-c526-441c-b34f-cb309424342c': 'elastic-search',
    'a5f47622-5084-4a72-825e-5bd9587fa739': 'file-server',
    '32671db0-0f2a-49f6-b21f-6564c29bf370': 'cache',
  },
  '544611fd-982c-4f31-b5f4-dfe836c70365': { // Snapchat
    '80fce48d-9218-49c0-9e78-979dfe29c6c2': 'connection-gateway',
    'e5769aac-59fc-495d-83f0-c817d0c0b3a5': 'task-scheduler',
    '166106c0-c3a3-49d8-a63e-6b7041ee761d': 'analytics-engine',
  },
  'c71ecbb4-536a-4f33-bf61-b2aa4450f122': { // Telegram
    '96a9bed8-7744-4c9a-97ed-0447dec913f0': 'group-service',
    '28b5f55a-be19-40c5-b65a-b574eb59c8b8': 'sms-service',
    'bec32e2d-cb30-4481-9856-a2955358fd1e': 'load-balancer',
    '7525dd98-63f5-4eb2-82fc-1e5596f6863f': 'cache',
  },
  '12e8fa28-e32b-4100-bd96-377d5db3f5bb': { // WhatsApp Group Chat
    '2b91160d-b57f-449c-92f7-68f049904b33': 'auth-server',
    '7c4d27c2-cf60-4d43-90bb-65af482541d1': 'message-queue',
    'f3f06237-88f5-45c8-9664-bc8f69be5d00': 'cdn',
    'fe7c72b4-9ed5-43cb-ad6d-97f073e9d7da': 'cache',
    '915364ec-8dc3-4726-9f38-330d41c2322e': 'database',
  },
  'fc7a0810-38de-48dd-a0c4-65e219502827': { // Medium Recommendations
    '6cb93364-6b9a-489c-ab85-8d5892366684': 'elastic-search',
    '29681f32-de73-4b98-82e2-34071c6f2da4': 'data-lake',
    '19c39e2a-1c76-4e5e-b030-ffe139d2ec3c': 'message-queue',
    '5f5b1366-d6fe-4ef6-aff2-d3132fbc9c34': 'cdn',
  },
  'a5ea0765-c1b4-4669-88e3-fb06f730fe0d': { // Swiggy Recommendations
    '1eb9b4c1-f972-4be6-9734-064267c721fd': 'message-queue',
    '121fb6ac-56ba-483a-a2fa-26763275e25e': 'change-data-capture',
    '3e993911-9434-414e-903e-05ec05a68be0': 'data-lake',
    'b26bdb89-fa20-4619-a2cf-7876af0fc7b4': 'cache',
  },
  '93146e85-9efc-486c-a068-0a53b6307e70': { // Spotify Recommendations
    '47357208-3a68-4dc3-9269-c96f9aa27d1b': 'file-server',
    'b17c771c-5584-4b82-b432-fa0784b9772c': 'profile-service',
    '551f7af8-c356-4486-a03f-80c80a619d1e': 'cdn',
    '48e31f0d-ed63-4416-94ea-a0237b626b4a': 'message-queue',
  },
  '0868fa50-02a8-4511-80bb-7104096e49a9': { // Tinder Recommendations
    '7d0f13d0-50a9-48d5-80f0-5e041e339f8c': 'auth-server',
    'ab4d6cc9-6529-4248-87ab-923bcefd4633': 'file-server',
    '2ed733a0-bebf-4291-ab81-4f36156500f1': 'data-lake',
    '6cf2adbe-58cd-46c1-8f7c-feebe045f061': 'cache',
  },
  'e310883b-ec90-4d7c-985c-f061cb0c4f62': { // DallE
    'f100d00e-2bf3-4087-967d-dc048d8e488b': 'load-balancer',
    '359602d6-00ed-4135-9fbb-25f965d36ded': 'file-server',
    'c3a29f54-ff8e-4f14-8b5e-9eb1d6e648e3': 'crawler-service',
  },
  '954d4714-a436-436f-b60c-39dc7f7461b4': { // ChatGPT Conversation
    'eee4b4e1-4930-4ac2-9170-1703ddc40004': 'rate-limiter',
    'eacae817-cda9-4e6d-bfd6-12d02f6cc5cd': 'cache',
    'ea2b1a48-ae91-4421-995c-fa2ebf527f9c': 'data-lake',
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

function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const componentSlugSet = new Set(componentsJson.map((c) => toSlug(c.type)));

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

function inferDifficulty(problem: SourceProblem): Difficulty {
  const blankCount = problem.design.nodes.filter((node) => node.data.isBlank).length;
  if (problem.requirements.length >= 3 || blankCount >= 4) return 'HARD';
  if (blankCount >= 3) return 'MEDIUM';
  return 'EASY';
}

function inferCategory(title: string): string {
  const normalized = title.toLowerCase();
  if (/(payment|wallet|trading|brokerage|billing|fraud)/.test(normalized)) return 'Fintech';
  if (/(chat|messaging|email|voip|discord|slack|telegram|whatsapp|snapchat)/.test(normalized)) return 'Messaging';
  if (/(video|streaming|conference|youtube|netflix|hotstar|spotify|audio)/.test(normalized)) return 'Media Streaming';
  if (/(map|ride|delivery|food|inventory|train|ticket|booking|calendar|meeting)/.test(normalized)) return 'Scheduling & Logistics';
  if (/(feed|social|reddit|instagram|twitter|tiktok|forum|q&a)/.test(normalized)) return 'Social Network';
  if (/(search|crawler|indexer|recommendation|dalle|chatgpt|image)/.test(normalized)) return 'Search & AI';
  if (/(document|whiteboard|design editor|canva|authorization|access control)/.test(normalized)) return 'Collaboration';
  if (/(game|chess|fantasy|polling|q&a)/.test(normalized)) return 'Interactive Systems';
  return 'System Design';
}

function resolveProblemMeta(problem: SourceProblem, usedSlugs: Set<string>): ProblemMeta {
  const explicit = PROBLEM_META[problem.id];
  const baseMeta = explicit ?? {
    slug: toKebabCase(problem.title),
    difficulty: inferDifficulty(problem),
    category: inferCategory(problem.title),
  };

  let slug = baseMeta.slug || problem.id;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseMeta.slug || problem.id}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(slug);

  return { ...baseMeta, slug };
}

function validateProblemAnswers(
  problem: SourceProblem,
  answerKeys: Record<string, string>,
) {
  const blankIds = problem.design.nodes
    .filter((node) => node.data.isBlank)
    .map((node) => node.id);
  const blankIdSet = new Set(blankIds);
  const missing = blankIds.filter((id) => !answerKeys[id]);
  if (missing.length > 0) {
    throw new Error(
      `Missing answer keys for "${problem.title}" (${problem.id}): ${missing.join(', ')}`,
    );
  }

  const unknownSlots = Object.keys(answerKeys).filter((id) => !blankIdSet.has(id));
  if (unknownSlots.length > 0) {
    throw new Error(
      `Answer keys reference non-blank nodes for "${problem.title}" (${problem.id}): ${unknownSlots.join(', ')}`,
    );
  }

  const invalidSlugs = Object.values(answerKeys).filter((slug) => !componentSlugSet.has(slug));
  if (invalidSlugs.length > 0) {
    throw new Error(
      `Answer keys use unknown component slugs for "${problem.title}" (${problem.id}): ${invalidSlugs.join(', ')}`,
    );
  }
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
  const usedProblemSlugs = new Set<string>();

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

  // 3. Seed Problems from all question sources
  console.log(`Seeding ${questionsJson.length} problems...`);
  for (const problem of questionsJson) {
    const meta = resolveProblemMeta(problem, usedProblemSlugs);
    const answerKeys = ANSWER_KEYS[problem.id] ?? {};
    validateProblemAnswers(problem, answerKeys);

    const splits = splitDesignToRequirements(problem.design, problem.requirements);
    const edgesPerReq = assignEdgesToRequirements(problem.design.edges, splits);
    const componentOptions = Array.from(new Set([
      ...problem.design.component_options.map(toSlug),
      ...Object.values(answerKeys),
    ]));
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
