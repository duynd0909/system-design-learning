# Problems Catalog

Extracted from `apps/api/prisma/seed.ts` on 2026-05-05.
Use this document to inspect all problems, their requirements, node graphs, and answer keys.

---

## Summary

| # | Slug | Title | Difficulty | Category | Requirements | Blanks Total |
|---|------|-------|------------|----------|:---:|:---:|
| 1 | `instagram` | Design Instagram | MEDIUM | Social Media | 3 | 9 |
| 2 | `youtube` | Design YouTube | HARD | Video Streaming | 4 | 9 |
| 3 | `whatsapp` | Design WhatsApp | EASY | Messaging | 2 | 5 |
| 4 | `tiktok` | Design TikTok | MEDIUM | Video Streaming | 3 | 8 |
| 5 | `zoom` | Design Zoom | MEDIUM | Real-Time Communication | 3 | 8 |
| 6 | `uber` | Design Uber | HARD | Marketplace | 3 | 9 |
| 7 | `twitter-x` | Design Twitter/X | HARD | Social Media | 3 | 9 |
| 8 | `netflix` | Design Netflix | HARD | Video Streaming | 4 | 10 |
| 9 | `airbnb` | Design Airbnb | MEDIUM | Marketplace | 3 | 9 |
| 10 | `discord` | Design Discord | MEDIUM | Real-Time Communication | 3 | 9 |

---

## Component Types Reference

| Slug | Label | Category |
|------|-------|----------|
| `cdn` | CDN | networking |
| `dns` | DNS | networking |
| `load-balancer` | Load Balancer | networking |
| `api-gateway` | API Gateway | networking |
| `app-server` | Application Server | compute |
| `cache` | Cache | storage |
| `relational-db` | Relational DB | storage |
| `nosql-db` | NoSQL DB | storage |
| `message-queue` | Message Queue | messaging |
| `object-storage` | Object Storage | storage |
| `search-engine` | Search Engine | data |
| `media-server` | Media Server | media |

---

---

## 1. Instagram — MEDIUM | Social Media

**Description:** Design a photo-sharing social network that handles millions of daily active users, supports image uploads, feeds, and follower relationships.

### Requirement 1 — Handle user traffic

**Prompt:** Millions of users are hitting your app simultaneously. How do you get their requests to your servers reliably?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | User | — |
| `dns-1` | component | DNS | ✅ |
| `lb-1` | component | Load Balancer | ✅ |
| `app-1` | component | App Server 1 | — |

**Edges:**
- `user-1` → `dns-1` _(DNS lookup)_
- `dns-1` → `lb-1`
- `lb-1` → `app-1`

**Answer key:** `dns-1` → `dns`, `lb-1` → `load-balancer`

---

### Requirement 2 — Serve and cache data

**Prompt:** Your single server is struggling under load and reads are slow. What do you add to scale and keep data consistent?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `app-2` | component | App Server 2 | ✅ |
| `cache-1` | component | Cache (Redis) | ✅ |
| `db-1` | component | Primary DB | ✅ |

**Edges (includes cross-req):**
- `lb-1` → `app-2` _(cross-req)_
- `app-1` → `cache-1` _(read)_
- `app-1` → `db-1` _(write)_
- `app-2` → `cache-1` _(read)_
- `app-2` → `db-1` _(write)_

**Answer key:** `app-2` → `app-server`, `cache-1` → `cache`, `db-1` → `relational-db`

---

### Requirement 3 — Store and deliver media

**Prompt:** Users upload millions of photos daily and expect instant delivery worldwide. How do you store and serve media at scale?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `cdn-1` | component | CDN (Static) | ✅ |
| `cdn-2` | component | CDN (Media) | ✅ |
| `obj-1` | component | Object Storage | ✅ |
| `db-2` | component | Read Replica | ✅ |

**Edges (includes cross-req):**
- `user-1` → `cdn-1` _(static assets)_
- `user-1` → `cdn-2` _(media stream)_
- `app-1` → `obj-1` _(upload)_
- `app-2` → `obj-1` _(upload)_
- `cdn-2` → `obj-1` _(origin pull)_
- `db-1` → `db-2` _(replication)_

**Answer key:** `cdn-1` → `cdn`, `cdn-2` → `cdn`, `obj-1` → `object-storage`, `db-2` → `relational-db`

---

---

## 2. YouTube — HARD | Video Streaming

**Description:** Design a video streaming platform that supports video uploads, transcoding, and delivery to millions of concurrent viewers.

### Requirement 1 — Route viewer traffic

**Prompt:** Hundreds of millions of viewers stream video simultaneously. How do you route traffic efficiently from the edge to your backend?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `viewer-1` | actor | Viewer | — |
| `dns-1` | component | DNS | ✅ |
| `cdn-1` | component | CDN | ✅ |
| `lb-1` | component | Load Balancer | — |

**Edges:**
- `viewer-1` → `dns-1` _(lookup)_
- `viewer-1` → `cdn-1` _(stream)_
- `dns-1` → `lb-1`
- `cdn-1` → `lb-1`

**Answer key:** `dns-1` → `dns`, `cdn-1` → `cdn`

---

### Requirement 2 — Serve API requests

**Prompt:** Your backend must handle millions of API calls for search, recommendations, and playback. How do you structure the request path?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `api-gw` | component | API Gateway | ✅ |
| `app-1` | component | App Server | ✅ |

**Edges (includes cross-req):**
- `lb-1` → `api-gw`
- `lb-1` → `app-1`

**Answer key:** `api-gw` → `api-gateway`, `app-1` → `app-server`

---

### Requirement 3 — Handle uploads and transcoding

**Prompt:** Creators upload large video files around the clock. What infrastructure handles the upload and converts them to multiple formats?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `creator-1` | actor | Creator | — |
| `mq-1` | component | Message Queue | ✅ |
| `media-1` | component | Transcoder | ✅ |

**Edges (includes cross-req):**
- `creator-1` → `lb-1` _(upload)_
- `app-1` → `mq-1` _(enqueue job)_
- `mq-1` → `media-1` _(transcode)_

**Answer key:** `mq-1` → `message-queue`, `media-1` → `media-server`

---

### Requirement 4 — Store and cache data

**Prompt:** You need fast API responses, persistent video metadata, and durable video file storage. How do you architect the data layer?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `cache-1` | component | Cache (Redis) | ✅ |
| `db-1` | component | Metadata DB | ✅ |
| `obj-1` | component | Video Storage | ✅ |

**Edges (includes cross-req):**
- `api-gw` → `cache-1` _(cache read)_
- `app-1` → `db-1` _(metadata)_
- `media-1` → `obj-1` _(store video)_
- `cdn-1` → `obj-1` _(origin pull)_

**Answer key:** `cache-1` → `cache`, `db-1` → `relational-db`, `obj-1` → `object-storage`

---

---

## 3. WhatsApp — EASY | Messaging

**Description:** Design a real-time messaging platform that delivers billions of messages per day with low latency, supporting text, voice notes, and media sharing.

### Requirement 1 — Route messaging traffic

**Prompt:** Hundreds of millions of users need persistent, low-latency connections for real-time messaging. How do you handle that traffic?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | User | — |
| `dns-1` | component | DNS | ✅ |
| `lb-1` | component | Load Balancer | ✅ |
| `app-1` | component | App Server | — |

**Edges:**
- `user-1` → `dns-1` _(lookup)_
- `dns-1` → `lb-1`
- `lb-1` → `app-1`

**Answer key:** `dns-1` → `dns`, `lb-1` → `load-balancer`

---

### Requirement 2 — Store messages and media

**Prompt:** Users exchange billions of messages and media files every day. What's your storage strategy for speed and durability?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `cache-1` | component | Cache (Redis) | ✅ |
| `db-1` | component | Message DB | ✅ |
| `obj-1` | component | Media Storage | ✅ |

**Edges (includes cross-req):**
- `app-1` → `cache-1` _(recent msgs)_
- `app-1` → `db-1` _(persist)_
- `app-1` → `obj-1` _(media upload)_

**Answer key:** `cache-1` → `cache`, `db-1` → `relational-db`, `obj-1` → `object-storage`

---

---

## 4. TikTok — MEDIUM | Video Streaming

**Description:** Design a short-video platform that delivers personalised video feeds to hundreds of millions of users with a recommendation engine and global video delivery.

### Requirement 1 — Route mobile traffic

**Prompt:** Your mobile app needs to serve static assets and stream video to users globally with minimal latency. How do you design the network layer?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | User | — |
| `dns-1` | component | DNS | ✅ |
| `cdn-1` | component | CDN | ✅ |
| `lb-1` | component | Load Balancer | — |

**Edges:**
- `user-1` → `dns-1` _(lookup)_
- `user-1` → `cdn-1` _(stream)_
- `dns-1` → `lb-1`
- `cdn-1` → `lb-1`

**Answer key:** `dns-1` → `dns`, `cdn-1` → `cdn`

---

### Requirement 2 — Serve the feed

**Prompt:** Every user sees a personalised video feed. What powers the API layer and stores the feed data?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `api-gw` | component | API Gateway | ✅ |
| `app-1` | component | App Server | ✅ |
| `nosql-1` | component | Feed Store (NoSQL) | ✅ |

**Edges (includes cross-req):**
- `lb-1` → `api-gw` _(API calls)_
- `lb-1` → `app-1`
- `app-1` → `nosql-1` _(feed read/write)_

**Answer key:** `api-gw` → `api-gateway`, `app-1` → `app-server`, `nosql-1` → `nosql-db`

---

### Requirement 3 — Deliver short videos

**Prompt:** Creator videos need to reach viewers in seconds, transcoded for any device and streamed from the nearest edge. How?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `obj-1` | component | Video Storage | ✅ |
| `media-1` | component | Transcoder | ✅ |
| `cache-1` | component | Cache (Redis) | ✅ |

**Edges (includes cross-req):**
- `app-1` → `obj-1` _(upload)_
- `obj-1` → `media-1` _(transcode)_
- `media-1` → `cdn-1` _(push)_
- `api-gw` → `cache-1` _(hot metadata)_

**Answer key:** `obj-1` → `object-storage`, `media-1` → `media-server`, `cache-1` → `cache`

---

---

## 5. Zoom — MEDIUM | Real-Time Communication

**Description:** Design a video-conferencing platform that supports real-time audio/video for hundreds of participants, screen sharing, cloud recording, and meeting scheduling.

### Requirement 1 — Connect users

**Prompt:** A user clicks a meeting link and expects to be connected instantly. How does the infrastructure resolve and route them to the right session?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | User | — |
| `dns-1` | component | DNS | ✅ |
| `lb-1` | component | Load Balancer | ✅ |
| `app-1` | component | Signalling Server | — |

**Edges:**
- `user-1` → `dns-1` _(lookup)_
- `dns-1` → `lb-1`
- `lb-1` → `app-1` _(signalling)_

**Answer key:** `dns-1` → `dns`, `lb-1` → `load-balancer`

---

### Requirement 2 — Handle real-time media

**Prompt:** A meeting has 100 participants — all sending and receiving audio and video in real time. What handles the media?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `cdn-1` | component | CDN | ✅ |
| `media-1` | component | Media Server | ✅ |
| `mq-1` | component | Event Queue | ✅ |

**Edges (includes cross-req):**
- `user-1` → `cdn-1` _(static)_
- `lb-1` → `media-1` _(WebRTC relay)_
- `app-1` → `mq-1` _(events)_

**Answer key:** `cdn-1` → `cdn`, `media-1` → `media-server`, `mq-1` → `message-queue`

---

### Requirement 3 — Persist sessions and recordings

**Prompt:** Meeting state, participant metadata, and cloud recordings all need to persist. How do you design the storage layer?

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `cache-1` | component | Session Cache | ✅ |
| `db-1` | component | Meeting DB | ✅ |
| `obj-1` | component | Recording Storage | ✅ |

**Edges (includes cross-req):**
- `app-1` → `cache-1` _(session state)_
- `app-1` → `db-1` _(meeting data)_
- `media-1` → `obj-1` _(save recording)_

**Answer key:** `cache-1` → `cache`, `db-1` → `relational-db`, `obj-1` → `object-storage`

---

---

## 6. Uber — HARD | Marketplace

**Description:** Design a ride-hailing marketplace that matches riders with nearby drivers, tracks trips in real time, and processes payments reliably.

### Requirement 1 — Route riders into the platform

**Prompt:** Riders and drivers need reliable entry points before any matching logic can run.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | Rider App | — |
| `driver-1` | actor | Driver App | — |
| `dns-1` | component | DNS | ✅ |
| `api-gw` | component | API Gateway | ✅ |
| `lb-1` | component | Load Balancer | ✅ |

**Edges:**
- `user-1` → `dns-1` _(lookup)_
- `driver-1` → `dns-1` _(lookup)_
- `dns-1` → `api-gw`
- `api-gw` → `lb-1`

**Answer key:** `dns-1` → `dns`, `api-gw` → `api-gateway`, `lb-1` → `load-balancer`

---

### Requirement 2 — Match riders and drivers nearby

**Prompt:** The platform needs fast location reads, trip state, and a matching service.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `app-1` | component | Matching Service | ✅ |
| `cache-1` | component | Location Cache | ✅ |
| `db-1` | component | Trip DB | ✅ |

**Edges (includes cross-req):**
- `lb-1` → `app-1`
- `app-1` → `cache-1` _(nearby drivers)_
- `app-1` → `db-1` _(trip state)_

**Answer key:** `app-1` → `app-server`, `cache-1` → `cache`, `db-1` → `relational-db`

---

### Requirement 3 — Process events and search locations

**Prompt:** Trips emit asynchronous events and location search must stay fast under heavy demand.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `mq-1` | component | Trip Events Queue | ✅ |
| `search-1` | component | Geo Search | ✅ |
| `nosql-1` | component | Driver Location Store | ✅ |

**Edges (includes cross-req):**
- `app-1` → `mq-1` _(events)_
- `app-1` → `search-1` _(pickup search)_
- `cache-1` → `nosql-1` _(location snapshots)_

**Answer key:** `mq-1` → `message-queue`, `search-1` → `search-engine`, `nosql-1` → `nosql-db`

---

---

## 7. Twitter/X — HARD | Social Media

**Description:** Design a social feed platform that supports posting, timelines, search, media uploads, and viral fan-out.

### Requirement 1 — Serve global feed traffic

**Prompt:** Users need a low-latency path into timeline and posting APIs.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | User | — |
| `dns-1` | component | DNS | ✅ |
| `cdn-1` | component | Media CDN | ✅ |
| `lb-1` | component | Load Balancer | ✅ |

**Edges:**
- `user-1` → `dns-1`
- `user-1` → `cdn-1` _(media)_
- `dns-1` → `lb-1`

**Answer key:** `dns-1` → `dns`, `cdn-1` → `cdn`, `lb-1` → `load-balancer`

---

### Requirement 2 — Store posts and hot timelines

**Prompt:** Timeline reads are much more frequent than writes, so the serving path needs caching.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `app-1` | component | Timeline Service | ✅ |
| `cache-1` | component | Timeline Cache | ✅ |
| `db-1` | component | Post Store | ✅ |

**Edges (includes cross-req):**
- `lb-1` → `app-1`
- `app-1` → `cache-1` _(hot timelines)_
- `app-1` → `db-1` _(posts)_

**Answer key:** `app-1` → `app-server`, `cache-1` → `cache`, `db-1` → `nosql-db`

---

### Requirement 3 — Fan out posts and support search

**Prompt:** New posts need asynchronous fan-out, search indexing, and durable media storage.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `mq-1` | component | Fanout Queue | ✅ |
| `search-1` | component | Search Index | ✅ |
| `obj-1` | component | Media Storage | ✅ |

**Edges (includes cross-req):**
- `app-1` → `mq-1` _(post events)_
- `mq-1` → `search-1` _(index)_
- `cdn-1` → `obj-1` _(origin)_

**Answer key:** `mq-1` → `message-queue`, `search-1` → `search-engine`, `obj-1` → `object-storage`

---

---

## 8. Netflix — HARD | Video Streaming

**Description:** Design a streaming platform that serves personalized catalogs and high-quality video playback to global viewers.

### Requirement 1 — Route viewer playback traffic

**Prompt:** Viewers need reliable API traffic and video delivery close to their region.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `viewer-1` | actor | Viewer | — |
| `dns-1` | component | DNS | ✅ |
| `cdn-1` | component | Video CDN | ✅ |
| `lb-1` | component | Load Balancer | ✅ |

**Edges:**
- `viewer-1` → `dns-1`
- `viewer-1` → `cdn-1` _(playback)_
- `dns-1` → `lb-1`

**Answer key:** `dns-1` → `dns`, `cdn-1` → `cdn`, `lb-1` → `load-balancer`

---

### Requirement 2 — Serve catalog and profiles

**Prompt:** Catalog and profile reads need low latency and durable account metadata.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `api-gw` | component | API Gateway | ✅ |
| `app-1` | component | Catalog Service | ✅ |
| `cache-1` | component | Catalog Cache | ✅ |
| `db-1` | component | User DB | ✅ |

**Edges (includes cross-req):**
- `lb-1` → `api-gw`
- `api-gw` → `app-1`
- `app-1` → `cache-1`
- `app-1` → `db-1`

**Answer key:** `api-gw` → `api-gateway`, `app-1` → `app-server`, `cache-1` → `cache`, `db-1` → `relational-db`

---

### Requirement 3 — Transcode and store videos

**Prompt:** Uploaded source files must be transcoded and served as adaptive bitrate streams.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `mq-1` | component | Transcode Queue | ✅ |
| `media-1` | component | Transcoder | ✅ |
| `obj-1` | component | Video Storage | ✅ |

**Edges (includes cross-req):**
- `app-1` → `mq-1` _(encode jobs)_
- `mq-1` → `media-1`
- `media-1` → `obj-1`
- `cdn-1` → `obj-1` _(origin pull)_

**Answer key:** `mq-1` → `message-queue`, `media-1` → `media-server`, `obj-1` → `object-storage`

---

### Requirement 4 — Recommend titles

**Prompt:** Personalized recommendations need searchable metadata and flexible viewing signals.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `search-1` | component | Title Search | ✅ |
| `nosql-1` | component | Viewing Signals | ✅ |

**Edges (includes cross-req):**
- `app-1` → `search-1`
- `app-1` → `nosql-1`

**Answer key:** `search-1` → `search-engine`, `nosql-1` → `nosql-db`

---

---

## 9. Airbnb — MEDIUM | Marketplace

**Description:** Design a lodging marketplace with searchable listings, booking workflows, messaging, and photo-heavy listing pages.

### Requirement 1 — Route marketplace traffic

**Prompt:** Guests and hosts need reliable access to listing and booking services.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `guest-1` | actor | Guest | — |
| `host-1` | actor | Host | — |
| `dns-1` | component | DNS | ✅ |
| `lb-1` | component | Load Balancer | ✅ |
| `app-1` | component | Marketplace App | ✅ |

**Edges:**
- `guest-1` → `dns-1`
- `host-1` → `dns-1`
- `dns-1` → `lb-1`
- `lb-1` → `app-1`

**Answer key:** `dns-1` → `dns`, `lb-1` → `load-balancer`, `app-1` → `app-server`

---

### Requirement 2 — Search listings and book stays

**Prompt:** Listing discovery and booking writes need different storage and caching behavior.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `search-1` | component | Listing Search | ✅ |
| `cache-1` | component | Availability Cache | ✅ |
| `db-1` | component | Booking DB | ✅ |

**Edges (includes cross-req):**
- `app-1` → `search-1`
- `app-1` → `cache-1`
- `app-1` → `db-1`

**Answer key:** `search-1` → `search-engine`, `cache-1` → `cache`, `db-1` → `relational-db`

---

### Requirement 3 — Store photos and async messages

**Prompt:** Listing photos and guest-host communication should not block booking requests.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `cdn-1` | component | Photo CDN | ✅ |
| `obj-1` | component | Photo Storage | ✅ |
| `mq-1` | component | Messaging Queue | ✅ |

**Edges (includes cross-req):**
- `guest-1` → `cdn-1` _(photos)_
- `cdn-1` → `obj-1` _(origin)_
- `app-1` → `mq-1` _(messages)_

**Answer key:** `cdn-1` → `cdn`, `obj-1` → `object-storage`, `mq-1` → `message-queue`

---

---

## 10. Discord — MEDIUM | Real-Time Communication

**Description:** Design a real-time community chat platform with channels, presence, media sharing, and durable message history.

### Requirement 1 — Connect clients to real-time services

**Prompt:** Clients need a reliable route into gateway and chat services.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `user-1` | actor | Client | — |
| `dns-1` | component | DNS | ✅ |
| `lb-1` | component | Load Balancer | ✅ |
| `api-gw` | component | Realtime Gateway | ✅ |

**Edges:**
- `user-1` → `dns-1`
- `dns-1` → `lb-1`
- `lb-1` → `api-gw`

**Answer key:** `dns-1` → `dns`, `lb-1` → `load-balancer`, `api-gw` → `api-gateway`

---

### Requirement 2 — Handle chat fanout and presence

**Prompt:** Messages and presence changes must fan out to many connected clients quickly.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `app-1` | component | Chat Service | ✅ |
| `mq-1` | component | Message Fanout | ✅ |
| `cache-1` | component | Presence Cache | ✅ |

**Edges (includes cross-req):**
- `api-gw` → `app-1`
- `app-1` → `mq-1`
- `app-1` → `cache-1`

**Answer key:** `app-1` → `app-server`, `mq-1` → `message-queue`, `cache-1` → `cache`

---

### Requirement 3 — Persist messages and media

**Prompt:** Channel history and attachments need durable storage with efficient retrieval.

| Node ID | Type | Label | Blank? |
|---------|------|-------|--------|
| `db-1` | component | Message Store | ✅ |
| `obj-1` | component | Attachment Storage | ✅ |
| `cdn-1` | component | Attachment CDN | ✅ |

**Edges (includes cross-req):**
- `app-1` → `db-1`
- `app-1` → `obj-1`
- `cdn-1` → `obj-1`
- `user-1` → `cdn-1`

**Answer key:** `db-1` → `nosql-db`, `obj-1` → `object-storage`, `cdn-1` → `cdn`

---

---

## Enhancement Notes

_Use this section to record ideas for improving problems — prompts, graph topology, node labels, edge labels, difficulty rebalancing, etc._

| Problem | Area | Note |
|---------|------|------|
| | | |
