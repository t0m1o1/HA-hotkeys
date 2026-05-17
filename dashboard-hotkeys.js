const DASHBOARD_HOTKEY_KEYS = [
  { key: "ArrowUp", label: "Arrow Up", defaultCommand: "DPAD_UP" },
  { key: "ArrowLeft", label: "Arrow Left", defaultCommand: "DPAD_LEFT" },
  { key: "ArrowRight", label: "Arrow Right", defaultCommand: "DPAD_RIGHT" },
  { key: "Tab", label: "Arrow Down (Tab)", defaultCommand: "DPAD_DOWN" },
  { key: "Enter", label: "OK", defaultCommand: "DPAD_CENTER" },
  { key: "PageUp", label: "Page Up" },
  { key: "PageDown", label: "Page Down" },

  { key: "F1", label: "Home (F1)" },
  { key: "F2", label: "Power (F2)" },
  { key: "F3", label: "Assist (F3)" },
  { key: "F4", label: "Lights (F4)" },
  { key: "F5", label: "Covers (F5)" },
  { key: "F6", label: "Media (F6)" },
  { key: "F7", label: "Climate (F7)" },
  { key: "F8", label: "Red (F8)" },
  { key: "F9", label: "Green (F9)" },
  { key: "F10", label: "Blue (F10)" },
  { key: "F11", label: "Yellow (F11)" }
];

const DASHBOARD_HOTKEY_REMOTE_KEYS = [
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Enter"
];

const DASHBOARD_HOTKEY_PRESETS = [
  {
    value: "",
    label: "No action",
    service: "",
    domain: null
  },
  {
    value: "remote.send_command",
    label: "Remote command",
    service: "remote.send_command",
    domain: "remote",
    needsCommand: true
  },
  {
    value: "navigate",
    label: "Navigate to dashboard/view",
    action: "navigate",
    service: "",
    domain: null,
    needsPath: true
  },
  {
    value: "assist",
    label: "Open Assist on this device",
    action: "assist",
    service: "",
    domain: null,
    opensAssist: true
  },
  {
    value: "script.turn_on",
    label: "Run script",
    service: "script.turn_on",
    domain: "script"
  },
  {
    value: "scene.turn_on",
    label: "Activate scene",
    service: "scene.turn_on",
    domain: "scene"
  },
  {
    value: "media_player.media_play_pause",
    label: "Media play / pause",
    service: "media_player.media_play_pause",
    domain: "media_player"
  },
  {
    value: "media_player.volume_up",
    label: "Media volume up",
    service: "media_player.volume_up",
    domain: "media_player"
  },
  {
    value: "media_player.volume_down",
    label: "Media volume down",
    service: "media_player.volume_down",
    domain: "media_player"
  },
  {
    value: "media_player.volume_mute",
    label: "Media mute",
    service: "media_player.volume_mute",
    domain: "media_player",
    extraData: {
      is_volume_muted: true
    }
  },
  {
    value: "media_player.media_next",
    label: "Media next track",
    service: "media_player.media_next",
    domain: "media_player"
  },
  {
    value: "media_player.media_previous",
    label: "Media previous track",
    service: "media_player.media_previous",
    domain: "media_player"
  },
  {
    value: "play_media",
    label: "Play media",
    service: "media_player.play_media",
    domain: "media_player",
    needsMedia: true
  },
  {
    value: "light.toggle",
    label: "Toggle light",
    service: "light.toggle",
    domain: "light"
  },
  {
    value: "switch.toggle",
    label: "Toggle switch",
    service: "switch.toggle",
    domain: "switch"
  },
  {
    value: "cover.open_cover",
    label: "Open cover",
    service: "cover.open_cover",
    domain: "cover"
  },
  {
    value: "cover.close_cover",
    label: "Close cover",
    service: "cover.close_cover",
    domain: "cover"
  },
  {
    value: "cover.stop_cover",
    label: "Stop cover",
    service: "cover.stop_cover",
    domain: "cover"
  },
  {
    value: "climate.turn_on",
    label: "Climate on",
    service: "climate.turn_on",
    domain: "climate"
  },
  {
    value: "climate.turn_off",
    label: "Climate off",
    service: "climate.turn_off",
    domain: "climate"
  },
  {
    value: "custom_service",
    label: "Custom service",
    action: "call-service",
    domain: null,
    needsCustomService: true
  }
];

class DashboardHotkeys extends HTMLElement {
  static async getConfigElement() {
    await customElements.whenDefined("dashboard-hotkeys-editor");
    return document.createElement("dashboard-hotkeys-editor");
  }

  static async getStubConfig() {
    const hotkeys = {};

    DASHBOARD_HOTKEY_KEYS.forEach(({ key }) => {
      hotkeys[key] = {};
    });

    return {
      path: "",
      show_last_key: true,
      hotkeys,
      custom_keys: []
    };
  }

  setConfig(config) {
    this.config = config || {};
    this._lastKey = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  connectedCallback() {
    if (this._boundKeyHandler) return;

    this._boundKeyHandler = (event) => {
      if (this._isEditMode()) return;

      const tag = event.target?.tagName?.toLowerCase();

      if (["input", "textarea", "select"].includes(tag)) return;
      if (event.target?.isContentEditable) return;

      if (this.config.path && !window.location.pathname.includes(this.config.path)) {
        return;
      }

      const key = event.key || "";
      const code = event.code || "";
      const keyCode = event.keyCode || event.which || "";

      const action =
        this.config.hotkeys?.[key] ||
        this.config.hotkeys?.[code] ||
        this.config.hotkeys?.[String(keyCode)];

      this._lastKey = {
        key,
        code,
        keyCode,
        matched: !!action && (!!action.service || !!action.action),
        time: new Date().toLocaleTimeString()
      };

      this._render();

      if (!action || (!action.service && !action.action)) return;

      event.preventDefault();
      event.stopPropagation();

      this._runAction(action);
    };

    window.addEventListener("keydown", this._boundKeyHandler, true);

    // Re-render when edit mode toggles so the card becomes visible/invisible
    const observer = new MutationObserver(() => {
      this._render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  disconnectedCallback() {
    if (this._boundKeyHandler) {
      window.removeEventListener("keydown", this._boundKeyHandler, true);
      this._boundKeyHandler = undefined;
    }
  }

  _openAssist() {
    const event = new Event("hass-action", {
      bubbles: true,
      composed: true
    });
  
    event.detail = {
      config: {
        entity: "",
        tap_action: {
          action: "assist",
          pipeline_id: "preferred",
          start_listening: true
        }
      },
      action: "tap"
    };

    this.dispatchEvent(event);
  }
  _runAction(action) {
    if (!action) return;

    if (action.action === "navigate") {
      const path = action.data?.path || "";
      if (!path) return;

      history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }

    if (action.action === "assist") {
      this._openAssist();
      return;
    }

    // call-service — standard HA Lovelace action type
    if (action.action === "call-service") {
      if (!action.service || !this._hass) return;
      const [domain, svc] = action.service.split(".");
      if (!domain || !svc) return;
      const serviceData = { ...(action.data || {}) };
      this._hass.callService(domain, svc, serviceData, action.target);
      return;
    }

    if (!action.service || !this._hass) return;

    const [domain, service] = action.service.split(".");
    if (!domain || !service) return;

    const serviceData = { ...(action.data || {}) };
    const target = action.target;
    this._hass.callService(domain, service, serviceData, target);
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _isEditMode() {
    const huiRoot = document.querySelector("hui-root");
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("edit") === "1" ||
      document.querySelector("body")?.classList.contains("edit-mode") ||
      huiRoot?.hasAttribute("edit-mode") ||
      huiRoot?.classList.contains("edit-mode") ||
      document.documentElement.classList.contains("edit-mode") ||
      window.location.pathname.startsWith("/config/lovelace") ||
      window.location.hash.includes("/config/")
    );
  }

  _render() {
    // In edit mode always show so the editor can configure keys
    if (!this.config?.show_last_key && !this._isEditMode()) {
      this.innerHTML = "";
      return;
    }

    const last = this._lastKey;

    this.innerHTML = `
      <ha-card>
        <div style="padding: 14px 16px;">
          <div style="font-weight: 600; margin-bottom: 10px;">
            Dashboard Hotkeys
          </div>

          ${
            last
              ? `
                <div style="display: grid; grid-template-columns: 90px 1fr; gap: 4px 10px; font-size: 0.92em;">
                  <div><strong>key</strong></div><div>${this._escape(last.key)}</div>
                  <div><strong>code</strong></div><div>${this._escape(last.code)}</div>
                  <div><strong>keyCode</strong></div><div>${this._escape(last.keyCode)}</div>
                  <div><strong>matched</strong></div><div>${last.matched ? "yes" : "no"}</div>
                  <div><strong>time</strong></div><div>${this._escape(last.time)}</div>
                </div>
              `
              : `<div style="opacity: 0.7;">Press a key to test...</div>`
          }
        </div>
      </ha-card>
    `;
  }
}

class DashboardHotkeysEditor extends HTMLElement {
  setConfig(config) {
    const hotkeys = {
      ...(config?.hotkeys || {})
    };

    DASHBOARD_HOTKEY_KEYS.forEach(({ key }) => {
      if (!hotkeys[key]) hotkeys[key] = {};
    });

    // Ensure custom key entries also exist in hotkeys
    (config?.custom_keys || []).forEach(({ key }) => {
      if (!hotkeys[key]) hotkeys[key] = {};
    });

    this.config = {
      path: "",
      show_last_key: true,
      ...(config || {}),
      hotkeys,
      custom_keys: config?.custom_keys || []
    };

    this._serviceList = null; // Reset cached service list
    this._fetchServiceList();

    this._hasRendered = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._fetchServiceList();

    if (this.config && !this._hasRendered) {
      this._render();
    }
  }

  async _fetchServiceList() {
    if (this._serviceList) return;
    if (!this._hass?.callWS) return;
    try {
      const resp = await this._hass.callWS({ type: "services" });
      const services = resp || {};
      this._serviceList = [];
      Object.keys(services).forEach((domain) => {
        Object.keys(services[domain]).forEach((svc) => {
          this._serviceList.push(`${domain}.${svc}`);
        });
      });
    } catch (_) {}
  }

  _dispatchConfigChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: {
          config: this.config
        },
        bubbles: true,
        composed: true
      })
    );
  }

  _showToast(message) {
    try {
      this.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message },
          bubbles: true,
          composed: true
        })
      );
    } catch (_) {
      console.warn(message);
    }
  }
  _openAssist() {
    const event = new Event("hass-action", {
      bubbles: true,
      composed: true
    });
  
    event.detail = {
      config: {
        entity: "",
        tap_action: {
          action: "assist",
          pipeline_id: "preferred",
          start_listening: true
        }
      },
      action: "tap"
    };
  
    this.dispatchEvent(event);
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _getPresetByValue(value) {
    return (
      DASHBOARD_HOTKEY_PRESETS.find((preset) => preset.value === value) ||
      DASHBOARD_HOTKEY_PRESETS[0]
    );
  }

  _getPresetForAction(action) {
    if (action?.action === "call-service") {
      // Custom service via HA action picker
      return DASHBOARD_HOTKEY_PRESETS.find((preset) => preset.value === "custom_service");
    }

    if (action?.action) {
      const actionPreset = DASHBOARD_HOTKEY_PRESETS.find(
        (preset) => preset.action === action.action
      );

      if (actionPreset) return actionPreset;
    }

    if (!action?.service) return DASHBOARD_HOTKEY_PRESETS[0];

    const exact = DASHBOARD_HOTKEY_PRESETS.find(
      (preset) => preset.service === action.service
    );

    return exact || DASHBOARD_HOTKEY_PRESETS.find((preset) => preset.value === "custom_service");
  }

  _getKeyDefinition(key) {
    return this._getAllKeys().find((item) => item.key === key);
  }

  _getAllKeys() {
    return [
      ...DASHBOARD_HOTKEY_KEYS,
      ...(this.config.custom_keys || [])
    ];
  }

  _addCustomKey(keyName, label) {
    if (!keyName || !label) return;
    if (this._getAllKeys().some((k) => k.key === keyName)) {
      this._showToast("Key already exists");
      return;
    }
    const customKeys = [...(this.config.custom_keys || []), { key: keyName, label }];
    const hotkeys = { ...this.config.hotkeys };
    hotkeys[keyName] = {};
    this.config = { ...this.config, custom_keys: customKeys, hotkeys };
    this._dispatchConfigChanged();
    this._render();
  }

  _removeCustomKey(keyName) {
    const customKeys = (this.config.custom_keys || []).filter((k) => k.key !== keyName);
    const hotkeys = { ...this.config.hotkeys };
    delete hotkeys[keyName];
    this.config = { ...this.config, custom_keys: customKeys, hotkeys };
    this._dispatchConfigChanged();
    this._render();
  }

  _updateTopLevel(field, value) {
    this.config = {
      ...this.config,
      [field]: value
    };

    this._dispatchConfigChanged();
  }

  _setHotkeyAction(key, action) {
    this.config = {
      ...this.config,
      hotkeys: {
        ...(this.config.hotkeys || {}),
        [key]: action
      }
    };

    this._dispatchConfigChanged();
  }

  _changeActionType(key, presetValue) {
    const preset = this._getPresetByValue(presetValue);
    const existing = this.config.hotkeys?.[key] || {};
    const existingData = existing.data || {};
    const existingEntity = existingData.entity_id || "";
    const keyDefinition = this._getKeyDefinition(key);

    let nextAction = {};

    if (!preset.value) {
      nextAction = {};
    } else if (preset.needsMedia) {
      // play_media — entity goes in target, media fields in data
      const existingMedia = {
        media_content_id: existingData.media_content_id || "",
        media_content_type: existingData.media_content_type || "",
        media_title: existingData.media_title || ""
      };
      nextAction = {
        service: preset.service,
        data: { ...existingMedia },
        target: { entity_id: existing.target?.entity_id || existingEntity || "" }
      };
    } else if (preset.needsCustomService) {
      // Custom service — use HA's standard call-service action format
      // Preserve any existing call-service fields
      const isCallService = existing.action === "call-service";
      const existingService = isCallService ? existing.service : (existing.service || "");
      const existingTarget = isCallService ? existing.target : (existing.target || {});
      const existingActionData = isCallService ? existing.data : existing;
      const { entity_id, media_content_id, media_content_type, media_title, ...rest } = (existingActionData || {});

      // entity_id lives in target for call-service; also mirror to data for the entity selector
      const entityId = existingTarget?.entity_id || entity_id || "";

      nextAction = {
        action: "call-service",
        service: existingService,
        target: { entity_id: entityId, ...existingTarget },
        data: { entity_id: entityId, ...rest }
      };
    } else {
      nextAction = {
        ...(preset.action ? { action: preset.action } : { service: preset.service }),
        data: {
          ...(preset.extraData || {})
        }
      };

      if (!preset.needsPath && !preset.opensAssist) {
        nextAction.data.entity_id = existingEntity;
      }

      if (preset.needsCommand) {
        nextAction.data.command =
          existingData.command || keyDefinition?.defaultCommand || "";
      }

      if (preset.needsPath) {
        nextAction.data.path = existingData.path || "";
      }
    }

    this._setHotkeyAction(key, nextAction);
    this._render();
  }

  _updateEntity(key, entityId) {
    const existing = this.config.hotkeys?.[key] || {};
    const existingData = existing.data || {};
    const existingTarget = existing.target || {};

    // For call-service, entity goes in target.entity_id; also keep data.entity_id in sync for the selector
    const isCallService = existing.action === "call-service";

    this._setHotkeyAction(key, {
      ...existing,
      ...(isCallService ? { target: { ...existingTarget, entity_id: entityId } } : {}),
      data: {
        ...existingData,
        entity_id: entityId
      }
    });
  }

  _updateCommand(key, command) {
    const existing = this.config.hotkeys?.[key] || {};
    const existingData = existing.data || {};

    const nextData = {
      ...existingData
    };

    if (command) {
      nextData.command = command;
    } else {
      delete nextData.command;
    }

    this._setHotkeyAction(key, {
      ...existing,
      data: nextData
    });
  }

  _updateNavigatePath(key, path) {
    const existing = this.config.hotkeys?.[key] || {};
    const existingData = existing.data || {};

    this._setHotkeyAction(key, {
      ...existing,
      data: {
        ...existingData,
        path
      }
    });
  }

  _updateCustomServiceField(key, field, value) {
    const existing = this.config.hotkeys?.[key] || {};
    this._setHotkeyAction(key, {
      ...existing,
      [field]: value
    });
  }

  _updateMediaContentId(key, value) {
    const existing = this.config.hotkeys?.[key] || {};
    const existingData = existing.data || {};

    this._setHotkeyAction(key, {
      ...existing,
      data: {
        ...existingData,
        media_content_id: value
      }
    });
  }

  _updateMediaContentType(key, value) {
    const existing = this.config.hotkeys?.[key] || {};
    const existingData = existing.data || {};

    this._setHotkeyAction(key, {
      ...existing,
      data: {
        ...existingData,
        media_content_type: value
      }
    });
  }

  _getTargetType(action) {
    if (!action?.target) return "entity";
    if (action.target.entity_id !== undefined) return "entity";
    if (action.target.device_id !== undefined) return "device";
    if (action.target.area_id !== undefined) return "area";
    return "entity";
  }

  _updateTarget(key, target) {
    const existing = this.config.hotkeys?.[key] || {};
    this._setHotkeyAction(key, {
      ...existing,
      target
    });
  }

  _clearHotkey(key) {
    this._setHotkeyAction(key, {});
    this._render();
  }

  _resetHotkey(key) {
    const keyDefinition = this._getKeyDefinition(key);

    let nextAction = {};

    if (DASHBOARD_HOTKEY_REMOTE_KEYS.includes(key)) {
      nextAction = {
        service: "remote.send_command",
        data: {
          entity_id: "",
          command: keyDefinition?.defaultCommand || ""
        }
      };
    } else if (key === "PageUp") {
      nextAction = {
        service: "media_player.volume_up",
        data: {
          entity_id: ""
        }
      };
    } else if (key === "PageDown") {
      nextAction = {
        service: "media_player.volume_down",
        data: {
          entity_id: ""
        }
      };
    } else if (key === "F3") {
      nextAction = {
        action: "assist",
        data: {}
      };
    } else {
      nextAction = {
        service: "script.turn_on",
        data: {
          entity_id: ""
        }
      };
    }

    this._setHotkeyAction(key, nextAction);
    this._render();
  }

  _fillRemoteDefaults() {
    const hotkeys = {};

    DASHBOARD_HOTKEY_KEYS.forEach(({ key }) => {
      if (DASHBOARD_HOTKEY_REMOTE_KEYS.includes(key)) {
        const def = this._getKeyDefinition(key);

        hotkeys[key] = {
          service: "remote.send_command",
          data: {
            entity_id: "",
            command: def?.defaultCommand || ""
          }
        };
      } else if (key === "PageUp") {
        hotkeys[key] = {
          service: "media_player.volume_up",
          data: {
            entity_id: ""
          }
        };
      } else if (key === "PageDown") {
        hotkeys[key] = {
          service: "media_player.volume_down",
          data: {
            entity_id: ""
          }
        };
      } else if (key === "F3") {
        hotkeys[key] = {
          action: "assist",
          data: {}
        };
      } else {
        hotkeys[key] = {
          service: "script.turn_on",
          data: {
            entity_id: ""
          }
        };
      }
    });

    this.config = {
      ...this.config,
      hotkeys
    };

    this._dispatchConfigChanged();
    this._render();
  }

  _testHotkey(key) {
    const action = this.config.hotkeys?.[key];

    if (!action?.service && !action?.action) {
      this._showToast("No action configured");
      return;
    }

    if (action.action === "navigate") {
      const path = action.data?.path || "";

      if (!path) {
        this._showToast("Please enter a dashboard path");
        return;
      }

      history.pushState(null, "", path);
      window.dispatchEvent(new Event("location-changed"));
      this._showToast(`Navigated to ${path}`);
      return;
    }

    if (action.action === "assist") {
      this._openAssist();
      this._showToast("Opened Assist");
      return;
    }

    if (!this._hass) {
      this._showToast("Home Assistant is not ready");
      return;
    }

    const [domain, service] = action.service.split(".");

    if (!domain || !service) {
      this._showToast("Invalid service");
      return;
    }

    const data = action.data || {};

    // call-service stores entity_id in target, not data
    const entityId = action.action === "call-service"
      ? action.target?.entity_id
      : data.entity_id;

    if (!entityId) {
      this._showToast("Please choose an entity first");
      return;
    }

    if (action.service === "remote.send_command" && !data.command) {
      this._showToast("Please enter a remote command");
      return;
    }

    this._hass.callService(domain, service, data, action.target);
    this._showToast(`Sent ${action.service}`);
  }

  _createButton(text, onClick, variant = "default") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;

    const styles = {
      default: `
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      `,
      primary: `
        border: 1px solid var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.10);
        color: var(--primary-color);
      `,
      danger: `
        border: 1px solid rgba(244,67,54,0.35);
        background: rgba(244,67,54,0.1);
        color: #f44336;
      `
    };

    button.style.cssText = `
      padding: 7px 12px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 0.86em;
      white-space: nowrap;
      ${styles[variant] || styles.default}
    `;

    button.addEventListener("click", onClick);

    return button;
  }

  _createActionSelect(key, action, preset) {
    const select = document.createElement("select");

    select.style.cssText = `
      width: 100%;
      padding: 7px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
    `;

    DASHBOARD_HOTKEY_PRESETS.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      option.selected = item.value === preset.value;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      this._changeActionType(key, event.target.value);
    });

    return select;
  }

  _createEntitySelector(key, action, preset) {
    const selector = document.createElement("ha-selector");

    selector.hass = this._hass;

    if (preset.domain) {
      selector.selector = {
        entity: {
          filter: {
            domain: preset.domain
          }
        }
      };
    } else {
      selector.selector = {
        entity: {}
      };
    }

    selector.value = action?.data?.entity_id || "";
    selector.style.cssText = `
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    `;

    selector.addEventListener("value-changed", (event) => {
      this._updateEntity(key, event.detail.value || "");
    });

    return selector;
  }

  _createTargetSelector(key, action, preset) {
    const type = this._getTargetType(action);
    const target = action?.target || {};

    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    `;

    // Target type selector
    const typeSelect = document.createElement("select");
    typeSelect.style.cssText = `
      width: 100%;
      padding: 5px 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 0.85em;
    `;
    ["entity", "device", "area"].forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t.charAt(0).toUpperCase() + t.slice(1) + " ID";
      opt.selected = t === type;
      typeSelect.appendChild(opt);
    });

    const valueChanged = (val) => {
      const newTarget = { [type + "_id"]: val };
      this._updateTarget(key, newTarget);
    };

    typeSelect.addEventListener("change", (e) => {
      const newType = e.target.value;
      this._updateTarget(key, { [newType + "_id"]: "" });
      // Rebuild the value input
      valueInput.innerHTML = "";
      valueInput.appendChild(this._createTargetValueInput(key, newType, "", preset));
    });

    container.appendChild(typeSelect);

    // Value input (changes based on type)
    const valueInput = document.createElement("div");
    valueInput.style.cssText = `width: 100%;`;
    valueInput.appendChild(this._createTargetValueInput(key, type, target[type + "_id"] || "", preset));
    container.appendChild(valueInput);

    return container;
  }

  _createTargetValueInput(key, type, currentValue, preset) {
    if (type === "entity") {
      const selector = document.createElement("ha-selector");
      selector.hass = this._hass;
      selector.selector = {
        entity: {
          filter: {
            domain: preset?.domain || "media_player"
          }
        }
      };
      selector.value = currentValue || "";
      selector.style.cssText = `
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
      `;
      selector.addEventListener("value-changed", (e) => {
        this._updateTarget(key, { entity_id: e.detail.value || "" });
      });
      return selector;
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentValue || "";
      input.placeholder = type === "device" ? "Device ID, e.g. abc123" : "Area ID, e.g. living_room";
      input.style.cssText = `
        width: 100%;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
        font-size: 0.85em;
      `;
      input.addEventListener("change", (e) => {
        this._updateTarget(key, { [type + "_id"]: e.target.value.trim() });
      });
      return input;
    }
  }

  _createTextInput(value, placeholder, onChange) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value || "";
    input.placeholder = placeholder || "";

    input.style.cssText = `
      width: 100%;
      padding: 7px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
    `;

    input.addEventListener("change", (event) => {
      onChange(event.target.value.trim());
    });

    return input;
  }

  _applyResponsiveRowLayout(row, topLine, bottomLine) {
    const resize = () => {
      const narrow = row.clientWidth < 760;

      if (narrow) {
        row.style.gridTemplateColumns = "1fr";
        topLine.style.gridTemplateColumns = "1fr";
        bottomLine.style.gridTemplateColumns = "1fr";
      } else {
        row.style.gridTemplateColumns = "minmax(110px, 150px) minmax(0, 1fr)";
        topLine.style.gridTemplateColumns =
          "minmax(220px, 0.9fr) minmax(260px, 1.1fr)";
        bottomLine.style.gridTemplateColumns = "minmax(220px, 1fr) auto auto auto";
      }
    };

    requestAnimationFrame(resize);

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(resize);
      observer.observe(row);
    }
  }

  _createKeyRow(keyInfo) {
    const { key, label } = keyInfo;
    const action = this.config.hotkeys?.[key] || {};
    const preset = this._getPresetForAction(action);
    const data = action.data || {};

    const row = document.createElement("div");

    row.style.cssText = `
      display: grid;
      grid-template-columns: minmax(110px, 150px) minmax(0, 1fr);
      gap: 14px;
      padding: 16px;
      background-color: rgba(255, 255, 255, 0.03);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-sizing: border-box;
      width: 100%;
      overflow: visible;
    `;

    const keyLabel = document.createElement("div");
    keyLabel.textContent = label;
    keyLabel.style.cssText = `
      font-weight: 600;
      font-size: 0.9em;
      align-self: start;
      padding-top: 7px;
    `;

    row.appendChild(keyLabel);

    const right = document.createElement("div");
    right.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    `;

    const topLine = document.createElement("div");
    topLine.style.cssText = `
      display: grid;
      grid-template-columns: minmax(220px, 0.9fr) minmax(260px, 1.1fr);
      gap: 10px;
      align-items: center;
      min-width: 0;
      width: 100%;
    `;

    topLine.appendChild(this._createActionSelect(key, action, preset));

    if (preset.needsMedia) {
      // Content type selector
      const mediaTypeSelect = document.createElement("select");
      mediaTypeSelect.style.cssText = `
        width: 100%;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
      `;
      ["", "music", "tvshow", "movie", "video", "image", "app", "channel", "playlist"].forEach((type) => {
        const opt = document.createElement("option");
        opt.value = type;
        opt.textContent = type || "(select type)";
        opt.selected = (data.media_content_type || "") === type;
        mediaTypeSelect.appendChild(opt);
      });
      mediaTypeSelect.addEventListener("change", (e) => {
        this._updateMediaContentType(key, e.target.value);
      });
      topLine.appendChild(mediaTypeSelect);
      // Target selector (entity / device / area)
      topLine.appendChild(this._createTargetSelector(key, action, preset));
    } else if (preset.value && !preset.needsPath && !preset.opensAssist) {
      topLine.appendChild(this._createEntitySelector(key, action, preset));
    } else {
      const empty = document.createElement("div");
      empty.textContent = "No entity needed";
      empty.style.cssText = `
        opacity: 0.55;
        font-size: 0.9em;
        padding: 7px 0;
      `;
      topLine.appendChild(empty);
    }

    right.appendChild(topLine);

    const bottomLine = document.createElement("div");
    bottomLine.style.cssText = `
      display: grid;
      grid-template-columns: minmax(220px, 1fr) auto auto auto;
      gap: 10px;
      align-items: center;
      min-width: 0;
      width: 100%;
    `;

    if (preset.needsCommand) {
      bottomLine.appendChild(
        this._createTextInput(data.command || "", "Command, e.g. DPAD_UP", (value) => {
          this._updateCommand(key, value);
        })
      );
    } else if (preset.needsPath) {
      bottomLine.appendChild(
        this._createTextInput(data.path || "", "Path, e.g. /dashboard-tv/media", (value) => {
          this._updateNavigatePath(key, value);
        })
      );
    } else if (preset.needsMedia) {
      // Media content ID input
      bottomLine.appendChild(
        this._createTextInput(
          data.media_content_id || "",
          "Media content ID, e.g. com.google.android.youtube.tv",
          (value) => {
            this._updateMediaContentId(key, value);
          }
        )
      );
    } else if (preset.needsCustomService) {
      // Service name input with autocomplete from HA's service registry
      const serviceDatalistId = `services-${key.replace(/[^a-zA-Z0-9]/g, "")}`;
      const serviceInputWrapper = document.createElement("div");
      serviceInputWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      `;

      // Service name input
      const serviceInput = document.createElement("input");
      serviceInput.type = "text";
      serviceInput.value = action.service || "";
      serviceInput.placeholder = "domain.service, e.g. light.toggle";
      serviceInput.setAttribute("list", serviceDatalistId);
      serviceInput.style.cssText = `
        width: 100%;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
        font-size: 0.9em;
      `;
      serviceInput.addEventListener("change", (e) => {
        const val = e.target.value.trim();
        this._setHotkeyAction(key, {
          action: "call-service",
          service: val,
          target: action.target || {},
          data: action.data || {}
        });
      });

      // Datalist for service suggestions (populated from cached service list)
      const datalist = document.createElement("datalist");
      datalist.id = serviceDatalistId;
      if (this._serviceList) {
        this._serviceList.forEach((svc) => {
          const opt = document.createElement("option");
          opt.value = svc;
          datalist.appendChild(opt);
        });
      }

      serviceInputWrapper.appendChild(serviceInput);
      serviceInputWrapper.appendChild(datalist);

      // Data extra fields input
      const dataLabel = document.createElement("div");
      dataLabel.textContent = "Extra data (JSON, optional):";
      dataLabel.style.cssText = `font-size: 0.8em; opacity: 0.7;`;

      const dataInput = document.createElement("input");
      dataInput.type = "text";
      const existingData = action.data || {};
      // Strip common fields that are handled separately; show the rest
      const { entity_id, media_content_id, media_content_type, media_title, ...extraRest } = existingData;
      dataInput.value = JSON.stringify(extraRest).replace(/^"|"$/g, "");
      dataInput.placeholder = '{"key": "value"}';
      dataInput.style.cssText = `
        width: 100%;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-sizing: border-box;
        font-size: 0.85em;
      `;
      dataInput.addEventListener("change", (e) => {
        let extraData = {};
        try { extraData = JSON.parse(e.target.value || "{}"); } catch (_) {}
        this._setHotkeyAction(key, {
          action: "call-service",
          service: action.service || "",
          target: action.target || {},
          data: { ...(action.data || {}), ...extraData }
        });
      });

      serviceInputWrapper.appendChild(dataLabel);
      serviceInputWrapper.appendChild(dataInput);

      topLine.style.gridTemplateColumns = "1fr";
      topLine.innerHTML = "";
      topLine.appendChild(serviceInputWrapper);
      bottomLine.style.display = "none";
      return row;
    } else {
      const noExtra = document.createElement("div");
      noExtra.textContent = "No command/value needed";
      noExtra.style.cssText = `
        opacity: 0.55;
        font-size: 0.9em;
      `;
      bottomLine.appendChild(noExtra);
    }

    bottomLine.appendChild(
      this._createButton(
        "Test",
        () => {
          this._testHotkey(key);
        },
        "primary"
      )
    );

    bottomLine.appendChild(
      this._createButton("Reset", () => {
        this._resetHotkey(key);
      })
    );

    bottomLine.appendChild(
      this._createButton(
        "Clear",
        () => {
          this._clearHotkey(key);
        },
        "danger"
      )
    );

    // Remove button for custom keys
    if (this.config.custom_keys?.some((ck) => ck.key === key)) {
      bottomLine.appendChild(
        this._createButton(
          "Remove",
          () => {
            this._removeCustomKey(key);
          },
          "danger"
        )
      );
    }

    right.appendChild(bottomLine);
    row.appendChild(right);

    this._applyResponsiveRowLayout(row, topLine, bottomLine);

    return row;
  }

  _render() {
    if (!this.config) return;

    this.innerHTML = "";

    const root = document.createElement("div");

    root.style.cssText = `
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-sizing: border-box;
      width: 100%;
    `;

    const title = document.createElement("div");
    title.textContent = "Dashboard Hotkeys Setup";
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color);
    `;

    root.appendChild(title);

    const pathRow = document.createElement("div");
    pathRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    `;

    const pathLabel = document.createElement("span");
    pathLabel.textContent = "Dashboard path:";
    pathLabel.style.cssText = `
      width: 110px;
      font-weight: bold;
      flex-shrink: 0;
    `;

    const pathInput = this._createTextInput(this.config.path || "", "/dashboard-tv", (value) => {
      this._updateTopLevel("path", value);
    });

    pathRow.appendChild(pathLabel);
    pathRow.appendChild(pathInput);
    root.appendChild(pathRow);

    const debugRow = document.createElement("div");
    debugRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const debugLabel = document.createElement("span");
    debugLabel.textContent = "Debug display:";
    debugLabel.style.cssText = `
      width: 110px;
      font-weight: bold;
      flex-shrink: 0;
    `;

    const debugCheckboxLabel = document.createElement("label");
    debugCheckboxLabel.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
    `;

    const debugCheckbox = document.createElement("input");
    debugCheckbox.type = "checkbox";
    debugCheckbox.checked = !!this.config.show_last_key;

    debugCheckbox.addEventListener("change", (event) => {
      this._updateTopLevel("show_last_key", event.target.checked);
    });

    debugCheckboxLabel.appendChild(debugCheckbox);
    debugCheckboxLabel.appendChild(document.createTextNode("Show last pressed key"));

    debugRow.appendChild(debugLabel);
    debugRow.appendChild(debugCheckboxLabel);
    root.appendChild(debugRow);

    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 4px;
      padding-top: 10px;
      border-top: 1px solid var(--divider-color);
      flex-wrap: wrap;
    `;

    toolbar.appendChild(
      this._createButton(
        "Fill remote defaults",
        () => {
          this._fillRemoteDefaults();
        },
        "primary"
      )
    );

    const hint = document.createElement("span");
    hint.textContent = "Tab is used as Arrow Down. Enter is shown as OK.";
    hint.style.cssText = `
      opacity: 0.65;
      font-size: 0.9em;
    `;

    toolbar.appendChild(hint);
    root.appendChild(toolbar);

    // Custom keys section
    const customKeysSection = document.createElement("div");
    customKeysSection.style.cssText = `
      margin-top: 4px;
      padding-top: 10px;
      border-top: 1px solid var(--divider-color);
    `;

    const customKeysHeader = document.createElement("div");
    customKeysHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    `;

    const customKeysTitle = document.createElement("span");
    customKeysTitle.textContent = "Custom Keys";
    customKeysTitle.style.cssText = `
      font-weight: bold;
      font-size: 0.95em;
    `;
    customKeysHeader.appendChild(customKeysTitle);

    const keyNameInput = document.createElement("input");
    keyNameInput.type = "text";
    keyNameInput.placeholder = "Key name, e.g. KeyA";
    keyNameInput.style.cssText = `
      padding: 5px 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.85em;
      width: 140px;
      box-sizing: border-box;
    `;
    customKeysHeader.appendChild(keyNameInput);

    const keyLabelInput = document.createElement("input");
    keyLabelInput.type = "text";
    keyLabelInput.placeholder = "Display label";
    keyLabelInput.style.cssText = `
      padding: 5px 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.85em;
      width: 140px;
      box-sizing: border-box;
    `;
    customKeysHeader.appendChild(keyLabelInput);

    const addKeyBtn = this._createButton("Add Key", () => {
      const keyName = keyNameInput.value.trim();
      const label = keyLabelInput.value.trim();
      if (keyName && label) {
        this._addCustomKey(keyName, label);
        keyNameInput.value = "";
        keyLabelInput.value = "";
      } else {
        this._showToast("Enter both a key name and a display label");
      }
    }, "primary");
    addKeyBtn.style.cssText = `font-size: 0.85em; padding: 5px 12px;`;
    customKeysHeader.appendChild(addKeyBtn);
    customKeysSection.appendChild(customKeysHeader);

    const customKeysContainer = document.createElement("div");
    customKeysContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    `;

    (this.config.custom_keys || []).forEach((keyInfo) => {
      customKeysContainer.appendChild(this._createKeyRow(keyInfo));
    });

    if ((this.config.custom_keys || []).length === 0) {
      const noCustom = document.createElement("div");
      noCustom.textContent = "No custom keys added yet.";
      noCustom.style.cssText = `
        opacity: 0.55;
        font-size: 0.9em;
        padding: 8px 0;
      `;
      customKeysContainer.appendChild(noCustom);
    }

    customKeysSection.appendChild(customKeysContainer);
    root.appendChild(customKeysSection);

    const sectionTitle = document.createElement("div");
    sectionTitle.textContent = "Built-in Keys";
    sectionTitle.style.cssText = `
      font-weight: bold;
      margin-top: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color);
    `;

    root.appendChild(sectionTitle);

    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    `;

    DASHBOARD_HOTKEY_KEYS.forEach((keyInfo) => {
      container.appendChild(this._createKeyRow(keyInfo));
    });

    root.appendChild(container);
    this.appendChild(root);

    this._hasRendered = true;
  }
}

if (!customElements.get("dashboard-hotkeys")) {
  customElements.define("dashboard-hotkeys", DashboardHotkeys);
}

if (!customElements.get("dashboard-hotkeys-editor")) {
  customElements.define("dashboard-hotkeys-editor", DashboardHotkeysEditor);
}

window.customCards = window.customCards || [];

window.customCards.push({
  type: "dashboard-hotkeys",
  name: "Dashboard Hotkeys",
  description: "Catch key presses on a dashboard and run Home Assistant actions",
  preview: false
});
