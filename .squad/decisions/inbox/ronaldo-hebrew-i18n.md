# Ronaldo: Hebrew i18n + RTL

- Updated `frontend/index.html` to set `lang="he"` and `dir="rtl"` on the root `<html>` element.
- Translated all user-visible strings in `frontend/src/App.jsx` to Hebrew.
- Added `translateStatus(status)` so match status logic stays in English while the UI displays Hebrew labels.
- Switched match time formatting to the `he-IL` locale.
- Added `dir="rtl"` to the App root container for RTL layout safety.
- Verified the frontend compiles successfully with `npm run build`.
