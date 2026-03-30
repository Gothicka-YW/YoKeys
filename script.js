(function () {
  const KEY_ID = "yoworldHomeLinkMaker.homeId";
  const KEY_REMEMBER = "yoworldHomeLinkMaker.remember";
  const CANONICAL_BASE = "https://yoworld.com/?d=h";

  const homeInput = document.getElementById("home-input");
  const rememberInput = document.getElementById("remember");
  const statusEl = document.getElementById("status");

  const outLink = document.getElementById("out-link");

  const btnNormalize = document.getElementById("btn-normalize");
  const btnClear = document.getElementById("btn-clear");
  const btnCopyLink = document.getElementById("copy-link");

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.classList.remove("ok", "bad");
    if (type) statusEl.classList.add(type);
  }

  function clearOutputs() {
    outLink.value = "";
  }

  function extractHomeId(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;

    if (/^\d+$/.test(raw)) return raw;

    // Parse URL-like input and extract digits immediately after leading "h" in d=...
    try {
      const parsed = new URL(raw);
      const dValue = parsed.searchParams.get("d");
      if (dValue) {
        const fromParam = dValue.match(/^h(\d+)/i);
        if (fromParam && fromParam[1]) return fromParam[1];
      }
    } catch (err) {
      // Not a full URL. Continue with pattern fallback.
    }

    // Fallback for pasted fragments like d=h123456 or ...?d=h123456
    const queryMatch = raw.match(/[?&]d=h(\d+)/i) || raw.match(/d=h(\d+)/i);
    if (queryMatch && queryMatch[1]) return queryMatch[1];

    // Final fallback: pull digits immediately after "h" anywhere in the input.
    const hMatch = raw.match(/h(\d+)/i);
    return hMatch ? hMatch[1] : null;
  }

  function buildOutputs() {
    const homeId = extractHomeId(homeInput.value);
    if (!homeId) {
      clearOutputs();
      setStatus("Please enter a valid Home ID or YoWorld home URL.", "bad");
      return;
    }

    const canonical = CANONICAL_BASE + homeId;

    outLink.value = canonical;

    if (rememberInput.checked) {
      localStorage.setItem(KEY_ID, homeId);
    }

    setStatus("Link normalized to the new format.", "ok");
  }

  async function copyText(value, successMessage) {
    if (!value) {
      setStatus("Nothing to copy yet.", "bad");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setStatus(successMessage, "ok");
    } catch (err) {
      setStatus("Clipboard blocked. You can select and copy manually.", "bad");
    }
  }

  function loadRemembered() {
    const remember = localStorage.getItem(KEY_REMEMBER) === "1";
    rememberInput.checked = remember;

    if (remember) {
      const savedId = localStorage.getItem(KEY_ID);
      if (savedId) {
        homeInput.value = savedId;
        buildOutputs();
      }
    }
  }

  rememberInput.addEventListener("change", function () {
    if (rememberInput.checked) {
      localStorage.setItem(KEY_REMEMBER, "1");
      const id = extractHomeId(homeInput.value);
      if (id) localStorage.setItem(KEY_ID, id);
    } else {
      localStorage.removeItem(KEY_REMEMBER);
      localStorage.removeItem(KEY_ID);
    }
  });

  btnNormalize.addEventListener("click", buildOutputs);
  homeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") buildOutputs();
  });

  btnCopyLink.addEventListener("click", function () {
    copyText(outLink.value, "Canonical link copied.");
  });

  btnClear.addEventListener("click", function () {
    homeInput.value = "";
    clearOutputs();
    setStatus("Cleared.", "ok");
    if (!rememberInput.checked) {
      localStorage.removeItem(KEY_ID);
    }
    homeInput.focus();
  });

  loadRemembered();
})();