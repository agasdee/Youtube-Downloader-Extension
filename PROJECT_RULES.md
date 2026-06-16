# Dubplitube Project Rules (Golden Rules)

This file contains critical instructions for any developer or AI assistant working on this codebase.

## 1. Chrome Extension Naming Restrictions (CRITICAL)
- Chrome Extensions **STRICTLY FORBID** any files or folders starting with an underscore (`_`) in the project directory, with the sole exception of the official `_locales` directory.
- **NEVER** generate, keep, or allow folders like `__pycache__` to exist inside the extension directory. If they exist, Chrome will refuse to load the extension with the error: "Filenames starting with '_' are reserved for use by the system."

## 2. Python Backend Cache Prevention
- To comply with the rule above, the Python companion server (`companion_server.py`) must ALWAYS disable bytecode compilation.
- This is already implemented in code via `os.environ["PYTHONDONTWRITEBYTECODE"] = "1"` at the top of the file. Do not remove this.
- If running the server manually via command line, always use the `-B` flag: `python -B companion_server.py`.

## 3. Anti-Ban Measures
- YouTube bot detection is strict. Always ensure `yt-dlp` utilizes `sleep_interval_requests` and impersonates mobile clients (e.g., `player_client=android`) to avoid HTTP 429 Too Many Requests or IP bans.

## 4. UI/UX Aesthetics
- Maintain a premium, modern "Neon Dark Mode" / "Glassmorphism" design.
- Keep the interface clean and responsive without requiring full page reloads.
