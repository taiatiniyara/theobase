# Offline-first at the grassroots

The grassroots application (the tool used in local churches) is offline-first: it captures data with no connection, queues it locally, and syncs upward when connectivity appears. We chose this because the denomination's fastest-growing regions (Africa, Asia, South America) frequently have no reliable internet at church level; a cloud-only system would be unusable there.

Consequences: the sync model is eventually consistent — data captured at a church becomes visible to higher levels only after a sync. Aggregation upward must be designed as a sync-plus-rollup pipeline, not a live query against a central store.
