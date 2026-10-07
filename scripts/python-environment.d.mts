export function resolvePython(projectRoot: string):
  | { python: string }
  | { message: string };

export function macosScipyLoadGap(
  error: unknown,
  options?: { platform?: string; ci?: boolean; productVersion?: () => string },
): string | undefined;
