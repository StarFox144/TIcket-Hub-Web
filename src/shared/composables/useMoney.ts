const formatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });

/** 1240 → «1 240 ₴» */
export function formatMoney(amount: number) {
  return `${formatter.format(amount)} ₴`;
}

/** 180 → «180 гривень» — для aria-label. */
export function moneyForSpeech(amount: number) {
  const n = Math.abs(amount) % 100;
  const last = n % 10;
  let word = 'гривень';
  if (n < 11 || n > 14) {
    if (last === 1) word = 'гривня';
    else if (last >= 2 && last <= 4) word = 'гривні';
  }
  return `${amount} ${word}`;
}

export function useMoney() {
  return { formatMoney, moneyForSpeech };
}
