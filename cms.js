/* ============================================================
 * cms.js — live-site hydration for the Editable-Website CMS
 *
 * Drop this on any static page, anywhere it's hosted. No build
 * step, no dependency, no supabase-js — it's one REST call.
 *
 *   <script src="cms.js"
 *           data-supabase-url="https://xxxxx.supabase.co"
 *           data-anon-key="eyJ..."
 *           data-site="front-uni-chretien"></script>
 *
 * Markup contract (the SAME markers generate.js bakes):
 *
 *   data-cms="section.field"     -> fills this element's text
 *   data-cms-multiline           -> newlines become <br>
 *   data-cms-attr="href"         -> writes the attribute instead of text
 *   data-cms-bg                  -> writes style.backgroundImage
 *   <img data-cms="...">         -> writes src automatically
 *
 *   data-cms-repeat="section.field"   -> container for a repeater
 *     data-cms-item                   -> the row template inside it
 *       data-cms-field="key"          -> a field of one item
 *
 * Whatever is already in the HTML is the fallback: if the fetch
 * fails or a field is empty, the hand-written copy stays put.
 * ============================================================ */
(function () {
  'use strict';

  var tag = document.currentScript ||
            document.querySelector('script[data-site]');
  var cfg = window.CMS_CONFIG || {};
  var BASE = (cfg.url  || (tag && tag.dataset.supabaseUrl) || '').replace(/\/+$/, '');
  var KEY  =  cfg.key  || (tag && tag.dataset.anonKey)  || '';
  var SITE =  cfg.site || (tag && tag.dataset.site)     || '';

  var PREVIEW = /[?&#]cms_preview\b/.test(location.search + location.hash);

  // ---------- value lookup ----------
  // content = { hero: {headline: "..."}, piliers: {items: [...]} }
  var content = {};

  function valueAt(path) {
    var dot = path.indexOf('.');
    if (dot < 0) return undefined;
    var sec = content[path.slice(0, dot)];
    return sec ? sec[path.slice(dot + 1)] : undefined;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- writing one value onto one element ----------
  function applyValue(el, value) {
    // Empty or missing leaves the hand-written fallback alone.
    if (value === undefined || value === null || value === '') return;

    var attr = el.getAttribute('data-cms-attr');
    if (attr) {
      // data-cms-prefix="mailto:" / "tel:" etc.
      // data-cms-strip reduces the value to + and digits first, so a
      // phone shown as "+509 4674-5522" links as tel:+50946745522.
      var raw = String(value);
      if (el.hasAttribute('data-cms-strip')) raw = raw.replace(/[^+\d]/g, '');
      el.setAttribute(attr, (el.getAttribute('data-cms-prefix') || '') + raw);
      return;
    }

    if (el.hasAttribute('data-cms-bg')) {
      el.style.backgroundImage = 'url("' + String(value).replace(/"/g, '%22') + '")';
      return;
    }

    if (el.tagName === 'IMG')    { el.setAttribute('src', value); return; }
    if (el.tagName === 'SOURCE') { el.setAttribute('srcset', value); return; }

    if (el.hasAttribute('data-cms-multiline')) {
      el.innerHTML = escapeHtml(value).replace(/\r?\n/g, '<br>');
      return;
    }

    el.textContent = value;
  }

  // ---------- repeaters ----------
  function hydrateRepeater(host) {
    var items = valueAt(host.getAttribute('data-cms-repeat'));
    if (!Array.isArray(items) || !items.length) return; // keep fallback rows

    var existing = host.querySelectorAll(':scope > [data-cms-item]');
    if (!existing.length) return;

    // One template per existing row, not just the first: rows often carry
    // their own positioning classes (.p-a, .p-b ...) and cloning row 0 for
    // everything would stack them on top of each other. Extra items beyond
    // the number of templates reuse the last one.
    var templates = Array.prototype.map.call(existing, function (el) { return el.cloneNode(true); });
    var anchor = existing[0];

    items.forEach(function (item, i) {
      var row = templates[Math.min(i, templates.length - 1)].cloneNode(true);
      row.querySelectorAll('[data-cms-field]').forEach(function (el) {
        applyValue(el, item[el.getAttribute('data-cms-field')]);
      });
      host.insertBefore(row, anchor);
    });

    // Drop the original fallback rows now that real ones are in.
    Array.prototype.forEach.call(existing, function (el) { el.remove(); });
  }

  // ---------- the pass over the page ----------
  function hydrate() {
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      // Fields inside a repeater row are handled by the repeater.
      if (el.closest('[data-cms-item]')) return;
      applyValue(el, valueAt(el.getAttribute('data-cms')));
    });

    document.querySelectorAll('[data-cms-repeat]').forEach(hydrateRepeater);

    document.documentElement.setAttribute('data-cms-state',
      PREVIEW ? 'preview' : 'live');
    document.dispatchEvent(new CustomEvent('cms:hydrated', {
      detail: { content: content, preview: PREVIEW }
    }));
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  // ---------- published content ----------
  function fetchPublished() {
    if (!BASE || !KEY || !SITE) {
      console.warn('[cms] not configured — leaving the static copy in place.');
      return;
    }
    var url = BASE + '/rest/v1/public_sections' +
              '?site_slug=eq.' + encodeURIComponent(SITE) +
              '&select=section_key,content&order=position';

    fetch(url, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        rows.forEach(function (row) { content[row.section_key] = row.content || {}; });
        ready(hydrate);
      })
      .catch(function (err) {
        // The page still reads correctly — it just shows the last
        // version baked into the HTML.
        console.warn('[cms] live content unavailable:', err.message);
      });
  }

  // ---------- preview mode ----------
  // The admin panel opens this page in an iframe with ?cms_preview=1
  // and posts the unsaved draft in. No auth, no CORS, works even
  // when the panel and the site sit on different domains.
  function listenForPreview() {
    window.addEventListener('message', function (e) {
      var msg = e.data;
      if (!msg || msg.type !== 'cms-preview-content') return;
      content = msg.content || {};
      ready(hydrate);
    });

    function announce() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'cms-preview-ready' }, '*');
      }
    }
    ready(announce);

    // Opened with the flag but not inside the panel? Show live.
    setTimeout(function () {
      if (!Object.keys(content).length) fetchPublished();
    }, 1500);
  }

  if (PREVIEW) { listenForPreview(); } else { fetchPublished(); }
})();
