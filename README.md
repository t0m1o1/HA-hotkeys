# Dashboard Hotkeys — Home Assistant Lovelace Card

A custom Home Assistant Lovelace card that catches keyboard presses on a dashboard and fires Home Assistant service calls, navigation actions, or Assist.

Designed for dashboards displayed on a TV or wall panel with a keyboard or compact remote — press a key and something happens.

**Also ships with a Sanytron Astrion preset** that auto-registers all remote keys so they appear in the editor.

---

## Features

- **Key capturing** — catches `keydown` events globally, skips inputs/textareas/contenteditable
- **Path filtering** — only active on specific dashboard paths
- **20+ built-in presets** — navigate, Assist, media, lights, switches, covers, climate, scripts, scenes, and raw remote commands
- **Custom keys** — add your own keys beyond the built-in set
- **Entity picker** — uses HA's native `ha-selector` for entity, device, and area targets
- **Service autocomplete** — queries HA's service registry for `custom_service` actions
- **Test / Reset / Clear** — per-key action testing and reset in the editor
- **Debug display** — shows last key pressed with key/code/keyCode and whether it matched
- **Sanytron Astrion preset** — one-click import of all keys preconfigured for the Sanytron Astrion remote

---

## Requirements

- Home Assistant **2026.3.0 or later**
- A keyboard, numpad, or USB/Bluetooth remote sending standard key events connected to the machine running the HA dashboard

---

## Installation

### Option A — HACS (recommended)

1. Add this repository to HACS:
   > **HACS → Integrations → ⋯ → Custom repositories → add `https://github.com/t0m1o1/HA-hotkeys` as type "Lovelace"**

2. Restart Home Assistant

3. Add the card via the Lovelace UI:
   > **Edit Dashboard → Add Card → search for "Dashboard Hotkeys"**

### Option B — Manual

1. Copy `dashboard-hotkeys.js` into your HA config:

   ```bash
   # If your HA config is on the host:
   cp dashboard-hotkeys.js /path/to/ha/config/www/dashboard-hotkeys.js

   # Inside an HA Container:
   docker cp dashboard-hotkeys.js HA_CONTAINER:/config/www/dashboard-hotkeys.js
   ```

2. Register the resource in `configuration.yaml`:

   ```yaml
   frontend:
     extra_module_url:
       - /local/dashboard-hotkeys.js
     extra_builtin_url:
       - /local/dashboard-hotkeys.js
   ```

   Or in `ui.lovelace.yaml` resources (older setups):

   ```yaml
   resources:
     - url: /local/dashboard-hotkeys.js
       type: module
   ```

3. Restart Home Assistant

4. Add the card via **Edit Dashboard → Add Card → search "Dashboard Hotkeys"**

---

## Configuration

### Card-level options

| Option | Type | Default | Description |
|---|---|---|---|
| `path` | string | `""` | Only respond to keypresses when the browser URL contains this string. Empty = all paths. |
| `show_last_key` | boolean | `true` | Show the "last key pressed" debug panel |
| `hotkeys` | object | `{}` | Map of key names to actions. See below. |
| `custom_keys` | array | `[]` | List of extra key definitions beyond the built-in set |
| `preset` | string | `null` | Preset name to auto-apply on load. Currently supports `"sanytron-astrion"` |

### Action format

A hotkey action can be a Home Assistant action object:

```yaml
type: custom:dashboard-hotkeys
path: /dashboard-tv
show_last_key: true
hotkeys:
  ArrowUp:
    service: remote.send_command
    data:
      entity_id: remote.living_room_tv
      command: DPAD_UP
  ArrowDown:
    service: remote.send_command
    data:
      entity_id: remote.living_room_tv
      command: DPAD_DOWN
  Enter:
    service: remote.send_command
    data:
      entity_id: remote.living_room_tv
      command: DPAD_CENTER
  F3:
    action: assist          # opens HA Assist
    data: {}
  F4:
    service: light.toggle
    data:
      entity_id: light.living_room
  F5:
    action: navigate        # SPA navigation
    data:
      path: /dashboard-tv/covers
```

#### Supported action fields

| Field | Description |
|---|---|
| `service` | Home Assistant service to call, e.g. `remote.send_command` |
| `action` | Built-in action: `assist`, `navigate`, `call-service` |
| `data` | Service data / action parameters |
| `target` | Service target (`entity_id`, `device_id`, or `area_id`) |

#### Built-in action values

| Value | Effect |
|---|---|
| `""` (empty) | No action |
| `assist` | Opens HA Assist with `start_listening: true` |
| `navigate` | SPA navigation; requires `data.path` |
| `remote.send_command` | Sends a command to a Home Assistant remote entity |
| `script.turn_on` | Runs a script |
| `scene.turn_on` | Activates a scene |
| `media_player.media_play_pause` | Play/pause |
| `media_player.volume_up` | Volume up |
| `media_player.volume_down` | Volume down |
| `media_player.volume_mute` | Mute |
| `light.toggle` | Toggle a light |
| `switch.toggle` | Toggle a switch |
| `cover.open_cover` / `close_cover` / `stop_cover` | Cover control |
| `climate.turn_on` / `turn_off` | Climate on/off |
| `play_media` | Play media on a media player |
| `custom_service` | Call any service by name (standard `call-service` format) |

---

## The Sanytron Astrion Preset

The card ships with a **Sanytron Astrion preset** — it registers all physical keys from the Sanytron Astrion remote in the key list with **no actions assigned**. You then configure each key individually in the editor.

### What it does

- Adds all 18 Sanytron Astrion keys to the key list:
  - Arrow pad: Arrow Up, Arrow Left, Arrow Right, Down, OK
  - Page Up, Page Down
  - F1 Home, F2 Power, F3 Assist, F4 Lights, F5 Covers, F6 Media, F7 Climate, F8 Red, F9 Green, F10 Blue, F11 Yellow
- Leaves every hotkey action **empty** — configure them yourself in the editor
- No services, no navigate, no assist — completely blank slate per key

### Using the preset (editor)

In the card editor, click **"Sanytron Astrion"** in the toolbar. All keys appear in the list immediately — then assign actions to each one.

### Using the preset (YAML)

Add `preset: sanytron-astrion` to the card config:

```yaml
type: custom:dashboard-hotkeys
preset: sanytron-astrion
path: /dashboard-tv
show_last_key: true
hotkeys:
  # Configure specific keys after loading the preset:
  ArrowUp:
    service: remote.send_command
    data:
      entity_id: remote.living_room
      command: DPAD_UP
  F3:
    action: assist
    data: {}
```

### Path filtering

The **Dashboard path** field limits the card to a specific dashboard URL. If you run HA on multiple devices or dashboards with different hotkey setups, give each card instance a different path value (e.g. `/dashboard-tv`, `/dashboard-kitchen`) — then keypresses on one dashboard won't trigger hotkeys on another. Leave it empty to respond on all dashboards.

---

## Handling non-standard remote keys (KeyMapper)

Some keys on typical TV remote controls — particularly **Volume Up**, **Volume Down**, **Mute**, **Back**, and **Menu** — do not send standard USB HID keycodes that a browser can detect. Instead they send HID Consumer Page commands, which `keydown` events never see.

[KeyMapper](https://github.com/keymapperorg/KeyMapper) solves this. It runs on the machine connected to your TV/dashboard and intercepts these consumer-page events at the OS level, then re-emits them as ordinary keypresses you *can* capture.

### The remapping scheme

Set KeyMapper to translate those five media keys to characters that don't conflict with normal typing:

| Remote key | Remap to | Dashboard Hotkeys custom key |
|---|---|---|
| Volume Up | `+` | `+` |
| Volume Down | `-` | `-` |
| Mute | `m` | `m` |
| Back | `b` | `b` |
| Menu | `=` | `=` |

These characters are otherwise rarely used in dashboard navigation, so they make safe aliases.

### Setup steps

1. Install [KeyMapper](https://github.com/keymapperorg/KeyMapper) on the machine running the dashboard
2. Create a KeyMapper profile with the five mappings above (Volume Up → `+`, Volume Down → `-`, Mute → `m`, Back → `b`, Menu → `=`)
3. Enable and start the KeyMapper service
4. In Dashboard Hotkeys, add these five keys as custom keys with the names and labels from the table above
5. Assign actions to each key in the editor (e.g. `media_player.volume_up`, `media_player.volume_down`, `media_player.volume_mute`, navigation, etc.)

In YAML:

```yaml
custom_keys:
  - key: "+"
    label: Volume Up (KeyMapper)
  - key: "-"
    label: Volume Down (KeyMapper)
  - key: "m"
    label: Mute (KeyMapper)
  - key: "b"
    label: Back (KeyMapper)
  - key: "="
    label: Menu (KeyMapper)

hotkeys:
  "+":
    service: media_player.volume_up
    data:
      entity_id: media_player.living_room_tv
  "-":
    service: media_player.volume_down
    data:
      entity_id: media_player.living_room_tv
  m:
    service: media_player.volume_mute
    data:
      entity_id: media_player.living_room_tv
  b:
    action: navigate
    data:
      path: /dashboard-tv
  "=":
    service: script.my_menu_script
    data:
      entity_id: script.menu_script
```

> **Note:** If you are already using a keyboard with the dashboard you may already use `+` and `-` for other purposes. In that case choose a different unused character in KeyMapper and add it as a custom key instead.

---

## Running Home Assistant on a Sanytron Astrion

The [Sanytron Astrion](https://www.sanytron-astrion.com) is an HDMI stick-style Android TV device that runs Home Assistant Companion nicely as a dashboard display. Here is how to set it up.

### Method 1 — Bluetooth (recommended)

The Astrion can receive APKs over Bluetooth, which avoids needing to take the device apart.

1. On the Astrion, go to **Settings → Bluetooth** and make the device discoverable
2. Pair from your phone or laptop
3. In **Settings → Bluetooth → Bluetooth Access**, enable the option to allow APK installation over Bluetooth
4. Send the following APKs from your paired device:
   - **Home Assistant Companion** — [latest release on GitHub](https://github.com/home-assistant/core/releases)
   - **KeyMapper** — [latest release on GitHub](https://github.com/keymapperorg/KeyMapper)
5. The Astrion will prompt you to install each APK as it arrives

Once Home Assistant Companion is installed, open it and sign in to your HA instance. In **Settings → Home Assistant**, enable the option for the app to act as the **Home App**. This makes it appear as a selectable home target on boot — the Astrion will boot straight into HA Dashboard.

> **Tip:** If Home Assistant Companion is not available in your device's app store, or you prefer not to sideload it, a third-party launcher such as **Niagara Launcher** can be installed the same way and configured to open HA on boot.

### Method 2 — USB-C port (under the cover)

If Bluetooth installation is not convenient, a hidden USB-C port is accessible without opening the case:

1. Remove the two small screws on the bottom of the device near the charging terminal
2. Lift off the plastic cover to reveal a USB-C port underneath
3. Connect a USB-C cable and use `adb install` to push APKs directly:

```bash
adb install home-assistant-companion.apk
adb install keymapper.apk
```

This method is useful if you prefer not to pair over Bluetooth or need to sideload other tools.

### KeyMapper on the Astrion

Once KeyMapper is installed via either method above, enable it as a **device admin app** in:
**Settings → Security → Device Administrators → KeyMapper**

This allows it to intercept and remap key events system-wide, which is required for the volume and media key handling described earlier.

---

## Adding custom keys

The card supports keys beyond the built-in set (F1–F11, arrows, PageUp/PageDown, Enter, Tab).

In the editor UI, use the **Custom Keys** section at the top:

1. Enter the key name (e.g. `KeyA`, `Digit0`, `NumpadEnter`)
2. Enter a display label (e.g. `Numpad Enter`)
3. Click **Add Key**

Or in YAML:

```yaml
custom_keys:
  - key: KeyA
    label: Letter A
  - key: NumpadEnter
    label: Numpad Enter
```

To find the correct key name, press the key and check the **debug display** — it shows `key`, `code`, and `keyCode` values.

---

## How the key matcher works

When a key is pressed, the card checks `hotkeys` in this order:

1. Match by `event.key` (e.g. `"ArrowUp"`)
2. Match by `event.code` (e.g. `"ArrowUp"`, `"NumpadEnter"`)
3. Match by numeric `event.keyCode` / `event.which`

The first match wins. This means you can target broad families (`ArrowUp`) or specific physical keys (`NumpadEnter`) as needed.

---

## Troubleshooting

### Card doesn't appear in the card picker
- Make sure the resource is registered and Home Assistant has been restarted
- Check the browser console (`F12 → Console`) for any errors loading the JS
- Verify the resource URL is `/local/dashboard-hotkeys.js` and the file exists in `www/`

### Keys not responding
- Check the debug display panel on the card — does it show the key being pressed?
  - If `matched: no`, the key has no action configured
  - If the debug panel doesn't update at all, the card isn't receiving events — check `path` filtering
- Keys pressed inside `<input>`, `<textarea>`, `<select>`, or `contenteditable` elements are always ignored
- If using a remote, make sure it sends standard USB HID key events (many "media centre" remotes do)

### `assist` action does nothing
- Assist must be configured and a preferred pipeline set in Home Assistant
- The card fires HA's internal `hass-action` event with `tap_action` — this works in most HA versions but behaviour may vary

### Remote commands not working
- The `remote.send_command` service requires an active `remote` integration entity
- Verify the `entity_id` in the action points to your actual remote entity
- Some TVs/remotes need commands in a specific case (e.g. `DPAD_UP` vs `dpad_up`)

---

## Contributing

Issues and pull requests welcome at [github.com/t0m1o1/HA-hotkeys](https://github.com/t0m1o1/HA-hotkeys).

When reporting a bug, please include:
- HA version
- Browser (and OS)
- The key you're pressing and what's shown in the debug panel
- Any errors in the browser console
