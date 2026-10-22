// Фейкові фільми, кінотеатри й розклад для роботи без бекенду.
// Назви вигадані; постери — градієнтні плейсхолдери.
import type { CinemaEvent, EventSeat, Format, Hall, HallLayout, Movie, SeatZone, Venue } from '../types';

export const movies: Movie[] = [
  {
    slug: 'misto-bez-svitla',
    title: 'Місто без світла',
    genres: ['Фантастика', 'Екшн'],
    ageRating: '13+',
    durationMin: 142,
    rating: 8.4,
    palette: ['#3a0a12', '#c8102e'],
    description:
      'Коли мегаполіс занурюється в темряву на тридцять днів, інженерка енергомережі мусить пройти крізь хаос міста, щоб увімкнути світло — і з’ясувати, хто його вимкнув.',
  },
  {
    slug: 'ostannia-zmina',
    title: 'Остання зміна',
    genres: ['Трилер', 'Драма'],
    ageRating: '16+',
    durationMin: 118,
    rating: 7.9,
    palette: ['#1b1b2f', '#6b2737'],
    description:
      'Нічна медсестра помічає, що пацієнти з однієї палати зникають з реєстру ще до ранку. До кінця зміни — шість годин.',
  },
  {
    slug: 'viter-nad-karpatamy',
    title: 'Вітер над Карпатами',
    genres: ['Пригоди', 'Сімейний'],
    ageRating: '6+',
    durationMin: 104,
    rating: 8.1,
    palette: ['#0f2a24', '#b08d3c'],
    description: 'Двоє братів вирушають у гори на пошуки дідового планера й знаходять те, що шукали зовсім інші люди.',
  },
  {
    slug: 'kit-shcho-vmiv-litaty',
    title: 'Кіт, що вмів літати',
    genres: ['Анімація', 'Комедія'],
    ageRating: '0+',
    durationMin: 92,
    rating: 8.7,
    palette: ['#2b1a3d', '#e07a3c'],
    description:
      'Рудий кіт Марципан переконаний, що вміє літати. Залишилось переконати в цьому решту світу — і гравітацію.',
  },
  {
    slug: 'kod-poliarnoi-zori',
    title: 'Код Полярної зорі',
    genres: ['Фантастика', 'Трилер'],
    ageRating: '13+',
    durationMin: 131,
    rating: 7.6,
    palette: ['#0b1a33', '#4c6fb3'],
    description:
      'Дослідницька станція за полярним колом отримує сигнал, який повторює їхні власні розмови — із запізненням у три дні.',
  },
  {
    slug: 'tysha-pislia-hrozy',
    title: 'Тиша після грози',
    genres: ['Драма'],
    ageRating: '16+',
    durationMin: 126,
    rating: 8.2,
    palette: ['#24201c', '#8a6f4d'],
    description:
      'Скрипалька повертається до рідного містечка на Поділлі, щоб продати батьківський будинок, і застрягає там на ціле літо.',
  },
  {
    slug: 'vesillia-v-odesi',
    title: 'Весілля в Одесі',
    genres: ['Комедія', 'Мелодрама'],
    ageRating: '12+',
    durationMin: 99,
    rating: 7.3,
    palette: ['#3d0f1f', '#d4af37'],
    description: 'Три родини, одна наречена, два наречені й жодного шансу, що все пройде за планом.',
  },
  {
    slug: 'shepit-hlybyny',
    title: 'Шепіт глибини',
    genres: ['Жахи'],
    ageRating: '18+',
    durationMin: 108,
    rating: 6.9,
    palette: ['#081614', '#2f5d55'],
    description: 'Екіпаж глибоководного батискафа чує голоси з-за обшивки. На глибині чотири кілометри.',
  },
];

/** Фільми, що виходять пізніше — для розділу «Скоро». */
export const upcomingMovies: Movie[] = [
  {
    slug: 'zolota-dolyna',
    title: 'Золота долина',
    genres: ['Вестерн', 'Драма'],
    ageRating: '16+',
    durationMin: 137,
    palette: ['#2a1708', '#d4af37'],
    description: 'Степ, спека і скарб, через який посварилися три покоління однієї родини.',
  },
  {
    slug: 'zirkovyi-ekspres',
    title: 'Зірковий експрес',
    genres: ['Анімація', 'Пригоди'],
    ageRating: '0+',
    durationMin: 95,
    palette: ['#120c2e', '#c8102e'],
    description: 'Потяг, що їздить між сузір’ями, і провідниця, яка вперше вийшла на маршрут.',
  },
  {
    slug: 'pryvyd-opernoho',
    title: 'Привид Оперного',
    genres: ['Містика', 'Мюзикл'],
    ageRating: '12+',
    durationMin: 128,
    palette: ['#1a0509', '#7a0a1c'],
    description: 'Перед прем’єрою в старому театрі зникає партитура, а на сцені хтось співає ночами.',
  },
];

export const venues: Venue[] = [
  { id: 'kyiv-center', name: 'TicketHub Хрещатик', city: 'Київ', address: 'вул. Хрещатик, 22' },
  { id: 'kyiv-left', name: 'TicketHub Лівобережна', city: 'Київ', address: 'просп. Броварський, 17' },
  { id: 'lviv', name: 'TicketHub Площа Ринок', city: 'Львів', address: 'пл. Ринок, 9' },
  { id: 'odesa', name: 'TicketHub Дерибасівська', city: 'Одеса', address: 'вул. Дерибасівська, 14' },
];

export const halls: Hall[] = [
  { id: 'h1', name: 'Зал 1', format: '2D' },
  { id: 'h2', name: 'Зал 2', format: '3D' },
  { id: 'imax', name: 'IMAX', format: 'IMAX' },
];

const BASE_PRICES: Record<SeatZone, number> = { STANDARD: 180, COMFORT: 240, LOVE: 420 };
const FORMAT_SURCHARGE: Record<Format, number> = { '2D': 0, '3D': 40, IMAX: 80 };

export function seatPrice(zone: SeatZone, format: Format) {
  const extra = FORMAT_SURCHARGE[format] * (zone === 'LOVE' ? 2 : 1);
  return BASE_PRICES[zone] + extra;
}

// --- детермінований генератор ---------------------------------------------

export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function dayKey(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${mm}${dd}`;
}

/** Розклад на 7 днів уперед для всіх кінотеатрів. */
export function buildSchedule(): CinemaEvent[] {
  const events: CinemaEvent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const venue of venues) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(today);
      day.setDate(today.getDate() + d);
      const key = dayKey(day);

      halls.forEach((hall, hallIndex) => {
        const rand = seededRandom(`${venue.id}-${hall.id}-${key}`);
        // IMAX крутить переважно блокбастери.
        const pool =
          hall.format === 'IMAX'
            ? [movies[0], movies[4], movies[0], movies[2]]
            : movies.filter((_, i) => (i + hallIndex) % 3 !== 0 || i % 2 === 0);
        let minutes = 10 * 60 + Math.floor(rand() * 4) * 10 + hallIndex * 20;
        let i = Math.floor(rand() * pool.length);

        while (minutes < 23 * 60) {
          const movie = pool[i % pool.length];
          const startsAt = new Date(day);
          startsAt.setMinutes(minutes);
          const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}${String(minutes % 60).padStart(2, '0')}`;
          events.push({
            id: `${venue.id}.${hall.id}.${key}.${hhmm}`,
            title: movie.title,
            startsAt: startsAt.toISOString(),
            venue,
            section: hall,
            movie,
            minPrice: seatPrice('STANDARD', hall.format),
          });
          // тривалість + реклама й прибирання, округлено до 10 хв
          minutes += Math.ceil((movie.durationMin + 25) / 10) * 10;
          i += 1 + Math.floor(rand() * 2);
        }
      });
    }

    // Допрем’єрні покази фільмів із «Скоро» — через 9–17 днів.
    upcomingMovies.forEach((movie, idx) => {
      const day = new Date(today);
      day.setDate(today.getDate() + 9 + idx * 4);
      day.setHours(19, 0, 0, 0);
      events.push({
        id: `${venue.id}.imax.${dayKey(day)}.1900-${movie.slug}`,
        title: movie.title,
        startsAt: day.toISOString(),
        venue,
        section: halls[2],
        movie,
        minPrice: seatPrice('STANDARD', 'IMAX'),
      });
    });
  }

  return events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Стандартна схема: 10 рядів × 14 місць, «Комфорт» у центрі, Love Seat в останньому ряду. */
export const DEFAULT_LAYOUT: HallLayout = {
  rows: 10,
  seatsPerRow: 14,
  comfortRows: [5, 8],
  comfortSeats: [5, 10],
  loveRow: true,
};

function zoneFor(layout: HallLayout, row: number, number: number): SeatZone {
  if (layout.loveRow && row === layout.rows) return 'LOVE';
  const [r1, r2] = layout.comfortRows ?? [0, -1];
  const [s1, s2] = layout.comfortSeats;
  if (row >= r1 && row <= r2 && number >= s1 && number <= s2) return 'COMFORT';
  return 'STANDARD';
}

export function buildSeats(event: CinemaEvent, layout: HallLayout = DEFAULT_LAYOUT): EventSeat[] {
  const rand = seededRandom(event.id);
  // нові сеанси організатора стартують порожніми
  const occupancy = event.id.startsWith('custom-') ? 0 : 0.15 + rand() * 0.35;
  const seats: EventSeat[] = [];

  for (let row = 1; row <= layout.rows; row++) {
    const love = layout.loveRow && row === layout.rows;
    // Love Seat займає два звичайні місця, тож в останньому ряду їх удвічі менше.
    const count = love ? Math.floor(layout.seatsPerRow / 2) : layout.seatsPerRow;
    for (let number = 1; number <= count; number++) {
      const zone = love ? 'LOVE' : zoneFor(layout, row, number);
      // центральні ряди продаються краще
      const bias = row >= 4 && row <= layout.rows - 2 ? 1.3 : 0.8;
      const roll = rand();
      const taken = roll < occupancy * bias;
      seats.push({
        id: `${event.id}:${row}-${number}`,
        section: event.section.name,
        row,
        number,
        zone,
        price: seatPrice(zone, event.section.format),
        status: taken ? (roll < occupancy * 0.15 ? 'RESERVED' : 'SOLD') : 'FREE',
      });
    }
  }
  return seats;
}
