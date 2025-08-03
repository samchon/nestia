import { VariadicSingleton } from "tstl";

/**
 * Namespace containing functions for archiving generated files to the file system.
 * 
 * This archiver handles the creation of directory structures and writing of
 * generated files to disk with proper organization and error handling.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace NestiaMigrateFileArchiver {
  /**
   * Archives generated files to the file system.
   * 
   * Creates the necessary directory structure and writes all generated files
   * to their appropriate locations. Uses efficient directory creation with
   * memoization to avoid redundant filesystem operations.
   * 
   * @param props - Configuration object for the archiving operation
   * @param props.mkdir - Function to create directories
   * @param props.writeFile - Function to write file content
   * @param props.root - Root directory path for the output
   * @param props.files - Record of file paths to file contents to write
   */
  export const archive = async (props: {
    mkdir: (path: string) => Promise<void>;
    writeFile: (path: string, content: string) => Promise<void>;
    root: string;
    files: Record<string, string>;
  }): Promise<void> => {
    const mkdir = new VariadicSingleton(
      async (location: string): Promise<void> => {
        try {
          await props.mkdir(`${props.root}/${location}`);
        } catch {}
      },
    );
    const iterate = async (location: string): Promise<void> => {
      const sequence: string[] = location
        .split("/")
        .map((_str, i, entire) => entire.slice(0, i + 1).join("/"));
      for (const s of sequence) await mkdir.get(s);
    };
    for (const [key, value] of Object.entries(props.files)) {
      await iterate(key.split("/").slice(0, -1).join("/"));
      await props.writeFile(`${props.root}/${key}`, value);
    }
  };
}
