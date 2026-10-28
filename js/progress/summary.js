// Progress rules and the owner's summary (see SPEC-progress.md, "Rules"). No DOM access.

/** Share of right answers needed in a full round for a lesson to count as practiced. */
export const PRACTICED_RATIO = 0.75;

/**
 * The question as shown in lists. For reorder, the instruction alone is the same for
 * every exercise, so the words are added in alphabetical order (never the answer's order).
 */
export function questionOf(exercise) {
  if (exercise.type === 'true-false') return exercise.statement;
  if (exercise.type === 'fill-blank') return exercise.sentence;
  if (exercise.type === 'reorder') {
    const words = [...exercise.words].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    return words.join(' · ');
  }
  return exercise.prompt;
}

/** The right answer as text. */
export function expectedOf(exercise) {
  switch (exercise.type) {
    case 'choice': return exercise.options[exercise.answer];
    case 'true-false': return String(exercise.answer);
    case 'fill-blank': return exercise.answers[0];
    case 'reorder': return exercise.words.join(' ');
    default: return '';
  }
}

/** Lesson ids in the order of the learning path. */
function lessonOrder(course) {
  return course.path.levels.flatMap((level) => level.units.flatMap((unit) => unit.lessons));
}

/**
 * Applies the progress rules to the server summary.
 *
 * @param {{ rounds: object[], exercises: object[] }} summary - From GET /progress/summary.
 * @param {{ path: object, lessons: Record<string, object> }} course - The loaded content.
 */
export function computeProgress(summary, course) {
  const lessons = lessonOrder(course).map((id) => {
    const lesson = course.lessons[id];
    const total = lesson.exercises.length;
    const full = summary.rounds.filter((item) => item.lessonId === id && item.answered === total);
    const best = full.length > 0 ? Math.max(...full.map((item) => item.correct)) : null;
    const lastAt = summary.rounds.filter((item) => item.lessonId === id).map((item) => item.at).sort().at(-1) ?? null;
    return {
      id,
      title: lesson.title,
      total,
      best,
      fullRounds: full.length,
      practiced: full.some((item) => item.correct / total >= PRACTICED_RATIO),
      lastAt,
    };
  });

  // Para revisar follows the course order: lesson by lesson, then exercise by exercise.
  const order = lessonOrder(course);
  const review = summary.exercises
    .filter((stats) => !stats.lastCorrect)
    .map((stats) => {
      const lesson = course.lessons[stats.lessonId];
      const index = lesson ? lesson.exercises.findIndex((item) => item.id === stats.exerciseId) : -1;
      if (index < 0) return null;
      const exercise = lesson.exercises[index];
      return { lesson, exercise, stats, question: questionOf(exercise), expected: expectedOf(exercise), rank: [order.indexOf(lesson.id), index] };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1]);

  return {
    lessons,
    practicedCount: lessons.filter((lesson) => lesson.practiced).length,
    totalLessons: lessons.length,
    review,
  };
}

/**
 * Builds the plain-text summary the owner pastes to Claude to adapt the next lessons.
 * Written in English, like the rest of the project's working documents.
 */
export function buildOwnerSummary(summary, course, now = new Date()) {
  const progress = computeProgress(summary, course);
  const lines = [
    `Bora! progress summary (${now.toISOString().slice(0, 10)})`,
    `Lessons practiced: ${progress.practicedCount} of ${progress.totalLessons} (full round with at least ${Math.round(PRACTICED_RATIO * 100)}% right)`,
    '',
    'Per lesson:',
  ];

  const started = progress.lessons.filter((lesson) => lesson.lastAt);
  if (started.length === 0) lines.push('- No exercises done yet.');
  for (const lesson of started) {
    const best = lesson.best === null ? 'no full round' : `best ${lesson.best}/${lesson.total}`;
    const state = lesson.practiced ? ', practiced' : '';
    lines.push(`- ${lesson.id} (${lesson.title}): ${best}, ${lesson.fullRounds} full round(s)${state}, last ${lesson.lastAt.slice(0, 10)}`);
  }

  const missed = summary.exercises
    .filter((stats) => stats.wrong > 0)
    .map((stats) => ({ stats, exercise: course.lessons[stats.lessonId]?.exercises.find((item) => item.id === stats.exerciseId) }))
    .filter((item) => item.exercise)
    .sort((a, b) => b.stats.wrong - a.stats.wrong || b.stats.wrong / b.stats.attempts - a.stats.wrong / a.stats.attempts)
    .slice(0, 15);

  lines.push('', 'Most missed exercises:');
  if (missed.length === 0) lines.push('- None yet.');
  for (const { stats, exercise } of missed) {
    const last = stats.lastWrongResponse ? `, last wrong answer "${stats.lastWrongResponse}"` : '';
    lines.push(`- ${stats.lessonId}#${exercise.id} (${exercise.type}): "${questionOf(exercise)}" expected "${expectedOf(exercise)}", wrong ${stats.wrong} of ${stats.attempts}${last}`);
  }

  lines.push('', `To review now: ${progress.review.length} exercise(s) whose last answer was wrong.`);
  return lines.join('\n');
}
