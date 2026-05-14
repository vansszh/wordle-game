#!/usr/bin/env node
// Builds public/words/valid-words.json and public/words/answers.json
// from the canonical Wordle word lists.
//
// Source: tabatkins/wordle-list (GitHub) — public domain. This is the most
// frequently mirrored copy of the exact lists shipped by the original
// Wordle game (12,972 valid guesses; the 2,309-word answer list is the
// pre-NYT-curation set).

import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";

const VALID_URL =
  "https://raw.githubusercontent.com/tabatkins/wordle-list/main/words";
const ANSWERS_URL =
  "https://raw.githubusercontent.com/3b1b/videos/master/_2022/wordle/data/possible_words.txt";

const OUT_DIR = path.resolve(process.cwd(), "public", "words");

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      // follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return fetchText(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`GET ${url} -> ${res.statusCode}`));
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(30_000, () => req.destroy(new Error("timeout")));
  });
}

function normalize(text) {
  return text
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]{5}$/.test(w));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("Downloading valid-words list ...");
  const validRaw = await fetchText(VALID_URL);
  const valid = Array.from(new Set(normalize(validRaw))).sort();

  console.log("Downloading answers list ...");
  const answersRaw = await fetchText(ANSWERS_URL);
  const answers = Array.from(new Set(normalize(answersRaw)));

  if (valid.length < 10_000) throw new Error(`valid list too small: ${valid.length}`);
  if (answers.length < 1_500) throw new Error(`answers list too small: ${answers.length}`);

  // Make sure every answer is also in the accepted-guess set.
  const validSet = new Set(valid);
  for (const a of answers) {
    if (!validSet.has(a)) {
      validSet.add(a);
    }
  }
  const validFinal = Array.from(validSet).sort();

  await fs.writeFile(
    path.join(OUT_DIR, "valid-words.json"),
    JSON.stringify(validFinal),
    "utf8",
  );
  await fs.writeFile(
    path.join(OUT_DIR, "answers.json"),
    JSON.stringify(answers),
    "utf8",
  );

  console.log(`✓ wrote ${validFinal.length} valid guesses and ${answers.length} answers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
