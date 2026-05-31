(function () {
  const KEY_ID = "yoworldHomeLinkMaker.homeId";
  const KEY_REMEMBER = "yoworldHomeLinkMaker.remember";
  const KEY_SAVED_KEYS = "yoworldHomeLinkMaker.savedKeys";
  const KEY_FRIENDS_KEYS = "yoworldHomeLinkMaker.friendsKeys";
  const CANONICAL_BASE = "https://yoworld.com/?d=";
  const CURRENT_TAB_KEY = "yoworldHomeLinkMaker.currentTab";

  const homeInput = document.getElementById("home-input");
  const rememberInput = document.getElementById("remember");
  const statusEl = document.getElementById("status");

  const outLinkAll = document.getElementById("out-link-all");
  const keyNameInput = document.getElementById("key-name");
  const savedListEl = document.getElementById("saved-list");

  const btnNormalize = document.getElementById("btn-normalize");
  const btnClear = document.getElementById("btn-clear");
  const btnCopyAllLinks = document.getElementById("copy-all-links");
  const btnSaveKey = document.getElementById("btn-save-key");
  const btnClearSaved = document.getElementById("btn-clear-saved");

  const tabMyKeys = document.getElementById("tab-my-keys");
  const tabFriendsKeys = document.getElementById("tab-friends-keys");
  const tabSettings = document.getElementById("tab-settings");
  const myKeysContent = document.getElementById("my-keys-content");
  const friendsKeysContent = document.getElementById("friends-keys-content");
  const settingsContent = document.getElementById("settings-content");
  const friendStatusEl = document.getElementById("friend-status");

  const friendNameInput = document.getElementById("friend-name");
  const friendLinkInput = document.getElementById("friend-link");
  const friendTypeSelect = document.getElementById("friend-type");
  const friendsListEl = document.getElementById("friends-list");
  const btnAddFriend = document.getElementById("btn-add-friend");
  const btnClearFriends = document.getElementById("btn-clear-friends");

  const btnExport = document.getElementById("btn-export");
  const btnImport = document.getElementById("btn-import");
  const importFile = document.getElementById("import-file");
  const importStatusEl = document.getElementById("import-status");

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

  function loadFriendsKeys() {
    try {
      const raw = localStorage.getItem(KEY_FRIENDS_KEYS);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function persistFriendsKeys(friends) {
    localStorage.setItem(KEY_FRIENDS_KEYS, JSON.stringify(friends));
  }

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.classList.remove("ok", "bad");
    if (type) statusEl.classList.add(type);
  }

  function setFriendStatus(message, type) {
    friendStatusEl.textContent = message || "";
    friendStatusEl.classList.remove("ok", "bad");
    if (type) friendStatusEl.classList.add(type);
  }

  function clearOutputs() {
    outLinkAll.value = "";
  }

  function isNumericOnlyInput(input) {
    return /^\d+$/.test(String(input || "").trim());
  }

  function parseDestinationValue(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;

    const apartmentMatch = raw.match(/^APLiving-(\d+)$/i);
    if (apartmentMatch && apartmentMatch[1]) {
      return {
        kind: "apartment",
        id: apartmentMatch[1],
        value: "APLiving-" + apartmentMatch[1]
      };
    }

    const clubMatch = raw.match(/^(c\d+)$/i);
    if (clubMatch && clubMatch[1]) {
      return {
        kind: "club",
        id: clubMatch[1].slice(1),
        value: clubMatch[1]
      };
    }

    const standardMatch = raw.match(/^h(\d+)$/i);
    if (standardMatch && standardMatch[1]) {
      return {
        kind: "standard",
        id: standardMatch[1],
        value: "h" + standardMatch[1]
      };
    }

    return null;
  }

  function buildDestinationFromDigits(digits, selectedType) {
    if (!digits) return null;

    if (selectedType === "apartment") {
      return {
        kind: "apartment",
        id: digits,
        value: "APLiving-" + digits
      };
    }

    return {
      kind: "standard",
      id: digits,
      value: "h" + digits
    };
  }

  function parseInputDestination(input, selectedType) {
    const raw = String(input || "").trim();
    if (!raw) return null;

    if (/^\d+$/.test(raw)) return buildDestinationFromDigits(raw, selectedType);

    const directValue = parseDestinationValue(raw);
    if (directValue) return directValue;

    try {
      const parsed = new URL(raw);
      const dValue = parsed.searchParams.get("d");
      if (dValue) {
        const fromParam = parseDestinationValue(dValue);
        if (fromParam) return fromParam;
      }
    } catch (err) {
      // Not a full URL. Continue with pattern fallback.
    }

    const apLivingMatch = raw.match(/[?&]d=(APLiving-\d+)/i) || raw.match(/d=(APLiving-\d+)/i);
    if (apLivingMatch && apLivingMatch[1]) return parseDestinationValue(apLivingMatch[1]);

    const clubMatch = raw.match(/[?&]d=(c\d+)/i) || raw.match(/d=(c\d+)/i);
    if (clubMatch && clubMatch[1]) return parseDestinationValue(clubMatch[1]);

    const standardMatch = raw.match(/[?&]d=(h\d+)/i) || raw.match(/d=(h\d+)/i);
    if (standardMatch && standardMatch[1]) return parseDestinationValue(standardMatch[1]);

    const fallbackApartment = raw.match(/APLiving-\d+/i);
    if (fallbackApartment) return parseDestinationValue(fallbackApartment[0]);

    const fallbackClub = raw.match(/c\d+/i);
    if (fallbackClub) return parseDestinationValue(fallbackClub[0]);

    const fallbackStandard = raw.match(/h\d+/i);
    return fallbackStandard ? parseDestinationValue(fallbackStandard[0]) : null;
  }

  function buildCanonicalUrl(destination) {
    return CANONICAL_BASE + destination.value;
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
        buildOutputs();
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
        const remaining = loadSavedKeys().filter(function (keyEntry) {
          return keyEntry.id !== entry.id;
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

  function renderFriendsKeys() {
    const friends = loadFriendsKeys();
    friendsListEl.innerHTML = "";

    if (!friends.length) {
      const empty = document.createElement("li");
      empty.className = "saved-empty";
      empty.textContent = "No saved friends yet.";
      friendsListEl.appendChild(empty);
      return;
    }

    friends.sort(function (a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    friends.forEach(function (entry) {
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

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-small";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", function () {
        copyText(entry.url, entry.name + "'s link copied.");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        const remaining = loadFriendsKeys().filter(function (friendEntry) {
          return friendEntry.id !== entry.id;
        });
        persistFriendsKeys(remaining);
        renderFriendsKeys();
        setFriendStatus("Friend removed.", "ok");
      });

      actions.appendChild(copyBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(actions);

      friendsListEl.appendChild(item);
    });
  }

  function buildOutputs() {
    const rawInput = String(homeInput.value || "").trim();
    if (!rawInput) {
      clearOutputs();
      setStatus("Please enter a valid room ID, apartment ID, or YoWorld/Facebook link.", "bad");
      return;
    }

    if (isNumericOnlyInput(rawInput)) {
      outLinkAll.value = CANONICAL_BASE + "APLiving-" + rawInput;

      if (rememberInput.checked) {
        localStorage.setItem(KEY_ID, rawInput);
      }

      setStatus("Apartment link generated from numeric ID.", "ok");
      return;
    }

    const destination = parseInputDestination(rawInput, "apartment");
    if (!destination) {
      clearOutputs();
      setStatus("Please enter a valid room ID, apartment ID, or YoWorld/Facebook link.", "bad");
      return;
    }

    outLinkAll.value = buildCanonicalUrl(destination);

    if (rememberInput.checked) {
      localStorage.setItem(KEY_ID, rawInput);
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

  function exportData() {
    const keys = loadSavedKeys();
    const friends = loadFriendsKeys();

    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      savedKeys: keys,
      friendsKeys: friends
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "YoKeys_backup_" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    importStatusEl.textContent = "Backup exported successfully.";
    importStatusEl.classList.remove("bad");
    importStatusEl.classList.add("ok");
  }

  function importData() {
    const file = importFile.files[0];
    if (!file) {
      importStatusEl.textContent = "Please select a JSON file.";
      importStatusEl.classList.remove("ok");
      importStatusEl.classList.add("bad");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.savedKeys || !data.friendsKeys) {
          throw new Error("Invalid backup file format.");
        }

        if (!Array.isArray(data.savedKeys) || !Array.isArray(data.friendsKeys)) {
          throw new Error("Invalid backup file format.");
        }

        persistSavedKeys(data.savedKeys);
        persistFriendsKeys(data.friendsKeys);
        renderSavedKeys();
        renderFriendsKeys();

        importStatusEl.textContent = "Data restored successfully. (" + data.savedKeys.length + " keys, " + data.friendsKeys.length + " friends)";
        importStatusEl.classList.remove("bad");
        importStatusEl.classList.add("ok");

        importFile.value = "";
      } catch (err) {
        importStatusEl.textContent = "Error importing file: " + (err.message || "Unknown error");
        importStatusEl.classList.remove("ok");
        importStatusEl.classList.add("bad");
      }
    };

    reader.readAsText(file);
  }

  function switchTab(tabName) {
    myKeysContent.classList.remove("active");
    friendsKeysContent.classList.remove("active");
    settingsContent.classList.remove("active");
    tabMyKeys.classList.remove("active");
    tabFriendsKeys.classList.remove("active");
    tabSettings.classList.remove("active");

    if (tabName === "my-keys") {
      myKeysContent.classList.add("active");
      tabMyKeys.classList.add("active");
    } else if (tabName === "friends-keys") {
      friendsKeysContent.classList.add("active");
      tabFriendsKeys.classList.add("active");
    } else if (tabName === "settings") {
      settingsContent.classList.add("active");
      tabSettings.classList.add("active");
    }

    localStorage.setItem(CURRENT_TAB_KEY, tabName);
  }

  function loadLastTab() {
    const lastTab = localStorage.getItem(CURRENT_TAB_KEY) || "my-keys";
    switchTab(lastTab);
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
    renderFriendsKeys();
    loadLastTab();
  }

  rememberInput.addEventListener("change", function () {
    if (rememberInput.checked) {
      localStorage.setItem(KEY_REMEMBER, "1");
      const rawInput = String(homeInput.value || "").trim();
      if (rawInput) {
        localStorage.setItem(KEY_ID, rawInput);
      }
    } else {
      localStorage.removeItem(KEY_REMEMBER);
      localStorage.removeItem(KEY_ID);
    }
  });

  btnNormalize.addEventListener("click", buildOutputs);
  homeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") buildOutputs();
  });

  btnCopyAllLinks.addEventListener("click", function () {
    copyText(outLinkAll.value, "Link copied.");
  });

  btnSaveKey.addEventListener("click", function () {
    const normalized = (outLinkAll.value || "").trim();
    const name = (keyNameInput.value || "").trim();

    if (!normalized) {
      setStatus("Generate a link first before saving.", "bad");
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

  tabMyKeys.addEventListener("click", function () {
    switchTab("my-keys");
  });

  tabFriendsKeys.addEventListener("click", function () {
    switchTab("friends-keys");
  });

  tabSettings.addEventListener("click", function () {
    switchTab("settings");
  });

  btnAddFriend.addEventListener("click", function () {
    const friendName = (friendNameInput.value || "").trim();
    const friendLink = (friendLinkInput.value || "").trim();

    if (!friendName) {
      setFriendStatus("Please enter your friend's name.", "bad");
      return;
    }

    if (!friendLink) {
      setFriendStatus("Please enter your friend's home link.", "bad");
      return;
    }

    const destination = parseInputDestination(friendLink, friendTypeSelect && friendTypeSelect.value === "apartment" ? "apartment" : "standard");
    if (!destination) {
      setFriendStatus("Invalid YoWorld home link.", "bad");
      return;
    }

    const friends = loadFriendsKeys();
    const duplicateName = friends.some(function (entry) {
      return entry.name.toLowerCase() === friendName.toLowerCase();
    });
    if (duplicateName) {
      setFriendStatus("A friend with that name is already saved.", "bad");
      return;
    }
    friends.unshift({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: friendName,
      url: buildCanonicalUrl(destination),
      createdAt: new Date().toISOString()
    });

    persistFriendsKeys(friends);
    renderFriendsKeys();
    setFriendStatus("Friend saved!", "ok");
    friendNameInput.value = "";
    friendLinkInput.value = "";
    friendNameInput.focus();
  });

  friendLinkInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      btnAddFriend.click();
    }
  });

  btnClearFriends.addEventListener("click", function () {
    const friends = loadFriendsKeys();
    if (!friends.length) {
      setFriendStatus("No saved friends to clear.", "bad");
      return;
    }

    localStorage.removeItem(KEY_FRIENDS_KEYS);
    renderFriendsKeys();
    setFriendStatus("All saved friends cleared.", "ok");
  });

  btnExport.addEventListener("click", exportData);
  btnImport.addEventListener("click", importData);

  loadRemembered();
})();