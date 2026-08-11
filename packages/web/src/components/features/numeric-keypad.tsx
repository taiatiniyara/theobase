interface NumericKeypadProps {
  onNumber: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onEnter: () => void;
}

export function NumericKeypad({ onNumber, onDecimal, onBackspace, onEnter }: NumericKeypadProps) {
  function vibrate() {
    try { navigator.vibrate?.(10); } catch {/* noop */}
  }

  function handleNumber(digit: string) { vibrate(); onNumber(digit); }
  function handleDecimal() { vibrate(); onDecimal(); }
  function handleBackspace() { vibrate(); onBackspace(); }
  function handleEnter() { vibrate(); onEnter(); }

  const keyClass = "flex h-14 w-14 items-center justify-center rounded-md bg-white text-2xl font-semibold text-neutral-900 select-none active:scale-95 transition-all duration-100 dark:bg-neutral-700 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-600 touch-target-min";

  return (
    <div className="space-y-2 rounded-t-lg bg-neutral-100 p-4 dark:bg-neutral-800">
      <div className="grid grid-cols-3 gap-2">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} type="button" className={keyClass} onClick={() => handleNumber(d)}>{d}</button>
        ))}
        <button type="button" className={keyClass} onClick={handleDecimal}>.</button>
        <button type="button" className={keyClass} onClick={() => handleNumber('0')}>0</button>
        <button type="button" className={keyClass} onClick={handleBackspace} aria-label="Backspace">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l3.586 3.586a2 2 0 001.414.586H18a2 2 0 002-2v-4a2 2 0 00-2-2H8a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>
      <button type="button" className="flex h-14 w-full items-center justify-center rounded-md bg-brand-600 text-lg font-semibold text-white hover:bg-brand-700 active:bg-brand-800 dark:hover:bg-brand-500" onClick={handleEnter}>
        Enter
      </button>
    </div>
  );
}
