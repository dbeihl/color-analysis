export const pythonSetupCommand: string;

export function resolvePython(projectRoot: string):
  | { python: string }
  | { message: string };
