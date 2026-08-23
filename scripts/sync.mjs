#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const statusPath = join(root, "data/status.json");
const status = JSON.parse(readFileSync(statusPath, "utf8"));

const GITHUB_USERNAME = "hwj123hwj";
const headers = {
  "User-Agent": "hwj123hwj-status-sync",
  Accept: "application/vnd.github.v3+json",
};

if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
  headers.Authorization = `token ${process.env.GITHUB_TOKEN || process.env.GH_TOKEN}`;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${res.statusText} (${url})`);
  }
  return res.json();
}

async function sync() {
  console.log(`Fetching repositories for ${GITHUB_USERNAME}...`);
  const repos = await fetchJson(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
  );

  const repoMap = new Map();
  for (const repo of repos) {
    repoMap.set(repo.name.toLowerCase(), repo);
  }

  // Today ISO date: YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);
  status.generated_at = today;

  const existingProjectIds = new Set(status.projects.map((p) => p.id.toLowerCase()));
  let updatedCount = 0;
  let discoveredCount = 0;

  // 1. Update existing projects with live repo data
  for (const project of status.projects) {
    const key = project.id.toLowerCase();
    if (repoMap.has(key)) {
      const repo = repoMap.get(key);
      if (project.visibility === "public") {
        project.repository_url = repo.html_url;
        project.stars = repo.stargazers_count;
        project.language = repo.language || project.language || null;
        project.last_pushed_at = repo.pushed_at ? repo.pushed_at.slice(0, 10) : null;
        updatedCount++;
      }
    }
  }

  // 2. Discover new public repos (ignore portal itself and wx_key/temp forks if desired)
  const ignoredRepos = new Set(["hwj123hwj.github.io", "wx_key"]);

  for (const repo of repos) {
    const repoKey = repo.name.toLowerCase();
    if (ignoredRepos.has(repoKey)) continue;

    if (!existingProjectIds.has(repoKey)) {
      console.log(`✨ Discovered new repository: ${repo.name}`);
      status.projects.push({
        id: repo.name,
        name: repo.name,
        role: repo.description || "开源项目与实践",
        status: "active",
        visibility: "public",
        category: "portfolio",
        repository_url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language || null,
        last_pushed_at: repo.pushed_at ? repo.pushed_at.slice(0, 10) : null,
      });
      existingProjectIds.add(repoKey);
      discoveredCount++;
    }
  }

  // 3. Update public PR statuses if token is present or public API allows
  if (Array.isArray(status.initiative?.public_pull_requests)) {
    for (const pr of status.initiative.public_pull_requests) {
      try {
        const prData = await fetchJson(
          `https://api.github.com/repos/${GITHUB_USERNAME}/${pr.repository}/pulls/${pr.number}`,
        );
        if (prData.merged_at) {
          pr.state = "merged";
        } else {
          pr.state = prData.state || pr.state;
        }
      } catch (err) {
        // Fallback gracefully if rate-limited on individual PR calls
      }
    }
  }

  writeFileSync(statusPath, JSON.stringify(status, null, 2) + "\n", "utf8");
  console.log(
    `✅ Sync complete: updated ${updatedCount} existing projects, discovered ${discoveredCount} new projects.`,
  );
}

sync().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
