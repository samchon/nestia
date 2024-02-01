import { IMigrateFile } from "../structures/IMigrateFile";

export namespace FileArchiver {
  export interface IOperator {
    mkdir(path: string): Promise<void>;
    writeFile(path: string, content: string): Promise<void>;
  }

  export const archive =
    (operator: IOperator) =>
    (output: string) =>
    async (files: IMigrateFile[]): Promise<void> => {
      const visited: Set<string> = new Set();
      for (const f of files) {
        await mkdir(operator.mkdir)(output)(visited)(f.location);
        await operator.writeFile(
          [output, f.location, f.file].join("/"),
          f.content,
        );
      }
    };

  const mkdir =
    (creator: (path: string) => void) =>
    (output: string) =>
    (visited: Set<string>) =>
    async (path: string): Promise<void> => {
      const sequence: string[] = path
        .split("/")
        .map((_str, i, entire) => entire.slice(0, i + 1).join("/"));
      for (const s of sequence)
        if (visited.has(s) === false)
          try {
            await creator([output, s].join("/"));
            visited.add(s);
          } catch {}
    };
}
