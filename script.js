const container = document.getElementById("story-container");
const chapterNav = document.getElementById("chapter-nav");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function groupByChapter(rows) {
  const chapterMap = new Map();

  rows.forEach((row) => {
    const rawChapter = row.chapter !== undefined && row.chapter !== null
      ? String(row.chapter).trim()
      : "";

    if (!rawChapter) {
      return;
    }

    if (!chapterMap.has(rawChapter)) {
      chapterMap.set(rawChapter, []);
    }
    chapterMap.get(rawChapter).push(row);
  });

  return Array.from(chapterMap.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([chapter, items]) => ({
      chapter,
      items
    }));
}
function createChapterIntro(intro) {
  const section = document.createElement("section");
  const hasImage = hasValue(intro.image);

  section.className = "chapter-intro reveal" + (hasImage ? "" : " no-image");
  section.style.setProperty("--accent", intro.accent || "#7c5cff");

  section.innerHTML = `
    ${hasImage ? `
      <div class="chapter-image-wrap stagger from-left delay-1">
        <img class="chapter-image" src="${escapeHtml(intro.image)}" alt="${escapeHtml(intro.title || 'chapter image')}">
      </div>
    ` : ""}
    <div class="chapter-text-wrap">
      <div class="chapter-accent-line stagger from-up delay-1"></div>
      <div class="chapter-label stagger from-up delay-1">Chapter Intro</div>
      <div class="chapter-section-title stagger from-up delay-2">${escapeHtml(intro.section_title || `第${intro.chapter}章`)}</div>
      <h2 class="chapter-title stagger from-up delay-3">${escapeHtml(intro.title || "")}</h2>
      <p class="chapter-text stagger from-up delay-4">${escapeHtml(intro.text || "")}</p>
    </div>
  `;

  return section;
}

function createStoryItem(item, index) {
  const hasImage = hasValue(item.image);
  const section = document.createElement("section");

  let className = "story-section reveal";
  if (hasImage && index % 2 !== 0) className += " reverse";
  if (!hasImage) className += " text-only";

  section.className = className;
  section.style.setProperty("--accent", item.accent || "#7c5cff");

  if (hasImage) {
    section.innerHTML = `
      <div class="story-image-wrap stagger ${index % 2 !== 0 ? "from-right" : "from-left"} delay-1">
        <img class="story-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || item.category || 'story')}">
      </div>
      <div class="story-text-wrap">
        <div class="story-category stagger from-up delay-2">${escapeHtml(item.category || "story")}</div>
        <p class="story-text stagger from-up delay-3">${escapeHtml(item.text || "")}</p>
      </div>
    `;
  } else {
    section.innerHTML = `
      <div class="story-text-wrap">
        <div class="story-category stagger from-up delay-1">${escapeHtml(item.category || "story")}</div>
        <p class="story-text stagger from-up delay-2">${escapeHtml(item.text || "")}</p>
      </div>
    `;
  }

  return section;
}

function createChapterBlock(chapterData) {
  const block = document.createElement("section");
  block.className = "chapter-block";
  block.id = `chapter-${chapterData.chapter}`;

  const intro = chapterData.items.find(
    (item) => String(item.type).trim().toLowerCase() === "intro"
  );
  const storyItems = chapterData.items.filter(
    (item) => String(item.type).trim().toLowerCase() === "item"
  );

  if (intro) {
    block.appendChild(createChapterIntro(intro));
  }

  const itemsWrap = document.createElement("div");
  itemsWrap.className = "chapter-items";

  storyItems.forEach((item, index) => {
    itemsWrap.appendChild(createStoryItem(item, index));
  });

  block.appendChild(itemsWrap);
  return block;
}

function renderChapterNav(chapters) {
  chapterNav.innerHTML = `
    <a class="side-nav-link" href="#top">
      <small>TOP</small>
      はじめに
    </a>
  `;

  chapters.forEach((chapterData) => {
    const intro = chapterData.items.find(
      (item) => String(item.type).trim().toLowerCase() === "intro"
    );
    const sectionTitle = intro?.section_title || `第${chapterData.chapter}章`;
    const title = intro?.title || "章タイトル";

    const link = document.createElement("a");
    link.className = "side-nav-link";
    link.href = `#chapter-${chapterData.chapter}`;
    link.innerHTML = `
      <small>${escapeHtml(sectionTitle)}</small>
      ${escapeHtml(title)}
    `;
    chapterNav.appendChild(link);
  });
}

function initRevealObserver() {
  const targets = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, {
    threshold: 0.16
  });

  targets.forEach((target) => observer.observe(target));
}

function initActiveNavObserver() {
  const blocks = document.querySelectorAll(".chapter-block");
  const navLinks = document.querySelectorAll('.side-nav-link[href^="#chapter-"]');

  if (!blocks.length || !navLinks.length) return;

  const linkMap = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    linkMap.set(href.slice(1), link);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const activeLink = linkMap.get(entry.target.id);
        if (activeLink) activeLink.classList.add("active");
      }
    });
  }, {
    rootMargin: "-25% 0px -55% 0px",
    threshold: 0
  });

  blocks.forEach((block) => observer.observe(block));
}

function renderChapters(data) {
  container.innerHTML = "";

  const chapters = groupByChapter(data);
  renderChapterNav(chapters);

  chapters.forEach((chapterData) => {
    container.appendChild(createChapterBlock(chapterData));
  });

  initRevealObserver();
  initActiveNavObserver();
}

Papa.parse("content.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    if (!results.data || !results.data.length) {
      container.innerHTML = '<div class="error">CSVデータが見つからないか、内容が空です。</div>';
      return;
    }
    renderChapters(results.data);
  },
  error: function(err) {
    console.error(err);
    container.innerHTML = '<div class="error">CSVの読み込みに失敗しました。</div>';
  }
});