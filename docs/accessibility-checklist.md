# Accessibility Release Checklist

Complete before every major release. All items must pass.

## Setup

- [ ] Latest build deployed to staging (`staging.theobase.app`)

## 1. Screen Reader

### VoiceOver + Safari (macOS)
- [ ] Login with magic link
- [ ] Navigate member directory — all names and roles announced
- [ ] Open form to add member — all fields labeled, required fields announced
- [ ] Counting room: enter a giving amount — amount read back
- [ ] Confirm batch — confirmation announced, progress read
- [ ] Open annual statistical report — all figures announced
- [ ] Approve report — success announced

### NVDA + Firefox (Windows)
- [ ] Repeat the core flow from VoiceOver

### TalkBack + Chrome (Android)
- [ ] Repeat the core flow

## 2. Keyboard Only

- [ ] Tab through login screen — email field → send link → focus visible
- [ ] Tab through member directory — every row focusable, sortable headers operable via Enter
- [ ] Counting room: Tab through numeric keypad, Enter to input digits, Tab to confirm
- [ ] Escape closes any open modal/dialog
- [ ] Arrow keys navigate dropdown options within Select components
- [ ] No keyboard trap — Tab never gets stuck

## 3. 200% Zoom

- [ ] Set browser zoom to 200%. No content clipped or hidden.
- [ ] Member directory: horizontal scroll where needed, no overlapping columns
- [ ] Counting room: numeric keypad fully visible, amount display readable
- [ ] Form fields: labels remain associated with inputs
- [ ] Bottom nav: all tabs visible and tappable

## 4. High Contrast

- [ ] Enable system `prefers-contrast: more`. All borders visible (2px+), text meets 7:1 ratio.
- [ ] Focus rings visible and distinct from the background
- [ ] Error states distinguishable from normal state (not color-only)

## 5. Reduced Motion

- [ ] Enable system `prefers-reduced-motion: reduce`. Animations disabled or instant.
- [ ] Skeleton screens still display (static state)
- [ ] Swipe-to-undo still functional (animation replaced with instant removal)

## 6. Focus Trapping

- [ ] Open any modal. Tab cycles only within the modal.
- [ ] Close modal with Escape. Focus returns to the trigger element.
- [ ] Open bottom sheet on mobile. Focus trapped within sheet.
