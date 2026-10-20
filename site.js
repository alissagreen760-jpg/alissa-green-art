// Shared header, footer and shopping bag for every page.
// ── Edit your links here ─────────────────────────────────────────
const LINKS = {
  email: "alissagreen760@gmail.com",
  instagram: "https://www.instagram.com/alissa.green.art/",
  pinterest: "", // paste your Pinterest profile link to show the icon
  tiktok: "",    // paste your TikTok profile link to show the icon
  vimeo: "https://vimeo.com/@agreenedu",
  customMoments: "custom.html",
  multimedia: "multimedia.html",
};
// ─────────────────────────────────────────────────────────────────

const ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12.4 5.5c-3.6 0-5.4 2.5-5.4 4.7 0 1.3.5 2.4 1.6 2.9.2.1.3 0 .4-.2l.2-.7c0-.2 0-.3-.2-.5-.3-.4-.5-.9-.5-1.6 0-2.1 1.6-3.9 4.1-3.9 2.2 0 3.5 1.4 3.5 3.2 0 2.4-1.1 4.5-2.7 4.5-.9 0-1.5-.7-1.3-1.6.2-1 .7-2.2.7-2.9 0-.7-.4-1.2-1.1-1.2-.9 0-1.6.9-1.6 2.2 0 .8.3 1.3.3 1.3l-1.1 4.6c-.3 1.4 0 3.1 0 3.2 0 .1.1.1.2 0 .1-.1 1-1.2 1.3-2.4l.5-2c.3.5 1 .9 1.8.9 2.4 0 4-2.2 4-5.1 0-2.2-1.9-4.3-4.7-4.3z" fill="#f3f0e9"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.5 1.4V6.7a4.5 4.5 0 0 1-4.5-4.5z"/></svg>',
  vimeo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 7.4c-.1 2-1.5 4.6-4.1 7.9-2.7 3.5-5 5.2-6.9 5.2-1.2 0-2.1-1.1-2.9-3.2L6.5 11.6c-.6-2.1-1.2-3.2-1.9-3.2-.1 0-.7.3-1.6 1L2 8.1l2.9-2.6c1.3-1.1 2.3-1.7 2.9-1.8 1.5-.1 2.5.9 2.8 3.1.4 2.4.6 3.9.8 4.4.4 2 .9 3 1.4 3 .4 0 1.1-.6 1.9-1.9.9-1.3 1.3-2.3 1.4-3 .1-1.1-.3-1.7-1.4-1.7-.5 0-1 .1-1.5.3 1-3.3 2.9-4.9 5.7-4.8 2.1.1 3 1.4 2.9 3.9z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="5" width="20" height="14" rx="1"/><path d="M2 5l10 8 10-8M2 19l7.5-7.5M22 19l-7.5-7.5"/></svg>',
};

const page = document.body.dataset.page;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (cents) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0 });

function socialLinks() {
  return ["instagram", "pinterest", "tiktok", "vimeo", "email"]
    .filter((k) => LINKS[k])
    .map((k) => {
      const href = k === "email" ? `mailto:${LINKS.email}` : LINKS[k];
      const label = { instagram: "Instagram", pinterest: "Pinterest", tiktok: "TikTok", vimeo: "Vimeo", email: "Email Alissa" }[k];
      return `<a href="${esc(href)}" ${k === "email" ? "" : 'target="_blank" rel="noopener"'} aria-label="${label}">${ICONS[k]}</a>`;
    })
    .join("");
}

const MM = page === "multimedia";
const CM = page === "custom";
const bagBtn = (label) => (page === "gallery" || MM)
  ? `<button class="btn cart-btn" id="open-bag" type="button">${label} <span class="cart-count" id="cart-count"></span></button>`
  : `<a class="btn cart-btn" href="gallery.html">Shop <span class="arrow" aria-hidden="true"></span><span class="cart-count" id="cart-count"></span></a>`;
const customHref = LINKS.customMoments || `mailto:${LINKS.email}?subject=Custom%20Moments`;

document.getElementById("site-header").innerHTML = `
  <nav class="switcher" aria-label="Alissa Green sites">
    <a href="index.html" ${MM || CM ? "" : 'aria-current="page"'}>Alissa Green Fine Artist</a>
    <a href="${esc(customHref)}" ${CM ? 'aria-current="page"' : ""}>Alissa Green Custom Moments</a>
    <a href="${esc(LINKS.multimedia)}" ${MM ? 'aria-current="page"' : ""}>Alissa Green Multimedia Art</a>
  </nav>
  ${CM ? `
  <header class="cm-head">
    <a href="custom.html" aria-label="Alissa Green Custom Moments, home"><img src="images/cm/logo.png" alt="Alissa Green Custom Moments"></a>
    <nav class="cm-nav" aria-label="Main">
      <a href="#stories">Ideas</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#request">Request a quote</a>
    </nav>
  </header>` : MM ? `
  <header class="mm-head">
    <img class="mm-splash" src="images/mm/splash.png" alt="" aria-hidden="true">
    <a class="mm-logo-link" href="multimedia.html" aria-label="Alissa Green Multimedia Art, home"><img src="images/mm/logo.png" alt="Alissa Green Multimedia Art"></a>
    <nav class="mm-nav" aria-label="Main">
      <a href="#shop-top" data-jump="all">Shop</a>
      <a href="about.html">About</a>
      <a href="${esc(customHref)}">Custom</a>
      <a href="mailto:${LINKS.email}">Contact</a>
      ${bagBtn("Bag")}
    </nav>
  </header>` : `
  <div class="banner" role="img" aria-label="Colorful glossy paint blobs"></div>
  <header class="nav">
    <div class="side">
      <a class="link" href="gallery.html">The Art</a>
      <a class="link" href="about.html">About</a>
    </div>
    <a class="logo" href="index.html" aria-label="Alissa Green Fine Artist, home"><img src="images/logo.png" alt="Alissa Green Fine Artist"></a>
    <div class="side right">
      <a class="link" href="mailto:${LINKS.email}">Contact</a>
      ${bagBtn("Bag")}
    </div>
  </header>`}`;

document.getElementById("site-footer").innerHTML = `
  <footer class="footer">
    ${CM ? "" : '<div class="footer-strip" aria-hidden="true"></div>'}
    <div class="footer-inner">
      <a class="logo" href="${CM ? "custom.html" : MM ? "multimedia.html" : "index.html"}"><img src="${CM ? "images/cm/logo.png" : MM ? "images/mm/logo.png" : "images/logo.png"}" alt="${CM ? "Alissa Green Custom Moments" : MM ? "Alissa Green Multimedia Art" : "Alissa Green Fine Artist"}"></a>
      <div class="footer-links">
        <nav aria-label="Footer">
          <a href="gallery.html">The Art</a><a href="${esc(LINKS.multimedia)}">Multimedia</a><a href="${esc(customHref)}">Custom</a><a href="about.html">About</a><a href="mailto:${LINKS.email}">Contact</a><a href="gallery.html">Shop</a>
        </nav>
        <div class="socials">${socialLinks()}</div>
      </div>
      <div class="thanks">Thanks for<br>being here. ♡</div>
    </div>
    <p class="rule-title tagline">Art makes life a little brighter</p>
    <p class="legal">© ${new Date().getFullYear()} Alissa Green · Every original is a one-of-a-kind piece, handmade and shipped by the artist.</p>
  </footer>`;

// ── Shopping bag (shared, saved in this browser) ─────────────────
const Bag = {
  key: "ag-bag",
  read() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; } },
  write(items) { try { localStorage.setItem(this.key, JSON.stringify(items)); } catch {} Bag.badge(); document.dispatchEvent(new Event("bag:change")); },
  add(id, qty = 1, multi = false) {
    const items = this.read();
    const hit = items.find((x) => x.id === id);
    if (hit) { if (multi) hit.qty = Math.min(20, hit.qty + qty); } else items.push({ id, qty });
    this.write(items);
  },
  setQty(id, qty) { this.write(this.read().map((x) => (x.id === id ? { ...x, qty } : x))); },
  remove(id) { this.write(this.read().filter((x) => x.id !== id)); },
  clear() { this.write([]); },
  badge() { const n = this.read().reduce((s, x) => s + x.qty, 0); const el = document.getElementById("cart-count"); if (el) el.textContent = n || ""; },
};
Bag.badge();
window.Site = { Bag, money, esc, LINKS };
