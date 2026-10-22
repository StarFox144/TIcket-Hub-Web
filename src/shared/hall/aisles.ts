/**
 * Проходи ділять ряд на три блоки: бічні — приблизно по 2/7 ширини, решта — центр.
 * Ширина бічного блоку парна, щоб Love Seat (диван на два місця) не перетинав прохід.
 * Для залу 14 місць → проходи після 4-го і 10-го.
 */
export function aislesFor(width: number): number[] {
  if (width < 9) return [];
  const side = 2 * Math.round(width / 7);
  return [side, width - side];
}
