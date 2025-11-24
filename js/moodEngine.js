// moodEngine.js
// Pure logic for mapping UI inputs to a worldState that drives visuals + audio.

export const TAG_PRESETS = [
  { label: 'Calm', level: 45, weather: 'cloudy', description: 'Calm day, muted colors and soft sky.' },
  { label: 'Happy', level: 70, weather: 'sunny', description: 'Bright beams and a cheerful villa vibe.' },
  { label: 'Tired', level: 40, weather: 'cloudy', description: 'Dim lights, steady drizzle energy.' },
  { label: 'Stressed', level: 30, weather: 'rain', description: 'Tight deadlines, rain-tapped roof.' },
  { label: 'Burnout', level: 20, weather: 'storm', description: 'Dark clouds, messy ground, thunder looming.' },
  { label: 'Overthinking', level: 35, weather: 'rain', description: 'Rainy loops and flickering street light.' },
  { label: 'Chill Sunday', level: 55, weather: 'sunny', description: 'Cozy house, soft breeze, brunch incoming.' },
  { label: 'Party Mode', level: 85, weather: 'night', description: 'Neon glow, villa lights, pool ready.' },
  { label: 'Storm Season', level: 30, weather: 'storm', description: 'Lightning flashes and drenched wood.' },
  { label: 'Soft Life', level: 75, weather: 'sunny', description: 'Upgraded villa, lazy palm shade.' },
  { label: 'Lottery Winner', level: 95, weather: 'sunny', description: 'Maxed-out villa and shimmering pool.' },
];

export const DEFAULT_STATE = {
  lifeLevel: 50,
  houseTier: 2,
  weather: 'sunny',
  description: 'Balanced vibes, cozy home, mild breeze.',
  tag: 'Calm',
};

// Translate numeric slider into house tiers.
export function applySlider(value, currentState = DEFAULT_STATE) {
  const level = clamp(value, 0, 100);
  const tier = level <= 33 ? 1 : level <= 66 ? 2 : 3;
  return {
    ...currentState,
    lifeLevel: level,
    houseTier: tier,
    description: describeState(tier, currentState.weather),
  };
}

// Apply mood tag preset.
export function applyTag(tagLabel, currentState = DEFAULT_STATE) {
  const preset = TAG_PRESETS.find((t) => t.label === tagLabel) || TAG_PRESETS[0];
  const tier = preset.level <= 33 ? 1 : preset.level <= 66 ? 2 : 3;
  return {
    ...currentState,
    lifeLevel: preset.level,
    houseTier: tier,
    weather: preset.weather,
    description: preset.description,
    tag: preset.label,
  };
}

// Interpret free text using simple rule-based scanning.
export function interpretText(input, currentState = DEFAULT_STATE) {
  const text = input.toLowerCase();
  let level = 50;
  let weather = 'sunny';
  const notes = [];

  const includes = (words) => words.some((w) => text.includes(w));

  if (includes(['rich', 'villa', 'luxury', 'upgrade', 'jackpot', 'winner'])) {
    level = 85;
    weather = 'sunny';
    notes.push('Feeling upgrade energy.');
  }

  if (includes(['party', 'celebrate', 'night'])) {
    weather = 'night';
    level = Math.max(level, 80);
    notes.push('Lights go neon.');
  }

  if (includes(['tired', 'burnout', 'exhausted', 'anxious', 'stressed'])) {
    level = Math.min(level, 40);
    weather = weather === 'sunny' ? 'cloudy' : weather;
    notes.push('Energy low, clouds heavy.');
  }

  if (includes(['storm', 'thunder', 'lightning'])) {
    weather = 'storm';
    level = Math.min(level, 35);
    notes.push('Storm warnings engaged.');
  }

  if (includes(['rain', 'drizzle', 'wet'])) {
    weather = 'rain';
    level = Math.min(level, 45);
    notes.push('Grey drizzle incoming.');
  }

  if (includes(['snow', 'winter', 'cold'])) {
    weather = 'snow';
    level = Math.max(level, 50);
    notes.push('Blue chill floating in.');
  }

  if (includes(['chill', 'cozy', 'comfy', 'calm', 'lazy'])) {
    level = Math.max(level, 55);
    weather = weather === 'storm' ? weather : 'cloudy';
    notes.push('Cozy pace, steady rhythm.');
  }

  if (includes(['hopeful', 'dream', 'palm', 'pool'])) {
    level = Math.max(level, 70);
    weather = weather === 'night' ? weather : 'sunny';
    notes.push('Dreaming of pools and palms.');
  }

  const tier = level <= 33 ? 1 : level <= 66 ? 2 : 3;
  const summary = buildSummary(tier, weather, notes);

  return {
    ...currentState,
    lifeLevel: clamp(Math.round(level), 0, 100),
    houseTier: tier,
    weather,
    description: summary,
    tag: 'Custom vibe',
  };
}

function describeState(tier, weather) {
  const tierText = {
    1: 'Stacked shacks, gritty but alive.',
    2: 'Cozy stable home, mail on the porch.',
    3: 'Soft-life villa, pool shimmering.',
  }[tier];

  const weatherText = {
    sunny: 'Sun-washed horizon.',
    cloudy: 'Muted clouds drifting.',
    rain: 'Gentle rain tapping.',
    storm: 'Thunder stalking the skyline.',
    snow: 'Soft snow hushes everything.',
    night: 'Night neon hum.',
  }[weather];

  return `${tierText} ${weatherText}`;
}

function buildSummary(tier, weather, notes) {
  const base = describeState(tier, weather);
  const extra = notes.length ? ` ${notes.join(' ')}` : '';
  return `${base}${extra}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
