# Square Preorder Bot

Playwright automation that runs weekly via GitHub Actions to restock inventory and update preorder pickup dates in the Square Dashboard.

---

## What It Does

Every Saturday at 7 PM Edmonton time the bot:

> **Time change note:** GitHub Actions cron runs in UTC and does not adjust for daylight saving time. The workflow is set to `01:00 UTC Sunday`, which equals **7 PM MDT** (UTC−6, Mar–Nov). During standard time (MST, UTC−7, Nov–Mar) the bot fires at **6 PM** instead. Update the cron to `0 2 * * 0` each November and revert to `0 1 * * 0` each March if the exact 7 PM trigger matters.

1. Opens the **Take & Bake Pizza** item page on Square
2. Resets the stock **quantity to 100**
3. Sets the **pickup date range** to next Wednesday → Saturday
4. Sets the **order cutoff date** to this Saturday
5. Saves the changes
6. Refreshes the session secret so it stays valid for next week

### Weekly Timeline

| Field | Value | Example (bot runs Sat Feb 21) |
|-------|-------|-------------------------------|
| Order cutoff | Next Saturday | Feb 28 |
| Pickup start | Cutoff + 4 days (Wed) | Mar 4 |
| Pickup end | Cutoff + 7 days (Sat) | Mar 7 |

---

## Local Setup

### 1. Install dependencies

```bash
npm install
npx playwright install --with-deps chromium
```

### 2. Log in and save your session

```bash
npm run login
```

A browser window opens to `https://squareup.com/login`.
Log in manually (including any 2FA). Once you reach the Square Dashboard the session is saved automatically to `storageState.json`.

### 3. Test locally

```bash
npm start
```

The script computes the dates, restocks inventory, and updates preorder settings.
On failure it saves `failure.png` and exits with a non-zero code.

---

## GitHub Actions Setup

You need **two** secrets:

### 1. `SQUARE_STORAGE_STATE_B64` — the authenticated session

Base64-encode the storage state:

**macOS / Linux**

```bash
base64 -w 0 storageState.json | pbcopy
```

**Windows (PowerShell)**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("storageState.json")) | Set-Clipboard
```

Create the secret: **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|-------|
| `SQUARE_STORAGE_STATE_B64` | *(paste the base64 string)* |

### 2. `GH_PAT` — a Personal Access Token for session refresh

After each successful run the bot saves the refreshed cookies back to the `SQUARE_STORAGE_STATE_B64` secret. This requires a GitHub PAT with **repo** scope (specifically `secrets` write access).

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Generate a new token with the **repo** scope
3. Add it as a repository secret named `GH_PAT`

This keeps the Square session alive automatically — you only need to manually re-login if Square forces a full re-authentication.

### 3. Trigger a test run

After pushing, go to the **Actions** tab, find "Weekly Preorder Update", and click **Run workflow** to verify everything works.

---

## Session Maintenance

The bot auto-refreshes the session secret after each successful run, which extends its lifetime. If the session eventually expires (Square redirects to the login page), the bot will fail and you need to:

1. Run `npm run login` locally
2. Log in again
3. Re-encode and update `SQUARE_STORAGE_STATE_B64`

---

## Project Structure

| File | Purpose |
|------|---------|
| `src/dateUtils.js` | Computes next Saturday (cutoff) and following Wed–Sat (pickup) |
| `src/run.js` | Loads session, navigates to item page, orchestrates the update |
| `src/square.js` | All UI interaction logic (quantity, dates, calendar, save) |
| `src/login.js` | Opens browser for manual login, auto-saves session on dashboard |
| `.github/workflows/weekly.yml` | Scheduled GitHub Actions workflow (Saturday 7 PM Edmonton) |
