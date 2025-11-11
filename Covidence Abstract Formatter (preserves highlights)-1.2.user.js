// ==UserScript==
// @name         Covidence Abstract Formatter (preserves highlights)
// @namespace    samw.tools
// @version      1.2
// @description  Reformat ABSTRACT/TLDR/SNIPPET while preserving inline markup (e.g., highlight spans)
// @match        *://*.covidence.org/*
// @match        *://covidence.org/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const MARKERS = { ABSTRACT: 'ABSTRACT', TLDR: 'TLDR', SNIPPET: 'SNIPPET' };

  function processParagraph(p) {
    if (!p || p.dataset.covAbsFormatted === '1') return;

    const rawText = p.textContent ?? '';
    if (!rawText.trim()) return;

    // Must start with ABSTRACT (allow leading whitespace)
    const m = rawText.match(/^\s*ABSTRACT/);
    if (!m) return;

    const startAfterAbstract = m[0].length;
    const idxTLDR  = rawText.indexOf(MARKERS.TLDR,  startAfterAbstract);
    if (idxTLDR === -1) return;
    const idxSNIP  = rawText.indexOf(MARKERS.SNIPPET, idxTLDR + MARKERS.TLDR.length);
    if (idxSNIP === -1) return;

    const absStart = startAfterAbstract;
    const absEnd   = idxTLDR;
    const tldrStart = idxTLDR + MARKERS.TLDR.length;
    const tldrEnd   = idxSNIP;
    const snipStart = idxSNIP + MARKERS.SNIPPET.length;
    const snipEnd   = rawText.length;

    // Map a global text offset to a DOM (TextNode, offset) within <p>
    const mapOffset = (container, targetOffset) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      let node, running = 0;
      while ((node = walker.nextNode())) {
        const len = node.nodeValue.length;
        if (running + len >= targetOffset) {
          return { node, offset: targetOffset - running };
        }
        running += len;
      }
      // If offset lands at end, return last text node end
      const last = (function () {
        const w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let n, prev = null;
        while ((n = w.nextNode())) prev = n;
        return prev;
      })();
      return last ? { node: last, offset: last.nodeValue.length } : null;
    };

    const makeFragment = (start, end) => {
      const startPos = mapOffset(p, start);
      const endPos   = mapOffset(p, end);
      if (!startPos || !endPos) return document.createDocumentFragment();
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);
      return range.cloneContents(); // preserves spans/markup
    };

    const abstractFrag = makeFragment(absStart, absEnd);
    const tldrFrag     = makeFragment(tldrStart, tldrEnd);
    const snippetFrag  = makeFragment(snipStart, snipEnd);

    // Build new content (keeping markup inside each section)
    const frag = document.createDocumentFragment();

    const addSection = (title, bodyFrag) => {
      const strong = document.createElement('strong');
      strong.textContent = title;
      frag.appendChild(strong);
      frag.appendChild(document.createElement('br'));
      if (bodyFrag && bodyFrag.childNodes.length) {
        frag.appendChild(bodyFrag);
      } else {
        // empty body still gets an empty text node so the spacing is consistent
        frag.appendChild(document.createTextNode(''));
      }
      frag.appendChild(document.createElement('br'));
      frag.appendChild(document.createElement('br'));
    };

    addSection('ABSTRACT', abstractFrag);
    addSection('TLDR', tldrFrag);       // may be empty
    addSection('SNIPPET', snippetFrag); // may be empty

    p.replaceChildren(frag);
    p.dataset.covAbsFormatted = '1';
  }

  function scan(root = document) {
    root.querySelectorAll('div.abstract > p').forEach(processParagraph);
  }

  // Initial run
  scan();

  // Handle dynamic content
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('div.abstract > p')) processParagraph(node);
        node.querySelectorAll?.('div.abstract > p').forEach(processParagraph);
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();