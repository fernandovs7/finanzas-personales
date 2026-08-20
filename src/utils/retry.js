const TRANSIENT_AUTH_TIMING_MESSAGES = [
  "jwt issued at future",
  "jwt issued in the future",
  "token is not yet valid"
];

export function isTransientAuthTimingError(error) {
  const message = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");

  return TRANSIENT_AUTH_TIMING_MESSAGES.some((candidate) => message.includes(candidate));
}

export async function retryTransientAuthTiming(
  operation,
  {
    delays = [400, 800, 1600, 2400],
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
  } = {}
) {
  let retryIndex = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientAuthTimingError(error) || retryIndex >= delays.length) throw error;
      await sleep(delays[retryIndex]);
      retryIndex += 1;
    }
  }
}
