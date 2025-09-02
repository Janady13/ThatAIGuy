ThatAIGuy.org Donation Platform
================================

Modern, lightweight Flask app serving a polished donation page with Venmo, Cash App, and Stripe links, plus a simple admin view.

Quick Start
-----------
- Requirements: Python 3.10+ and `venv`.
- Setup:
  - `cd /Volumes/Omnicron/donation_platform`
  - `python3 -m venv venv && source venv/bin/activate`
  - `pip install flask gunicorn`
- Configure donation links:
  - Preferred: manage `/Volumes/Omnicron/env/payments.env` with:
    - `STRIPE_PAYMENT_LINK=https://buy.stripe.com/your_link`
    - `VENMO_URL=https://venmo.com/u/YourName`
    - `CASHAPP_URL=https://cash.app/$YourName`
  - The launcher auto-syncs these into `static/config.json` on start.
  - Alternatively, edit `static/config.json` manually with any of:
    - `venmoUrl` or `venmoHandle`
    - `cashAppUrl` or `cashAppHandle`
    - `stripeUrl` or `stripePaymentLink`
- Run:
  - `bash launch_donation_platform.sh`
  - App serves on `http://<host>:55888/`

Project Structure
-----------------
- `server.py` — Minimal Flask server serving `static/`.
- `static/index.html` — Visually rich landing page.
- `static/backend.html` — Admin dashboard with guidance.
- `static/config.json` — Generated from env on start; can be edited manually.
- `static/css/theme.css` — Shared styles for a cohesive look.
- `launch_donation_platform.sh` — Gunicorn launcher with port cleanup.

Updating Donation Links
-----------------------
Edit `static/config.json` then refresh the page:

```
{
  "venmoHandle": "YOUR_VENMO_HANDLE",
  "cashAppHandle": "$YOUR_CASHAPP_HANDLE"
}
```

The UI normalizes `@` and `$` automatically.

macOS Auto‑Start (LaunchAgent)
------------------------------
You can run this at login via a LaunchAgent.

1) Create the agent file (already included in this repo):
   - `org.thataiguy.donation_platform.plist`
   - Update `ProgramArguments` path if you move the project.

2) Install and load:
```
mkdir -p ~/Library/LaunchAgents
cp org.thataiguy.donation_platform.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/org.thataiguy.donation_platform.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/org.thataiguy.donation_platform.plist
launchctl start org.thataiguy.donation_platform
```

3) Logs:
- Stdout: `~/Library/Logs/donation_platform.out.log`
- Stderr: `~/Library/Logs/donation_platform.err.log`

Troubleshooting
---------------
- Port busy: script auto‑kills anything on `55888`.
- Missing venv: create and install deps as above.
- 404 for config.json: ensure `static/config.json` exists and is readable.

Development Notes
-----------------
- HTML/CSS are static; safe to edit live.
- For deeper customization, tweak `theme.css` and the inline styles in `index.html`/`backend.html`.
