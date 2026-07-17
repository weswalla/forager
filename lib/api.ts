import type {
  CollectionRef,
  Link,
  Profile,
  Related,
  Rel,
  Trail,
  TrailCollection,
} from "./types";
import { dedupeByUrl, interweave, newId, weightedInterleave } from "./helpers";
import { getStoredAuth } from "./authStorage";
import { MOCK_LINKS, mockRelatedFor } from "./mockData";

/**
 * The one seam between the UI and Semble. Components never import this
 * directly — they go through useApp() actions / usePaneData().
 */
export interface Api {
  getLink(url: string): Promise<Link>; // metadata
  getRelated(url: string): Promise<Related[]>; // mutual + similar + connected, interwoven
  getSeedResults(urls: string[]): Promise<Related[]>; // aggregate across seeds, deduped
  getRandomLinks(n: number, excludeUrls?: string[]): Promise<Link[]>; // seed suggestions (global feed)
  saveCollection(trail: Trail, profile: Profile): Promise<CollectionRef>; // save → shareable
  saveLink(url: string, note?: string): Promise<void>; // add a URL to my Semble library
  signIn(apiKey: string): Promise<Profile>; // validate key, return profile
  getTrailCollection(
    handleOrDid: string,
    recordKey: string,
  ): Promise<TrailCollection>;
}

/* ============================ mock ============================ */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = () => 180 + Math.random() * 320;

function splitByRel(rels: Related[]): Record<Rel, Related[]> {
  return {
    mutual: rels.filter((r) => r.rel === "mutual"),
    similar: rels.filter((r) => r.rel === "similar"),
    connected: rels.filter((r) => r.rel === "connected"),
  };
}

const mockApi: Api = {
  async getLink(url) {
    await delay(jitter());
    const found = MOCK_LINKS.find((l) => l.url === url);
    if (found) return found;
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return { url, title: url, description: "", domain };
  },

  async getRelated(url) {
    await delay(jitter());
    // dedupe: the same link can surface under multiple relationship kinds
    const { mutual, similar, connected } = splitByRel(
      dedupeByUrl(mockRelatedFor(url)),
    );
    return interweave(mutual, similar, connected);
  },

  async getSeedResults(urls) {
    await delay(jitter());
    const merged = urls.flatMap((u) => mockRelatedFor(u));
    const deduped = dedupeByUrl(merged).filter((r) => !urls.includes(r.url));
    const { mutual, similar, connected } = splitByRel(deduped);
    return interweave(mutual, similar, connected);
  },

  async getRandomLinks(n, excludeUrls = []) {
    const pool = MOCK_LINKS.filter((l) => !excludeUrls.includes(l.url));
    const out: Link[] = [];
    for (let i = 0; i < n && pool.length; i++) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  },

  async saveCollection(trail, profile) {
    await delay(600);
    const recordKey = newId("rk");
    const uri = `at://did:mock:${profile.handle}/network.cosmik.collection/${recordKey}`;
    const collection: TrailCollection = {
      uri,
      recordKey,
      handle: profile.handle,
      title: trail.title,
      description: trail.description,
      author: profile.displayName,
      links: dedupeByUrl([...trail.seeds, ...trail.path]),
    };
    const store = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) ?? "{}");
    store[`${profile.handle}/${recordKey}`] = collection;
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(store));
    return {
      uri,
      recordKey,
      handle: profile.handle,
      url: `/user/${profile.handle}/trail/${recordKey}`,
    };
  },

  async saveLink() {
    await delay(400);
  },

  async signIn(apiKey) {
    await delay(500);
    if (!apiKey.trim()) throw new Error("Enter an API key");
    // mock mode: any key works
    return { handle: "wanderer.semble.dev", displayName: "Wandering Bear" };
  },

  async getTrailCollection(handleOrDid, recordKey) {
    await delay(400);
    // real impl: resolve handle → did, build the AT-URI, get_collection_by_aturi
    const store = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) ?? "{}");
    const collection = store[`${handleOrDid}/${recordKey}`];
    if (!collection) throw new Error("This shared trail could not be found.");
    return collection as TrailCollection;
  },
};

const COLLECTIONS_KEY = "forager.collections"; // mock-mode collection store (same browser only)

/* ============================ semble ============================ */
/*
 * Real implementation against https://api.semble.so/xrpc (docs/semble-api.json).
 * Auth is an x-api-key header; the key is stored by useAuth. Endpoints that
 * work logged out (metadata, feed, related lookups) just omit the header.
 */

const SEMBLE_BASE =
  process.env.NEXT_PUBLIC_SEMBLE_API_URL ?? "https://api.semble.so/xrpc";

interface XrpcOpts {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  apiKey?: string; // override; defaults to the stored key
}

async function xrpc<T>(nsid: string, opts: XrpcOpts = {}): Promise<T> {
  const url = new URL(`${SEMBLE_BASE}/${nsid}`);
  for (const [k, v] of Object.entries(opts.params ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const key = opts.apiKey ?? getStoredAuth()?.apiKey;
  const res = await fetch(url, {
    method: opts.body ? "POST" : "GET",
    headers: {
      ...(opts.body ? { "content-type": "application/json" } : {}),
      ...(key ? { "x-api-key": key } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let message = `Semble request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.json();
}

/* ---- response fragments we actually read ---- */

interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  imageUrl?: string;
}

interface UrlCard {
  url: string;
  cardContent?: UrlMetadata;
}

interface CollectionPage {
  id: string;
  uri: string;
  name: string;
  description?: string;
  author: { name: string; handle: string };
  urlCards?: UrlCard[];
}

function metadataToLink(m: UrlMetadata): Link {
  let domain = m.siteName ?? "";
  if (!domain) {
    try {
      domain = new URL(m.url).hostname.replace(/^www\./, "");
    } catch {
      domain = m.url;
    }
  }
  return {
    url: m.url,
    title: m.title || m.url,
    description: m.description ?? "",
    domain,
    image: m.imageUrl,
  };
}

const cardToLink = (c: UrlCard): Link =>
  metadataToLink(c.cardContent ?? { url: c.url });

/* ---- related-link sources ---- */

const MUTUAL_COLLECTIONS = 3; // how many shared collections to walk per link
const RELATED_LIMIT = 12;

async function fetchMutual(url: string): Promise<Related[]> {
  const { collections } = await xrpc<{ collections: { id: string }[] }>(
    "network.cosmik.collection.getForUrl",
    {
      params: {
        url,
        limit: MUTUAL_COLLECTIONS,
        sortBy: "updatedAt",
        sortOrder: "desc",
      },
    },
  );
  const pages = await Promise.all(
    collections.slice(0, MUTUAL_COLLECTIONS).map((c) =>
      xrpc<CollectionPage>("network.cosmik.collection.get", {
        params: { collectionId: c.id, limit: RELATED_LIMIT },
      }).catch(() => null),
    ),
  );
  return pages
    .filter((p): p is CollectionPage => Boolean(p))
    .flatMap((p) => p.urlCards ?? [])
    .filter((c) => c.url !== url)
    .map((c) => ({ ...cardToLink(c), rel: "mutual" as const }));
}

async function fetchSimilar(url: string): Promise<Related[]> {
  const { urls } = await xrpc<{
    urls: { url: string; metadata: UrlMetadata }[];
  }>("network.cosmik.search.getSimilarUrls", {
    params: { url, limit: RELATED_LIMIT },
  });
  return urls
    .filter((u) => u.url !== url)
    .map((u) => ({ ...metadataToLink(u.metadata), rel: "similar" as const }));
}

interface ConnectionItem {
  connection: { type?: string; note?: string };
  source: { url: string; metadata: UrlMetadata };
  target: { url: string; metadata: UrlMetadata };
}

async function fetchConnected(url: string): Promise<Related[]> {
  const { connections } = await xrpc<{ connections: ConnectionItem[] }>(
    "network.cosmik.connection.getForUrl",
    { params: { url, direction: "both", limit: RELATED_LIMIT } },
  );
  return connections
    .map((c) => {
      const other = c.source.url === url ? c.target : c.source;
      const note = [
        c.connection.type?.toLowerCase().replace(/_/g, " "),
        c.connection.note,
      ]
        .filter(Boolean)
        .join(" — ");
      return {
        ...metadataToLink(other.metadata),
        rel: "connected" as const,
        note: note || undefined,
      };
    })
    .filter((r) => r.url !== url);
}

async function sembleRelated(url: string): Promise<Related[]> {
  const [mutual, similar, connected] = await Promise.all([
    fetchMutual(url).catch(() => [] as Related[]),
    fetchSimilar(url).catch(() => [] as Related[]),
    fetchConnected(url).catch(() => [] as Related[]),
  ]);
  const deduped = dedupeByUrl([...connected, ...mutual, ...similar]); // first rel wins
  const byRel = splitByRel(deduped);
  return weightedInterleave(byRel.mutual, byRel.similar, byRel.connected);
}

/* ---- seed pool from the global feed (works logged out) ---- */

const FEED_POOL_SIZE = 100;
let feedPool: Link[] | null = null;

interface FeedActivity {
  card?: UrlCard;
  connection?: {
    source: { url: string; metadata: UrlMetadata };
    target: { url: string; metadata: UrlMetadata };
  };
}

async function getFeedPool(): Promise<Link[]> {
  if (feedPool) return feedPool;
  const { activities } = await xrpc<{ activities: FeedActivity[] }>(
    "network.cosmik.feed.getGlobal",
    {
      params: { limit: FEED_POOL_SIZE },
    },
  );
  const links: Link[] = [];
  for (const a of activities) {
    if (a.card?.url) links.push(cardToLink(a.card));
    if (a.connection) {
      links.push(metadataToLink(a.connection.source.metadata));
      links.push(metadataToLink(a.connection.target.metadata));
    }
  }
  feedPool = dedupeByUrl(links);
  return feedPool;
}

const recordKeyFromUri = (uri: string) => uri.split("/").pop() ?? uri;

function pageToTrailCollection(page: CollectionPage): TrailCollection {
  return {
    uri: page.uri,
    recordKey: recordKeyFromUri(page.uri),
    handle: page.author.handle,
    title: page.name,
    description: page.description ?? "",
    author: page.author.name || page.author.handle,
    links: (page.urlCards ?? []).map(cardToLink),
  };
}

const sembleApi: Api = {
  async getLink(url) {
    const { metadata } = await xrpc<{ metadata: UrlMetadata }>(
      "network.cosmik.card.getUrlMetadata",
      {
        params: { url },
      },
    );
    return metadataToLink(metadata);
  },

  getRelated: sembleRelated,

  async getSeedResults(urls) {
    const perSeed = await Promise.all(
      urls.map((u) => sembleRelated(u).catch(() => [] as Related[])),
    );
    return dedupeByUrl(perSeed.flat()).filter((r) => !urls.includes(r.url));
  },

  async getRandomLinks(n, excludeUrls = []) {
    const pool = (await getFeedPool()).filter(
      (l) => !excludeUrls.includes(l.url),
    );
    const out: Link[] = [];
    for (let i = 0; i < n && pool.length; i++) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  },

  async saveCollection(trail, profile) {
    const { collectionId } = await xrpc<{ collectionId: string }>(
      "network.cosmik.collection.create",
      {
        body: {
          name: trail.title,
          description: trail.description,
          accessType: "OPEN",
        },
      },
    );
    // add links one at a time — keeps trail order and avoids hammering the API
    for (const link of dedupeByUrl([...trail.seeds, ...trail.path])) {
      await xrpc("network.cosmik.card.addUrl", {
        body: { url: link.url, collectionIds: [collectionId] },
      });
    }
    const page = await xrpc<CollectionPage>("network.cosmik.collection.get", {
      params: { collectionId, limit: 1 },
    });
    const recordKey = recordKeyFromUri(page.uri);
    return {
      uri: page.uri,
      recordKey,
      handle: profile.handle,
      url: `/user/${profile.handle}/trail/${recordKey}`,
    };
  },

  async saveLink(url, note) {
    await xrpc("network.cosmik.card.addUrl", { body: { url, note } });
  },

  async signIn(apiKey) {
    const me = await xrpc<{ name: string; handle: string; avatarUrl?: string }>(
      "network.cosmik.actor.getMyProfile",
      { apiKey },
    );
    return {
      handle: me.handle,
      displayName: me.name || me.handle,
      avatar: me.avatarUrl,
    };
  },

  async getTrailCollection(handleOrDid, recordKey) {
    const page = await xrpc<CollectionPage>(
      "network.cosmik.collection.getByAtUri",
      {
        params: { handle: handleOrDid, recordKey, limit: 100 },
      },
    );
    return pageToTrailCollection(page);
  },
};

export const api: Api = process.env.NEXT_PUBLIC_USE_MOCK ? mockApi : sembleApi;
