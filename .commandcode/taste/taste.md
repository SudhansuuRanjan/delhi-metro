# Taste

- Prefers a batch data-sync architecture over on-demand API calls: fetch live data from external APIs on a scheduled cron job (e.g., every 4 hours), save it locally (files/DB), and have the app read and compute entirely from the saved data — no live endpoint calls inside the app at request time. Confidence: 0.95
- Prefers SQLite as the local data store for synced/persisted app data (chose SQLite over JSON files and cloud KV/Redis when asked where synced data should live). Confidence: 0.9
- Prefers searchable dropdowns (e.g., station pickers) to be backed by the full dataset, not a paginated/limited slice — a client-side search that only sees the first N records is a bug, since users can't find valid entries that sort beyond the limit. Confidence: 0.7
- Prefers derived display data (e.g., interchange flags, other lines serving a station, line names/colors) to be enriched once at the API/data layer and consumed by all pages, rather than duplicating lookups or hardcoding in each client component. Confidence: 0.7
- Communicates with terse, imperative one-liners plus a screenshot (e.g., "fix this page ui", "fix the arrow direction", "on the station page show more info and facilities") and expects the agent to self-diagnose the specific problems from the image rather than asking clarifying questions. Confidence: 0.85
