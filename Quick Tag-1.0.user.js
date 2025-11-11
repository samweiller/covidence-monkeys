// ==UserScript==
// @name         Quick Tag
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically select study, open tag dialog, select tag, and apply
// @author       You
// @match        *://*.covidence.org/*
// @match        *://covidence.org/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Configuration - add as many tags as you want here
  const TAGS = [
    "Intro Fodder",
    "Of Interest",
      "Protocol Paper",
    "Review",
    "Researcher-Focused",
    "Survey Study",
    // Add more tags here as needed
  ];

  // Utility function to wait for an element to appear
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: ${selector}`));
      }, timeout);
    });
  }

  // Utility function to wait a specific time
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Main function to handle the auto-tag process
  async function autoTagStudy(voteOptionsDiv, tagName) {
    try {
      // Step 1: Find the parent <tr> and select the row checkbox
      const studyRow = voteOptionsDiv.closest("tr");
      if (!studyRow) {
        console.error("Could not find parent <tr> element");
        return;
      }

      const rowCheckbox = studyRow.querySelector("input.row-select");
      if (!rowCheckbox) {
        console.error("Could not find row-select checkbox");
        return;
      }

      // Check the row checkbox
      if (!rowCheckbox.checked) {
        rowCheckbox.click();
      }
      console.log("Row checkbox selected");

      // Small delay to ensure selection is registered
      await sleep(100);

      // Step 2: Click the Tag button
      const tagButton = document.querySelector('button[data-pendo-key="tags"]');
      if (!tagButton) {
        console.error("Could not find Tag button");
        return;
      }

      tagButton.click();
      console.log("Tag button clicked");

      // Step 3: Wait for the tag dialog to appear and find the tag checkbox
      await sleep(500); // Give the dialog time to appear

      const tagCheckbox = Array.from(
        document.querySelectorAll('input[type="checkbox"]')
      ).find((cb) => cb.name === tagName);

      if (!tagCheckbox) {
        console.error(`Could not find checkbox with name: ${tagName}`);
        return;
      }

      // Check the tag checkbox
      if (!tagCheckbox.checked) {
        tagCheckbox.click();
      }
      console.log(`Tag "${tagName}" selected`);

      // Small delay before clicking apply
      await sleep(100);

      // Step 4: Click the Apply button
      const applyButton = document.querySelector(
        'button[data-pendo-key="apply-tags"]'
      );
      if (!applyButton) {
        console.error("Could not find Apply button");
        return;
      }

      applyButton.click();
      console.log("Apply button clicked - tagging complete!");

              // Special case: If tagging as "Review", also click the "No" button
      if (tagName === "Review") {
        await sleep(500); // Wait for tag dialog to close

        const noButton = voteOptionsDiv.querySelector('button[value="No"]');
        if (noButton) {
          noButton.click();
          console.log('"No" button clicked after Review tag');
        } else {
          console.error('Could not find "No" button');
        }
      }

    } catch (error) {
      console.error("Error in autoTagStudy:", error);
    }
  }

  // Add toggle buttons near study-tags divs
  function addToggleButtons() {
    const studyTagsDivs = document.querySelectorAll(".study-tags");

    studyTagsDivs.forEach((studyTagsDiv) => {
      // Check if toggle button already exists
      if (
        studyTagsDiv.previousElementSibling?.classList.contains(
          "toggle-tags-btn"
        )
      ) {
        return;
      }

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "button inverted small toggle-tags-btn";
      toggleBtn.textContent = "Show Tags";
      toggleBtn.style.fontSize = "0.85em";
      toggleBtn.style.padding = "4px 8px";
      toggleBtn.style.marginTop = "4px";
      toggleBtn.style.marginBottom = "4px";
      toggleBtn.style.backgroundColor = "#5cb85c";
      toggleBtn.style.color = "white";
      toggleBtn.setAttribute("translate", "no");

      toggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const isVisible = studyTagsDiv.classList.contains("visible");

        if (isVisible) {
          studyTagsDiv.classList.remove("visible");
          toggleBtn.textContent = "Show Tags";
          toggleBtn.style.backgroundColor = "#5cb85c";
        } else {
          studyTagsDiv.classList.add("visible");
          toggleBtn.textContent = "Hide Tags";
          toggleBtn.style.backgroundColor = "#d9534f";
        }
      });

      // Insert the toggle button right before the study-tags div
      studyTagsDiv.parentNode.insertBefore(toggleBtn, studyTagsDiv);
    });
  }

  // Add custom buttons to all vote-options divs
  function addAutoTagButtons() {
    const voteOptionsDivs = document.querySelectorAll(".vote-options");

    voteOptionsDivs.forEach((div) => {
      // Check if buttons container already exists
      if (div.querySelector(".auto-tag-container")) {
        return;
      }

      // Create a container for the auto-tag buttons
      const container = document.createElement("div");
      container.className = "auto-tag-container";
      container.style.marginTop = "2px";
      container.style.display = "flex";
      container.style.gap = "2px";
      container.style.flexDirection = "column";

      // Add header text
      const header = document.createElement("div");
      header.textContent = "Quick Tag:";
      header.style.fontWeight = "bold";
      header.style.fontSize = "1em";
      header.style.marginBottom = "2px";
      header.style.marginTop = "24px";
      header.style.color = "#333";
      container.appendChild(header);

      // Create a button for each tag
      TAGS.forEach((tagName) => {
        const autoTagBtn = document.createElement("button");
        autoTagBtn.className = "button vote-option primary auto-tag-btn";
        autoTagBtn.textContent = tagName;
        autoTagBtn.style.width = "100%";
        autoTagBtn.style.fontSize = "0.9em";
        autoTagBtn.style.padding = "1px 2px";
        autoTagBtn.style.marginTop = "2px";
        autoTagBtn.setAttribute("translate", "no");
        autoTagBtn.setAttribute("data-tag", tagName);

        // Add click handler to all buttons
        autoTagBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          autoTagStudy(div, tagName);
        });

        container.appendChild(autoTagBtn);
      });

      // Add container to the vote-options div
      div.appendChild(container);
    });

    console.log(
      `Added Auto Tag buttons to ${voteOptionsDivs.length} study items`
    );
  }

  // Hide study-tags divs initially with CSS
  function hideStudyTags() {
    const style = document.createElement("style");
    style.id = "tag-visibility-style";
    style.textContent = `
      .study-tags {
        display: none !important;
      }
      .study-tags.visible {
        display: block !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize the script
  function init() {
    // Hide existing tag displays
    hideStudyTags();

    // Add buttons on initial load
    addToggleButtons();
    addAutoTagButtons();

    // Watch for dynamically added content
    const observer = new MutationObserver((mutations) => {
      addToggleButtons();
      addAutoTagButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("Auto Tag Studies script initialized");
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
