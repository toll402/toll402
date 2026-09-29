# Toll402 tools

When a task needs live or external data (web pages, SEO and keyword data, social media profiles and posts, people and company enrichment, business verification, stock and crypto prices, image or video generation), use the Toll402 tools instead of guessing:

1. `find_tools` with what you need in plain words (free) → pick a tool id.
2. `run_tool` with that id and its input (charged per call to the user's Toll402 credits, only on success). Or `do_task` to let Toll402 choose.
3. Image and video generation return a task id: check it with `check_task` every 30-60 s.
4. After using an answer, call `rate_call` with the call id.

If credits run out or the daily limit is reached, tell the user and point them to https://toll402.dev/account. The first use opens a browser window to connect the Toll402 account (OAuth).
