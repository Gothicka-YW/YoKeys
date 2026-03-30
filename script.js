(function () {
  const KEY_ID = "yoworldHomeLinkMaker.homeId";
  const KEY_REMEMBER = "yoworldHomeLinkMaker.remember";
  const KEY_SAVED_KEYS = "yoworldHomeLinkMaker.savedKeys";
  const CANONICAL_BASE = "https://yoworld.com/?d=h";

  const homeInput = document.getElementById("home-input");
  const rememberInput = document.getElementById("remember");
  const statusEl = document.getElementById("status");

  const outLink = document.getElementById("out-link");
  const keyNameInput = document.getElementById("key-name");
  const savedListEl = document.getElementById("saved-list");

  const btnNormalize = document.getElementById("btn-normalize");
  const btnClear = document.getElementById("btn-clear");
  const btnCopyLink = document.getElementById("copy-link");
  const btnSaveKey = document.getElementById("btn-save-key");
  const btnClearSaved = document.getElementById("btn-clear-saved");

  function loadSavedKeys() {
    try {
      const raw = localStorage.getItem(KEY_SAVED_KEYS);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function persistSavedKeys(keys) {
    localStorage.setItem(KEY_SAVED_KEYS, JSON.stringify(keys));
  }

  function renderSavedKeys() {
    const keys = loadSavedKeys();
    savedListEl.innerHTML = "";

    if (!keys.length) {
      const empty = document.createElement("li");
      empty.className = "saved-empty";
      empty.textContent = "No saved keys yet.";
      savedListEl.appendChild(empty);
      return;
    }

    keys.forEach(function (entry) {
      const item = document.createElement("li");
      item.className = "saved-item";

      const nameEl = document.createElement("p");
      nameEl.className = "saved-item-name";
      nameEl.textContent = entry.name;
      item.appendChild(nameEl);

      const linkEl = document.createElement("p");
      linkEl.className = "saved-item-link";
      linkEl.textContent = entry.url;
      item.appendChild(linkEl);

      const actions = document.createElement("div");
      actions.className = "saved-item-actions";

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.className = "btn btn-small";
      loadBtn.textContent = "Load";
      loadBtn.addEventListener("click", function () {
        homeInput.value = entry.url;
        outLink.value = entry.url;
        keyNameInput.value = entry.name;
        setStatus("Loaded saved key.", "ok");
      });

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-small";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", function () {
        copyText(entry.url, "Saved key copied.");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        const remaining = loadSavedKeys().filter(function (k) {
          return k.id !== entry.id;
        });
        persistSavedKeys(remaining);
        renderSavedKeys();
        setStatus("Saved key deleted.", "ok");
      });

      actions.appendChild(loadBtn);
      actions.appendChild(copyBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(actions);

      savedListEl.appendChild(item);
    });
  }

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

    // Support links like d=APLiving-187985808 by taking digits after the hyphen.
    const apLivingMatch = raw.match(/[?&]d=APLiving-(\d+)/i) || raw.match(/d=APLiving-(\d+)/i);
    if (apLivingMatch && apLivingMatch[1]) return apLivingMatch[1];

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

    renderSavedKeys();
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

  btnSaveKey.addEventListener("click", function () {
    const normalized = (outLink.value || "").trim();
    const name = (keyNameInput.value || "").trim();

    if (!normalized) {
      setStatus("Normalize a link first before saving.", "bad");
      return;
    }
    if (!name) {
      setStatus("Please enter a name for this key.", "bad");
      return;
    }

    const keys = loadSavedKeys();
    const duplicateName = keys.some(function (entry) {
      return entry.name.toLowerCase() === name.toLowerCase();
    });
    if (duplicateName) {
      setStatus("A saved key with that name already exists.", "bad");
      return;
    }

    keys.unshift({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: name,
      url: normalized,
      createdAt: new Date().toISOString()
    });

    persistSavedKeys(keys);
    renderSavedKeys();
    setStatus("Saved key added.", "ok");
    keyNameInput.value = "";
  });

  btnClearSaved.addEventListener("click", function () {
    const keys = loadSavedKeys();
    if (!keys.length) {
      setStatus("No saved keys to clear.", "bad");
      return;
    }

    localStorage.removeItem(KEY_SAVED_KEYS);
    renderSavedKeys();
    setStatus("All saved keys cleared.", "ok");
  });

  btnClear.addEventListener("click", function () {
    homeInput.value = "";
    keyNameInput.value = "";
    clearOutputs();
    setStatus("Cleared.", "ok");
    if (!rememberInput.checked) {
      localStorage.removeItem(KEY_ID);
    }
    homeInput.focus();
  });

  loadRemembered();
})();