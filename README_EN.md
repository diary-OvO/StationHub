# llm-station-hub

> Language: [简体中文](./README.md) · **English**

A Windows-first Wails desktop app for managing sites and accounts.
llm-station-hub keeps site entries, accounts, tags, quota status, and session logs in a local SQLite database.

## Features

- **Site management:** Create, edit, delete, and archive sites with name, URL, type, check-in flag, notes, and tags.
- **Account management:** Store multiple account records per site, including default accounts and L-Site login records.
- **Password protection:** Default account passwords are encrypted at rest and can only be revealed after secondary password verification.
- **Quota status:** Summarize account quota state and classify sites as active, empty-quota, or archived.
- **Tags and filters:** Manage tags and filter sites by keyword, type, check-in flag, tags, and archive state.
- **Session logs:** Inspect operation logs and errors from the current app session.
- **UI preferences:** Switch between Simplified Chinese / English and light / dark themes.
- **Quick open:** Open site URLs directly in the system default browser.

## Data and Security

- Data is stored in `llm-station-hub/llm-station-hub.db` under the user config directory.
  - On Windows this is usually `%AppData%\llm-station-hub\llm-station-hub.db`.
- SQLite runs with WAL mode and foreign keys enabled.
- Default account passwords are encrypted with a local application secret before being written to the database.
- The secondary password is stored as a salted hash. Plain text is never stored.
- L-Site login records do not store usernames or passwords. They only mark the entry and quota state.
- Session logs are kept in memory only and are cleared when the app restarts.

## Requirements

- Windows 10/11
- Go 1.25+
- Node.js 20+, Node.js 22 recommended
- Wails CLI v2.12+
- WebView2 Runtime

## Installation and Development

1. Install the Wails CLI.

   ```shell
   go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0
   ```

2. Clone the repository and install frontend dependencies.

   ```shell
   git clone https://github.com/diary-OvO/llm-station-hub.git
   cd llm-station-hub
   cd frontend && npm install && cd ..
   ```

3. Start the development environment.

   ```shell
   wails dev
   ```

4. Build the Windows executable.

   ```shell
   wails build
   ```

Build output:

```text
build/bin/llm-station-hub.exe
```

## Automated Release

The project includes a GitHub Actions tag release workflow:

```text
.github/workflows/release.yml
```

Pushing a tag that matches `v*.*.*` builds the Windows package and creates or updates the GitHub Release.

```shell
git tag v0.1.0
git push origin v0.1.0
```

## Workflow

1. Create a site with name, URL, type, check-in flag, notes, and tags.
2. Add one or more account records to the site and mark whether each account still has quota.
3. Set a secondary password before storing default account passwords. Enter it again when revealing a password.
4. Use filters to find sites by keyword, type, tag, check-in flag, or archive state.
5. Archive sites that are empty or no longer used while keeping their records.
6. Open the log window to inspect operation status and errors from the current session.

## Tech Stack

- Wails v2
- Go
- React
- TypeScript
- Vite
- SQLite

## Current Status

- Site, account, tag, and secondary password management are available.
- Active, empty-quota, and archived site grouping is available.
- Simplified Chinese / English switching and light / dark themes are available.
- Windows tag release automation is available.
- Data is currently local-only in SQLite. Cloud sync is not available.
