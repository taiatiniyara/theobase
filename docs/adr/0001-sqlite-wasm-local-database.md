# SQLite via WASM for local (offline) database

The PWA's offline database uses SQLite compiled to WebAssembly, not IndexedDB. D1 is SQLite in the cloud; keeping the same SQL engine and schema on both sides eliminates a translation layer. The trade-off is a ~1MB WASM payload, accepted in exchange for relational integrity, identical schemas, and simpler sync.
