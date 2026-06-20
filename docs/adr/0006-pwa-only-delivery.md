# PWA-only delivery

## Status: Accepted

Theobase is delivered exclusively as a Progressive Web Application — no iOS App
Store or Google Play deployment. Users visit the church's URL and add the app to
their home screen.

**Why:** Native apps require per-platform builds (Swift + Kotlin), app store
review cycles, and user downloads over potentially expensive/slow mobile data.
In developing regions where Theobase is most needed, entry-level Android phones
have limited storage — a native app competes for space with WhatsApp. A PWA
installs in kilobytes, updates silently via Service Worker, and runs on any
device with a modern browser. All notifications are delivered via email + WebSocket
in-app toasts, sidestepping the iOS PWA push-notification gap entirely.
The Service Worker includes web-push event handlers as an optional enhancement
for browsers that support the Push API (desktop Chrome, etc.).

**Consequences:** No access to platform-native APIs (Bluetooth, advanced camera
controls). The Tithe Envelope Camera Assistant and receipt uploads use the
standard `<input type="file" capture>` API, which is sufficient for photo
capture. Deep offline storage is limited by browser quotas (IndexedDB), not the
device filesystem.

**Rejected:** Native iOS + Android apps (fragmented codebase, app store
friction, storage competition). Capacitor/Tauri wrappers around the PWA (adds
build complexity without meaningful benefit given the email-backed notification
strategy).
