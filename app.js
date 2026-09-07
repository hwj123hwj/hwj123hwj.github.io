const statusLabels = {
  'release-candidate': '候选已验证', integrated: '已接入', verified: '已验证',
  active: '进行中', planned: '计划中',
};
const kindLabels = { tool: '工具作品', learning: '教学实践', fork: '上游改造', other: '其他探索' };
const prLabels = { merged: '已合并', open: '待合并', closed: '已关闭' };
const $ = (selector) => document.querySelector(selector);
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function link(text, href, className) {
  const node = element('a', className, text);
  node.href = href;
  return node;
}
function renderProjects(projects, selector, editorial = {}) {
  const grid = $(selector);
  grid.replaceChildren();
  if (!projects.length) {
    grid.append(element('p', 'loading', '没有匹配的项目，试试其他关键词或切回“全部”。'));
    return;
  }
  projects.forEach((project) => {
    const info = editorial[project.id] || {};
    const card = element('article', 'project-card');
    const heading = element('h3');
    heading.append(project.repository_url ? link(project.name, project.repository_url) : document.createTextNode(project.name));
    card.append(heading, element('p', null, selector === '#portfolio-grid' ? (info.contribution || project.role) : project.role));
    const meta = element('div', 'project-meta');
    if (selector === '#portfolio-grid') meta.append(element('span', 'meta-badge', kindLabels[info.kind || 'other']));
    meta.append(element('span', null, statusLabels[project.status] || project.status));
    if (project.language) meta.append(element('span', null, project.language));
    if (project.visibility === 'private') meta.append(element('span', null, '内部组件'));
    if (project.last_pushed_at) meta.append(element('span', 'meta-date', `代码更新 ${project.last_pushed_at}`));
    card.append(meta);
    grid.append(card);
  });
}
function renderFeatured(projects, portfolio) {
  const list = $('#featured-list');
  list.replaceChildren();
  portfolio.featured.forEach((id) => {
    const project = projects.find((p) => p.id === id && p.visibility === 'public');
    const info = portfolio.projects[id];
    if (!project || !info) return;
    const row = element('article', 'featured-project');
    const title = element('div', 'featured-title');
    title.append(element('span', 'feature-label', info.label), element('h3', null, project.name));
    const body = element('div', 'featured-body');
    body.append(element('p', 'feature-problem', info.problem), element('p', null, info.contribution));
    body.append(link(`${info.proof} ↗`, info.proof_url, 'feature-link'));
    row.append(title, body);
    list.append(row);
  });
}
function renderPullRequests(prs) {
  const list = $('#pr-list');
  list.replaceChildren();
  if (!prs.length) list.append(element('li', 'loading', '当前没有公开发布记录。'));
  prs.forEach((pr) => {
    const item = element('li');
    const anchor = link(`${pr.repository} · PR #${pr.number}`, pr.url);
    anchor.append(element('span', `pr-state ${pr.state || 'unknown'}`, prLabels[pr.state] || '状态待确认'));
    item.append(anchor);
    list.append(item);
  });
}
async function readJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}
async function loadStatus() {
  // Optional editorial metadata must not take down the public status view.
  const [status, portfolio] = await Promise.all([
    readJSON('data/status.json'),
    readJSON('data/portfolio.json').catch(() => null),
  ]);
  const initiative = status.initiative;
  const { passed, total } = initiative.acceptance;
  const percent = total > 0 ? Math.max(0, Math.min(100, Math.round(passed / total * 100))) : 0;
  const phase = statusLabels[initiative.status] || initiative.status;
  $('#hero-status').textContent = phase;
  $('#initiative-stage').textContent = phase;
  $('#release-title').textContent = initiative.title;
  $('#hero-summary').textContent = $('#initiative-summary').textContent = initiative.summary;
  $('#progress-label').textContent = `${passed} / ${total}`;
  $('#progress-bar').style.width = `${percent}%`;
  $('#acceptance-count').textContent = total > 0 ? `${percent}%` : '待验证';
  for (const [selector, value] of [['#verified-at', initiative.last_verified], ['#generated-at', status.generated_at]]) {
    $(selector).textContent = value || '未记录';
    if (value) $(selector).dateTime = value;
  }
  const infra = status.projects.filter((p) => p.category !== 'portfolio');
  const projects = status.projects.filter((p) => p.visibility === 'public');
  $('#project-count').textContent = infra.length;
  renderProjects(infra, '#project-grid', portfolio?.projects);
  renderPullRequests(initiative.public_pull_requests || []);
  if (portfolio) renderFeatured(projects, portfolio);
  else $('#featured-list').replaceChildren(link('代表作信息暂不可用，浏览全部源码 ↗', 'https://github.com/hwj123hwj'));
  let filter = 'all';
  const renderCatalog = () => {
    const query = $('#project-search').value.trim().toLocaleLowerCase();
    const matches = projects.filter((project) => {
      const info = portfolio?.projects[project.id] || {};
      const kind = info.kind || 'other';
      return (filter === 'all' || kind === filter) &&
        `${project.name} ${project.role} ${info.contribution || ''} ${kindLabels[kind]}`.toLocaleLowerCase().includes(query);
    });
    renderProjects(matches, '#portfolio-grid', portfolio?.projects);
    $('#catalog-count').textContent = `显示 ${matches.length} / ${projects.length} 个公开项目`;
  };
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      renderCatalog();
    });
  });
  $('#project-search').addEventListener('input', renderCatalog);
  renderCatalog();
}
loadStatus().catch((error) => {
  console.error(error);
  $('#hero-status').textContent = '状态暂不可用';
  $('#hero-summary').textContent = $('#initiative-summary').textContent = '公开状态加载失败，请刷新重试，或直接查看 GitHub 源码。';
  for (const selector of ['#featured-list', '#project-grid', '#portfolio-grid', '#pr-list']) {
    const tag = selector === '#pr-list' ? 'li' : 'p';
    const message = element(tag, 'loading');
    message.append(link('暂时无法载入，浏览 GitHub 项目 ↗', 'https://github.com/hwj123hwj'));
    $(selector).replaceChildren(message);
  }
  $('#project-search').disabled = true;
  document.querySelectorAll('[data-filter]').forEach((button) => { button.disabled = true; });
});
