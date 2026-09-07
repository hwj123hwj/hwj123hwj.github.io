#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const status = JSON.parse(readFileSync(join(root, "data/status.json"), "utf8"));

if (status.schema_version !== 1 || !Array.isArray(status.projects)) {
  throw new Error("unsupported public status schema");
}
if (status.initiative.acceptance.passed > status.initiative.acceptance.total) {
  throw new Error("acceptance count is invalid");
}
for (const project of status.projects) {
  if (project.visibility === "private" && project.repository_url !== null) {
    throw new Error(`private URL exposed for ${project.id}`);
  }
}

const portfolio = JSON.parse(readFileSync(join(root, "data/portfolio.json"), "utf8"));
const projectsById = new Map(status.projects.map((project) => [project.id, project]));
const kinds = new Set(["tool", "learning", "fork", "other"]);
if (!Array.isArray(portfolio.featured) || new Set(portfolio.featured).size !== portfolio.featured.length) {
  throw new Error("featured projects must be a unique list");
}
for (const [id, info] of Object.entries(portfolio.projects)) {
  if (!projectsById.has(id) || !kinds.has(info.kind)) throw new Error(`invalid portfolio entry: ${id}`);
  if (info.proof_url) {
    const url = new URL(info.proof_url);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error(`invalid proof URL: ${id}`);
  }
}
for (const id of portfolio.featured) {
  const info = portfolio.projects[id];
  if (projectsById.get(id)?.visibility !== "public" || !info?.problem || !info?.contribution || !info?.proof_url || !info?.proof || !info?.label) {
    throw new Error(`featured project must have public evidence and contribution: ${id}`);
  }
}

const patterns = [
  new RegExp(("github" + "_pat_") + "[A-Za-z0-9_]+", "g"),
  new RegExp(("gh" + "p_") + "[A-Za-z0-9]{20,}", "g"),
  new RegExp(("glpat" + "-") + "[A-Za-z0-9_-]{20,}", "g"),
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi,
  /https?:\/\/[^\s/@:]+:[^\s/@]+@/g,
];
const textExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".yml"]);

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === ".git") continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scan(path);
      continue;
    }
    if (!textExtensions.has(extname(path))) continue;
    const content = readFileSync(path, "utf8");
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) throw new Error(`possible credential in ${relative(root, path)}`);
    }
  }
}

scan(root);
console.log(`validated public status for ${status.projects.length} projects`);
