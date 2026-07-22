export interface IReflectImport {
  file: string;
  asterisk: string | null;
  default: string | null;
  elements: string[];
  /** Maps a local named binding to the name exported by its source module. */
  elementAliases?: Record<string, string>;
}
