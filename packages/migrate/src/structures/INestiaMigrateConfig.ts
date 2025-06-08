export interface INestiaMigrateConfig {
  simulate: boolean;
  e2e: boolean;
  package?: string;
  keyword?: boolean;
  author?: {
    tag: string;
    value: string;
  };
}
