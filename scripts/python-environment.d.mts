export const pythonSetupCommand: string;

export function resolvePython(projectRoot: string, env?: NodeJS.ProcessEnv):
  | { python: string }
  | { message: string; fatal: boolean };
