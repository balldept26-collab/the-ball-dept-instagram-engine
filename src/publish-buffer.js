import { readFile } from "node:fs/promises";

const API_URL = "https://api.buffer.com";
const apiKey = process.env.BUFFER_API_KEY;
if (!apiKey) throw new Error("Missing required environment variable: BUFFER_API_KEY");

async function buffer(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (!response.ok || result.errors) {
    throw new Error(`Buffer API request failed: ${JSON.stringify(result)}`);
  }
  return result.data;
}

async function findInstagramChannel() {
  if (process.env.BUFFER_CHANNEL_ID) return process.env.BUFFER_CHANNEL_ID;

  const account = await buffer(`query GetOrganizations {
    account { organizations { id name } }
  }`);
  const organizations = account.account?.organizations ?? [];
  const channels = [];

  for (const organization of organizations) {
    const data = await buffer(
      `query GetChannels($organizationId: OrganizationId!) {
        channels(input: { organizationId: $organizationId }) {
          id name displayName service
        }
      }`,
      { organizationId: organization.id },
    );
    channels.push(...data.channels);
  }

  const wanted = (process.env.BUFFER_CHANNEL_NAME || "theballdept")
    .toLowerCase()
    .replace(/^@/, "");
  const matches = channels.filter((channel) => {
    const names = [channel.name, channel.displayName]
      .filter(Boolean)
      .map((name) => name.toLowerCase().replace(/^@/, ""));
    return channel.service === "instagram" && names.includes(wanted);
  });

  if (matches.length !== 1) {
    const instagram = channels
      .filter((channel) => channel.service === "instagram")
      .map((channel) => `@${channel.name || channel.displayName} (${channel.id})`)
      .join(", ");
    throw new Error(
      `Could not uniquely find Instagram channel @${wanted}. Connected Instagram channels: ${instagram || "none"}`,
    );
  }
  return matches[0].id;
}

function mediaBaseUrl() {
  if (process.env.PUBLIC_MEDIA_BASE_URL) {
    return process.env.PUBLIC_MEDIA_BASE_URL.replace(/\/$/, "");
  }
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    throw new Error(
      "Set PUBLIC_MEDIA_BASE_URL outside GitHub Actions, or run from a public GitHub repository.",
    );
  }
  const branch = process.env.GITHUB_REF_NAME || "main";
  return `https://raw.githubusercontent.com/${repository}/${branch}/output`;
}

const manifest = JSON.parse(
  await readFile(new URL("../output/reels-manifest.json", import.meta.url), "utf8"),
);
const requested = process.argv[2] || manifest[new Date().getUTCDate() % manifest.length]?.slug;
const reel = manifest.find((entry) => entry.slug === requested);
if (!reel) throw new Error(`Unknown reel slug: ${requested}`);

const channelId = await findInstagramChannel();
const videoUrl = `${mediaBaseUrl()}/${reel.video}`;
const dueAt = process.env.PUBLISH_AT || null;
const query = `mutation CreateInstagramReel($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id dueAt status } }
    ... on MutationError { message }
  }
}`;
const input = {
  text: reel.caption,
  channelId,
  assets: [
    { video: { url: videoUrl, metadata: { title: reel.hook, thumbnailOffset: 900 } } },
  ],
  metadata: { instagram: { type: "reel", shouldShareToFeed: true, isAiGenerated: true } },
  schedulingType: "automatic",
  mode: dueAt ? "customScheduled" : "addToQueue",
  needsApproval: false,
  aiAssisted: true,
  ...(dueAt ? { dueAt } : {}),
};
const result = await buffer(query, { input });
if (result.createPost?.message) {
  throw new Error(`Buffer publish failed: ${result.createPost.message}`);
}
console.log(`Queued ${reel.slug}: ${result.createPost.post.id}`);
