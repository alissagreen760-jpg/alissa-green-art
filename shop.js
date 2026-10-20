// Shared shop: product grid, piece detail popup, bag drawer and Stripe checkout.
// Each page sets window.SHOP = { field: "category" | "kind", groups: [{ id, name, chip }] } before loading this.
(() => {
  const { Bag, money, esc, LINKS } = window.Site;
  const { field, groups, emptyGroups = {} } = window.SHOP;
  const TINTS = ["#fdcc09", "#84c8c2", "#d27e8a", "#f3dcb9", "#cfd975", "#8bb1e8"];
  const $ = (s) => document.querySelector(s);
  let catalog = [], liveSold = new Set(), filter = "all";

  // Inject the popup, bag drawer and toast once.
  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="detail" aria-labelledby="d-title"></dialog>
    <div class="scrim" id="scrim"></div>
    <aside class="bag" id="bag" aria-label="Your bag" aria-hidden="true">
      <header><h2>Your bag</h2><button class="x" type="button" id="close-bag" aria-label="Close bag">×</button></header>
      <div class="bag-items" id="bag-items"></div>
      <footer id="bag-foot"></footer>
    </aside>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  const isSold = (p) => p.sold || liveSold.has(p.id);
  const tint = (p) => TINTS[[...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  const pic = (p) =>
    `<img src="${esc(p.image)}" alt="${esc(p.title)}${p.medium ? ", " + esc(p.medium) : ""}" loading="lazy"
      onerror="this.outerHTML='<div class=&quot;placeholder&quot; style=&quot;--c:${tint(p)}&quot;>${esc(esc(p.title))}</div>'">`;
  const priceText = (p) => (isSold(p) ? "Sold" : money(p.price) + (p.per ? " each" : ""));
  const shipText = (p) => (p.shipping ? money(p.shipping) : "Free!") + (p.shippingNote ? ` · ${p.shippingNote}` : "");
  const inGroup = (p, g) => p[field] === g.id;

  // ── gallery-wall ("salon") layout: natural shapes, real-size scaling, a little askew ──
  const salon = window.SHOP.layout === "salon";
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = (p, salt) => ((hash(p.id + salt) % 1000) / 1000) * 2 - 1; // −1 … 1, stable per piece
  const maxDim = (p) => { const m = (p.size || "").match(/([\d.]+)\s*[x×]\s*([\d.]+)/i); return m ? Math.max(+m[1], +m[2]) : 0; };
  const widthFor = (p, k = 1) => Math.round(Math.min(460, Math.max(150, 140 + 9 * (maxDim(p) || 7))) * k);
  const seriesKey = (t) => t.replace(/\s*\((pt\.\s*\d+|black and white|nose|mouth)\)/gi, "").replace(/\s*#\d+\s*$/, "").trim();
  const capLines = (p) => `<span class="ct">${esc(p.title)}</span>${p.medium ? `<span class="cs">${esc(p.medium)}</span>` : ""}${p.size ? `<span class="cs">${esc(p.size)}</span>` : ""}<span class="cp">${isSold(p) ? '<i class="dot" aria-hidden="true"></i>Sold' : esc(priceText(p))}</span>${p.note ? `<span class="cs">${esc(p.note)}</span>` : ""}`;
  const tilt = (p, amp = 2.4) => `--r:${(rand(p, "r") * amp).toFixed(2)}deg;--y:${Math.round(rand(p, "y") * 26)}px`;

  function salonWall(items, groupSeries) {
    const blocks = [];
    for (let i = 0; i < items.length; ) {
      const key = seriesKey(items[i].title);
      let j = i + 1;
      if (groupSeries) while (j < items.length && seriesKey(items[j].title) === key) j++;
      blocks.push(j - i >= 2 ? { series: key, items: items.slice(i, j) } : { p: items[i] });
      i = j;
    }
    let flip = false;
    return `<div class="wall">${blocks.map((b) => {
      if (b.series) {
        const ps = b.items, sold = ps.every(isSold);
        const prices = [...new Set(ps.filter((p) => !isSold(p)).map((p) => p.price))];
        const sizes = [...new Set(ps.map((p) => p.size).filter(Boolean))];
        const priceLine = sold ? '<i class="dot" aria-hidden="true"></i>Sold' : prices.length === 1 ? `${money(prices[0])} each` : `from ${money(Math.min(...prices))}`;
        const k = ps.length > 4 ? 0.62 : 0.78;
        const tiles = ps.map((p) => `
          <button class="piece hang mini${isSold(p) ? " is-sold" : ""}" type="button" data-id="${p.id}" style="--w:${widthFor(p, k)}px;${tilt(p, 3)}" aria-label="${esc(p.title)}, ${isSold(p) ? "sold" : esc(priceText(p))}">
            <span class="art">${pic(p)}</span><span class="tiny">${esc((p.title.match(/#\d+|pt\.\s*\d+/i) || [p.title])[0])} · ${isSold(p) ? "Sold" : esc(priceText(p))}</span>
          </button>`);
        const nums = ps.map((p) => (p.title.match(/#(\d+)|pt\.\s*(\d+)/i) || [])).map((m) => m[1] || m[2]).filter(Boolean);
        const label = nums.length === ps.length ? `${b.series} ${nums.length === 2 ? `#${nums[0]} & #${nums[1]}` : `#${nums[0]}–${nums[nums.length - 1]}`}` : b.series;
        const cap = `<div class="cap series-cap"><span class="ct">${esc(label)}</span><span class="cs">${ps.length} pieces${sizes.length ? " · " + esc(sizes.join("  ·  ")) : ""}</span><span class="cp">${priceLine}</span></div>`;
        const mid = Math.ceil(tiles.length / 2);
        return `<div class="series ${ps.length > 4 ? "big" : ""}">${ps.length > 4 ? cap + tiles.join("") : tiles.slice(0, mid).join("") + cap + tiles.slice(mid).join("")}</div>`;
      }
      const p = b.p;
      if (maxDim(p) >= 24) {
        flip = !flip;
        return `<button class="piece feature${flip ? "" : " flip"}${isSold(p) ? " is-sold" : ""}" type="button" data-id="${p.id}" style="${tilt(p, 1.4)}">
          <span class="art" style="--w:${widthFor(p, 1.25)}px">${pic(p)}</span><span class="cap">${capLines(p)}</span></button>`;
      }
      return `<button class="piece hang${isSold(p) ? " is-sold" : ""}" type="button" data-id="${p.id}" style="--w:${widthFor(p)}px;${tilt(p)}">
        <span class="art">${pic(p)}</span><span class="cap">${capLines(p)}</span></button>`;
    }).join("")}</div>`;
  }

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200); }

  // ── grid ──
  function renderChips() {
    const el = $("#chips"); if (!el) return;
    const count = (g) => catalog.filter((p) => (g.id === "all" ? groups.some((x) => inGroup(p, x)) : inGroup(p, g))).length;
    el.innerHTML = [{ id: "all", chip: "All" }, ...groups]
      .map((g) => `<button class="chip" type="button" data-cat="${g.id}" aria-pressed="${filter === g.id}">${esc(g.chip || g.name)}<span class="n">${count(g)}</span></button>`)
      .join("");
  }
  function renderGrid() {
    const hide = $("#hide-sold")?.checked, sort = $("#sort")?.value || "default";
    const html = groups.filter((g) => filter === "all" || filter === g.id).map((g) => {
      let items = catalog.filter((p) => inGroup(p, g) && !(hide && isSold(p)));
      if (sort === "low") items = [...items].sort((a, b) => a.price - b.price);
      if (sort === "high") items = [...items].sort((a, b) => b.price - a.price);
      if (sort === "default" && !salon) items = [...items].sort((a, b) => isSold(a) - isSold(b));
      const body = !items.length ? (emptyGroups[g.id] ? `<p class="empty">${emptyGroups[g.id]}</p>` : "")
        : salon ? salonWall(items, sort === "default")
        : `<div class="grid">${items.map((p) => `
          <button class="piece${isSold(p) ? " is-sold" : ""}" type="button" data-id="${p.id}">
            <div class="ph">${pic(p)}${isSold(p) ? '<span class="sticker">Sold</span>' : p.note ? `<span class="tag">${esc(p.note)}</span>` : ""}</div>
            <div class="meta"><div class="t">${esc(p.title)}</div><div class="d">${esc([p.medium, p.size].filter(Boolean).join(" · "))}</div><div class="p">${priceText(p)}</div></div>
          </button>`).join("")}</div>`;
      if (!body) return "";
      return `<section id="${g.id}" aria-labelledby="h-${g.id}">
        <h2 class="rule-title section-title" id="h-${g.id}">${esc(g.name)}</h2>${body}</section>`;
    }).join("");
    $("#sections").innerHTML = html || `<p class="empty">Everything here has found a home! Check back soon ♡</p>`;
  }
  function setFilter(id, scroll) {
    filter = groups.some((g) => g.id === id) ? id : "all";
    renderChips(); renderGrid();
    history.replaceState(null, "", filter === "all" ? location.pathname : "#" + filter);
    if (scroll) $("#shop-top")?.scrollIntoView({ behavior: "smooth" });
  }

  // ── detail ──
  let current = null;
  function openPiece(id) {
    const p = catalog.find((x) => x.id === id);
    if (!p) return;
    current = p;
    const sold = isSold(p), inBag = Bag.read().some((x) => x.id === id);
    const offer = `mailto:${LINKS.email}?subject=${encodeURIComponent("Offer on “" + p.title + "”")}&body=${encodeURIComponent(`Hi Alissa! I'd love to make an offer on "${p.title}" (${money(p.price)}).\n\nMy offer: $\n\n`)}`;
    const d = $("#detail");
    d.innerHTML = `<button class="x" type="button" data-close aria-label="Close">×</button>
      <div class="detail">
        <div class="img">${pic(p)}</div>
        <div class="info">
          <h2 id="d-title">${esc(p.title)}</h2>
          <div class="price">${priceText(p)}</div>
          <dl>
            ${p.medium ? `<dt>Medium</dt><dd>${esc(p.medium)}</dd>` : ""}
            ${p.size ? `<dt>Size</dt><dd>${esc(p.size)}</dd>` : ""}
            <dt>Shipping</dt><dd>${esc(shipText(p))}</dd>
            ${p.note ? `<dt>Edition</dt><dd>${esc(p.note)}</dd>` : ""}
          </dl>
          <div class="actions">
            ${sold ? `<p class="offer">This one found its home ♡</p>` : p.multi
              ? `<div style="display:flex;gap:10px;align-items:center"><div class="qty"><button type="button" data-q="-1" aria-label="Fewer">−</button><span id="dq">1</span><button type="button" data-q="1" aria-label="More">+</button></div><button class="btn" type="button" data-add style="flex:1">Add to bag</button></div>`
              : `<button class="btn" type="button" data-add ${inBag ? "disabled" : ""}>${inBag ? "In your bag ✓" : "Add to bag"}</button>`}
            ${sold || p.multi ? "" : `<a class="offer" href="${offer}">or make an offer ♡</a>`}
            <p class="fine">${p.multi ? "" : "One of one: once it's gone, it's gone. "}Buy 2+ pieces for 15% off.</p>
          </div>
        </div>
      </div>`;
    d.showModal();
  }
  $("#detail").addEventListener("click", (e) => {
    const d = $("#detail");
    if (e.target === d || e.target.closest("[data-close]")) return d.close();
    const q = e.target.closest("[data-q]");
    if (q) { const s = $("#dq"); s.textContent = Math.max(1, Math.min(20, +s.textContent + +q.dataset.q)); }
    if (e.target.closest("[data-add]") && current) {
      Bag.add(current.id, current.multi ? +$("#dq").textContent : 1, current.multi);
      d.close(); toast(`Added “${current.title}” to your bag`); openBag();
    }
  });

  // ── bag ──
  function openBag() { renderBag(); $("#bag").classList.add("open"); $("#scrim").classList.add("open"); $("#bag").setAttribute("aria-hidden", "false"); $("#close-bag").focus(); }
  function closeBag() { $("#bag").classList.remove("open"); $("#scrim").classList.remove("open"); $("#bag").setAttribute("aria-hidden", "true"); }
  function renderBag(error = "") {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    const lines = Bag.read().map((l) => ({ ...l, p: byId.get(l.id) })).filter((l) => l.p);
    if (!lines.length) {
      $("#bag-items").innerHTML = `<p class="empty">Your bag is empty.<br>Go find something weird &amp; wonderful!</p>`;
      $("#bag-foot").innerHTML = ""; return;
    }
    $("#bag-items").innerHTML = lines.map(({ p, qty }) => `
      <div class="line">
        <div class="th">${pic(p)}</div>
        <div><div class="t">${esc(p.title)}</div><div class="s">${esc(p.size || p.medium)}</div>
          ${isSold(p) ? '<div class="warn">Just sold. Please remove</div>' : ""}
          ${p.multi ? `<div class="qty" style="margin-top:6px"><button type="button" data-lq="-1" data-id="${p.id}" aria-label="Fewer">−</button><span>${qty}</span><button type="button" data-lq="1" data-id="${p.id}" aria-label="More">+</button></div>` : ""}
          <button class="rm" type="button" data-rm="${p.id}">Remove</button></div>
        <div style="font-family:var(--serif);font-weight:700;font-size:18px">${money(p.price * qty)}</div>
      </div>`).join("");
    const pieces = lines.reduce((n, l) => n + l.qty, 0);
    const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const save = pieces >= 2 ? Math.round(sub * 0.15) : 0;
    const ship = Math.max(0, ...lines.map((l) => l.p.shipping));
    const anySold = lines.some((l) => isSold(l.p));
    $("#bag-foot").innerHTML = `
      <div class="sum"><span>Subtotal</span><span>${money(sub)}</span></div>
      ${save ? `<div class="sum save"><span>Bundle 15% off</span><span>−${money(save)}</span></div>` : ""}
      <div class="sum"><span>Shipping (combined)</span><span>${ship ? money(ship) : "Free"}</span></div>
      <div class="sum total"><span>Total</span><span>${money(sub - save + ship)}</span></div>
      ${pieces < 2 ? `<p class="hint">Add one more piece to save 15% ♡</p>` : `<p class="hint">You're saving 15% ♡</p>`}
      <button class="btn" type="button" id="checkout" ${anySold ? "disabled" : ""}>Checkout</button>
      ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}`;
  }
  $("#bag").addEventListener("click", async (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) { Bag.remove(rm.dataset.rm); return renderBag(); }
    const lq = e.target.closest("[data-lq]");
    if (lq) { const l = Bag.read().find((x) => x.id === lq.dataset.id); Bag.setQty(l.id, Math.max(1, Math.min(20, l.qty + +lq.dataset.lq))); return renderBag(); }
    const co = e.target.closest("#checkout");
    if (!co) return;
    co.disabled = true; co.textContent = "Heading to checkout…";
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: Bag.read() }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) return (location.href = data.url);
      if (data.sold) { liveSold.add(data.sold); renderGrid(); }
      renderBag(data.error || "Checkout isn't available right now. Please try again in a minute.");
    } catch {
      renderBag("Couldn't reach checkout. Check your connection and try again.");
    }
  });
  $("#close-bag").addEventListener("click", closeBag);
  $("#scrim").addEventListener("click", closeBag);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#bag").classList.contains("open")) closeBag(); });

  // ── wiring ──
  $("#chips")?.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) setFilter(b.dataset.cat); });
  $("#sections").addEventListener("click", (e) => { const b = e.target.closest(".piece"); if (b) openPiece(b.dataset.id); });
  $("#hide-sold")?.addEventListener("change", renderGrid);
  $("#sort")?.addEventListener("change", renderGrid);
  document.addEventListener("click", (e) => {
    if (e.target.closest("#open-bag")) openBag();
    const jump = e.target.closest("[data-jump]");
    if (jump) { e.preventDefault(); setFilter(jump.dataset.jump, true); }
    const pc = e.target.closest("[data-piece]");
    if (pc && pc.dataset.piece) { e.preventDefault(); openPiece(pc.dataset.piece); }
  });

  window.Shop = { openPiece, setFilter, catalog: () => catalog };
  (async () => {
    try { catalog = await (await fetch("data/art.json")).json(); }
    catch { $("#sections").innerHTML = `<p class="empty">The shop couldn't load. Please refresh.</p>`; return; }
    const h = location.hash.slice(1);
    if (groups.some((g) => g.id === h)) filter = h;
    renderChips(); renderGrid(); Bag.badge();
    document.dispatchEvent(new Event("shop:ready"));
    if (h.startsWith("piece=")) openPiece(h.slice(6));
    try { const r = await fetch("/api/sold"); if (r.ok) { (await r.json()).forEach((id) => liveSold.add(id)); renderGrid(); } } catch {}
  })();
})();
