# Accessibility Checklist — WCAG 2.2 AA

## Automated (PR Gate)
- [ ] `eslint-plugin-jsx-a11y` runs in CI lint stage (blocking)
- [ ] All interactive elements have accessible names
- [ ] All images have alt attributes
- [ ] Form inputs have associated labels
- [ ] Color contrast meets 4.5:1 minimum
- [ ] `@axe-core/playwright` on critical flows: login → members → counting room → commit

## Manual (Release Gate)
### Screen Reader
- [ ] VoiceOver + Safari: navigate dashboard, members, counting room
- [ ] NVDA + Firefox: complete batch entry and commit flow
- [ ] TalkBack + Android: member directory, add member, edit member

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Focus order follows visual layout
- [ ] No keyboard traps
- [ ] Skip-to-content link present
- [ ] Focus rings visible (2px offset, brand-600)

### Visual
- [ ] 200% zoom: all content visible, no horizontal scroll at 320px width
- [ ] High contrast mode: text legible, borders visible
- [ ] Reduced motion: animations disabled or instant
- [ ] Minimum 48×48px touch targets for mobile

### Focus Management
- [ ] Modal dialogs trap focus
- [ ] Closing modal returns focus to trigger
- [ ] Dynamic content updates announced to screen reader
