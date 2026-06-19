# 009 — Tithe Envelope Camera Assistant

## What to build

A treasurer points their phone camera at a physical tithe envelope with handwritten amounts. The app uses on-device OCR to read the handwritten lines and pre-fills the fund split form. The treasurer confirms or corrects, then the receipt is recorded as if uploaded normally.

## Acceptance criteria

- [ ] Camera capture: `<input type="file" capture="environment">` to open device camera
- [ ] Client-side OCR: crop/enhance → extract handwritten text lines (tithe: $X, budget: $Y, etc.)
- [ ] Pre-fill fund split form from OCR results
- [ ] Manual correction: treasurer can override any misread amount before submission
- [ ] Submission reuses the existing receipt upload flow from Slice 004
- [ ] Test: capture image of handwritten envelope → OCR extracts amounts → treasurer confirms → receipt created
- [ ] Test: partial OCR (some lines unreadable) → treasurer fills gaps manually → submission succeeds

## Blocked by

- 004 — Digital Receipt Registry
- 008 — Offline Foundation
