# Square Preorder Bot

Playwright automation that runs weekly via GitHub Actions to restock inventory and update preorder pickup dates in the Square Dashboard.

---

## What It Does

Every Monday at 06:00 UTC the bot:

1. Opens the **Take & Bake Pizza** item page on Square
2. Resets the stock **quantity to 100**
3. Sets the **pickup date range** to next Wednesday → Saturday
4. Sets the **order cutoff date** to this Saturday
5. Saves the changes

### Weekly Timeline

| Field | Value | Example (bot runs Mon Feb 23) |
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

### 1. Add the session secret

Base64-encode the storage state:

**macOS / Linux**

```bash
base64 -w 0 storageState.json | pbcopy
```

**Windows (PowerShell)**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("storageState.json")) | Set-Clipboard
```

Then in your GitHub repo go to **Settings → Secrets and variables → Actions → New repository secret** and create:

| Name | Value |
|------|-------|
| `SQUARE_STORAGE_STATE_B64` | *(paste the base64 string)* |

### 2. Workflow

The workflow at `.github/workflows/weekly.yml` runs every Monday at 06:00 UTC and can also be triggered manually from the Actions tab.

If the session expires (Square redirects to the login page), re-run `npm run login` locally and update the secret.

---

## Project Structure

| File | Purpose |
|------|---------|
| `src/dateUtils.js` | Computes next Saturday (cutoff) and following Wed–Sat (pickup) |
| `src/run.js` | Loads session, navigates to item page, orchestrates the update |
| `src/square.js` | All UI interaction logic (quantity, dates, calendar, save) |
| `src/login.js` | Opens browser for manual login, auto-saves session on dashboard |
| `.github/workflows/weekly.yml` | Scheduled GitHub Actions workflow |
