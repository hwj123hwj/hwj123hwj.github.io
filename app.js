const statusLabels = {
  "release-candidate": "候选已验证",
  integrated: "已接入",
  verified: "已验证",
  active: "进行中",
  planned: "计划中",
};

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderProjects(projects) {
  const grid = document.querySelector("#project-grid");
  grid.replaceChildren();

  projects.forEach((project, index) => {
    const card = makeElement("article", "project-card");
    card.append(makeElement("span", "project-number", String(index + 1).padStart(2, "0")));

    const heading = makeElement("h3");
    if (project.repository_url) {
      const link = makeElement("a", null, project.name);
      link.href = project.repository_url;
      link.setAttribute("aria-label", `${project.name} GitHub 仓库`);
      heading.append(link);
    } else {
      heading.textContent = project.name;
    }
    card.append(heading, makeElement("p", null, project.role));

    const meta = makeElement("div", "project-meta");
    meta.append(makeElement("span", "dot"));
    meta.append(
      document.createTextNode(
        `${statusLabels[project.status] || project.status} · ${project.visibility === "public" ? "Open source" : "Internal"}`,
      ),
    );
    card.append(meta);
    grid.append(card);
  });
}

function renderPullRequests(pullRequests) {
  const list = document.querySelector("#pr-list");
  list.replaceChildren();
  pullRequests.forEach((pullRequest) => {
    const item = makeElement("li");
    const link = makeElement(
      "a",
      null,
      `${pullRequest.repository} · PR #${pullRequest.number}`,
    );
    link.href = pullRequest.url;
    item.append(link);
    list.append(item);
  });
}

async function loadStatus() {
  const response = await fetch("data/status.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`status request failed: ${response.status}`);
  const status = await response.json();
  const initiative = status.initiative;
  const percent = Math.round((initiative.acceptance.passed / initiative.acceptance.total) * 100);

  document.querySelector("#hero-status").textContent =
    statusLabels[initiative.status] || initiative.status;
  document.querySelector("#hero-summary").textContent = initiative.summary;
  document.querySelector("#initiative-summary").textContent = initiative.summary;
  document.querySelector("#progress-label").textContent =
    `${initiative.acceptance.passed} / ${initiative.acceptance.total}`;
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  document.querySelector("#verified-at").textContent = initiative.last_verified;
  document.querySelector("#verified-at").dateTime = initiative.last_verified;
  document.querySelector("#generated-at").textContent = status.generated_at;
  document.querySelector("#generated-at").dateTime = status.generated_at;
  document.querySelector("#project-count").textContent = status.projects.length;
  document.querySelector("#acceptance-count").textContent = `${percent}%`;

  renderProjects(status.projects);
  renderPullRequests(initiative.public_pull_requests);
}

loadStatus().catch((error) => {
  console.error(error);
  document.querySelector("#hero-status").textContent = "状态暂不可用";
  document.querySelector("#hero-summary").textContent = "公开状态文件加载失败，请稍后刷新。";
  document.querySelector("#project-grid").replaceChildren(
    makeElement("p", "loading", "项目状态暂时无法载入。"),
  );
  document.querySelector("#pr-list").replaceChildren(
    makeElement("li", "loading", "发布门禁暂时无法载入。"),
  );
});
