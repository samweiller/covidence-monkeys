// ==UserScript==
// @name         Vote Button Colorizer
// @namespace    com.canlab.covidence
// @version      1.1
// @description  Color-code Yes/No/Maybe vote buttons on Covidence for quick visual distinction
// @match        *://*.covidence.org/*
// @match        *://covidence.org/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // CSS injected directly so site style changes won't override it
  const style = document.createElement("style");
  style.textContent = `
    button.vote-option.primary[value="Yes"] {
      background-color: #4CAF50 !important;  /* green */
      border-color: #4CAF50 !important;
      color: white !important;
    }
    button.vote-option.primary[value="No"] {
      background-color: #f44336 !important;  /* red */
      border-color: #f44336 !important;
      color: white !important;
    }
    button.vote-option.primary[value="Maybe"],
    button.vote-option.primary[value="maybe"] {
      background-color: #ffeb3b !important;  /* yellow */
      border-color: #ffeb3b !important;
      color: black !important;
    }

    /* Optional: make them a bit larger and bolder for easier clicking */
    button.vote-option.primary {
      font-weight: 600 !important;
      padding: 0.6em 1.2em !important;
      border-radius: 6px !important;
    }
  `;
  document.head.appendChild(style);

  // Handle dynamically added buttons
  const colorize = (root = document) => {
    root.querySelectorAll("button.vote-option.primary").forEach((btn) => {
      const val = btn.value?.trim().toLowerCase();
      if (["yes", "no", "maybe"].includes(val)) {
        // force re-application of style
        btn.style.transition = "background-color 0.2s";
      }
    });
  };

  colorize();

  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.("button.vote-option.primary")) colorize(node);
        node.querySelectorAll?.("button.vote-option.primary").forEach(colorize);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
