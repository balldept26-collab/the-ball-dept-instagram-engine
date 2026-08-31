import { readFile } from "node:fs/promises";

const required = ["IG_USER_ID", "IG_ACCESS_TOKEN", "PUBLIC_MEDIA_BASE_URL"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";
const graphBase = `https://graph.facebook.com/${graphVersion}`;
const manifest = JSON.parse(await readFile(new URL("../output/manifest.json", import.meta.url), "utf8"));
const requestedSlug = process.argv[2] || manifest[0].slug;
const post = manifest.find((entry) => entry.slug === requestedSlug);
if (!post) throw new Error(`Unknown post slug: ${requestedSlug}`);

const mediaUrl = `${process.env.PUBLIC_MEDIA_BASE_URL.replace(/\/$/, "")}/${post.image}`;
const createBody = new URLSearchParams({
  image_url: mediaUrl,
  caption: post.caption,
  access_token: process.env.IG_ACCESS_TOKEN
});
const created = await fetch(`${graphBase}/${process.env.IG_USER_ID}/media`, { method: "POST", body: createBody });
const container = await created.json();
if (!created.ok || !container.id) throw new Error(`Container creation failed: ${JSON.stringify(container)}`);

const publishBody = new URLSearchParams({ creation_id: container.id, access_token: process.env.IG_ACCESS_TOKEN });
const published = await fetch(`${graphBase}/${process.env.IG_USER_ID}/media_publish`, { method: "POST", body: publishBody });
const result = await published.json();
if (!published.ok || !result.id) throw new Error(`Publish failed: ${JSON.stringify(result)}`);
console.log(`Published ${post.slug}: ${result.id}`);
