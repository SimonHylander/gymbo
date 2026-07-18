const REST_DURATION_MIN_SECONDS = 30;
const REST_DURATION_MAX_SECONDS = 300;
const REST_DURATION_STEP_SECONDS = 15;

function buildRestDurationOptions(): ReadonlyArray<number> {
  const options: Array<number> = [];

  for (
    let seconds = REST_DURATION_MIN_SECONDS;
    seconds <= REST_DURATION_MAX_SECONDS;
    seconds += REST_DURATION_STEP_SECONDS
  ) {
    options.push(seconds);
  }

  return options;
}

export const REST_DURATION_OPTION_SECONDS = buildRestDurationOptions();

export function isRestDurationOption(seconds: number): boolean {
  return REST_DURATION_OPTION_SECONDS.includes(seconds);
}

export function nearestRestDurationOption(seconds: number): number {
  if (REST_DURATION_OPTION_SECONDS.length === 0) {
    return seconds;
  }

  let nearest = REST_DURATION_OPTION_SECONDS[0];
  let smallestDistance = Math.abs(seconds - nearest);

  for (const option of REST_DURATION_OPTION_SECONDS) {
    const distance = Math.abs(seconds - option);
    if (distance < smallestDistance) {
      nearest = option;
      smallestDistance = distance;
    }
  }

  return nearest;
}

export function formatRestDurationPickerLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  if (secs === 0) {
    return `${mins}min`;
  }

  return `${mins}min ${secs}s`;
}
