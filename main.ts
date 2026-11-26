// makefun-x-reposts-02 entry — Node 22, standard library only.
//
// The entry is the X posts themselves, not this program. All this program
// does is validate POSTS.json and hand it over to the grader: it checks
// the file is a JSON object with a "posts" array of 1-15 X status URLs
// all by the same handle, then copies the file from the repository root
// into /output/POSTS.json, where the gate reads it. The
// house then reads every post POSTS.json names from X through FxTwitter's
// public read, and scores 2 points per repost, 2 per quote, 1 per like.
//
// POSTS.json names posts by @xvyperdust on X. Each one is a quote of, or a
// direct reply to, a different post of the pool: @makefunai's own posts
// with id >= 2125053632605196760. Each post's own words carry make.fun
// and/or @makefunai plus one of the account's play codes for this bounty.
//
// Local run (outside the grader's container, where MAKEFUN_BOT_DIR and
// MAKEFUN_OUTPUT_DIR stand in for /bot and /output):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const source = join(botDir, "POSTS.json");
const target = join(outputDir, "POSTS.json");

// Validate POSTS.json before handing it to the grader. A bad file here
// would silently score zero, so fail loudly instead.
function fail(message: string): never {
  console.error(`invalid POSTS.json (${source}): ${message}`);
  process.exit(1);
}

let raw: string;
try {
  raw = readFileSync(source, "utf8");
} catch (error) {
  console.error(`could not read ${source}: ${(error as Error).message}`);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(raw);
} catch (error) {
  fail(`not valid JSON: ${(error as Error).message}`);
}

if (typeof data !== "object" || data === null || !Array.isArray((data as { posts?: unknown }).posts)) {
  fail(`expected an object with a "posts" array`);
}

const posts = (data as { posts: unknown[] }).posts;

if (posts.length < 1 || posts.length > 15) {
  fail(`expected 1-15 posts, got ${posts.length}`);
}

const urlPattern = /^https:\/\/x\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)$/;
let handle: string | null = null;

for (const [index, entry] of posts.entries()) {
  if (typeof entry !== "string") {
    fail(`posts[${index}] is not a string: ${JSON.stringify(entry)}`);
  }
  const match = urlPattern.exec(entry);
  if (match === null) {
    fail(`posts[${index}] is not an X status URL: ${entry}`);
  }
  if (handle === null) {
    handle = match[1];
  } else if (match[1] !== handle) {
    fail(`posts[${index}] is by @${match[1]}, expected all posts by @${handle}`);
  }
}

mkdirSync(outputDir, { recursive: true });

try {
  copyFileSync(source, target);
} catch (error) {
  console.error(`could not copy ${source} to ${target}: ${(error as Error).message}`);
  process.exit(1);
}

console.log(`Copied ${posts.length} posts to ${target}`);
