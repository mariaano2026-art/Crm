// Fixed: Cannot find type definition file for 'vite/client'
// Providing manual declaration for process.env as fallback since vite types are missing in this environment.

declare const process: {
  env: {
    readonly API_KEY: string;
    [key: string]: string | undefined;
  }
};
