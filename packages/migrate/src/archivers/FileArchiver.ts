import { IMigrateFile } from "../structures/IMigrateFile";

export namespace FileArchiver {
  export interface IOperator {
    mkdir(path: string): void;
    writeFile(path: string, content: string): void;
  }

  export const archive =
    (operator: IOperator) =>
    (output: string) =>
    (files: IMigrateFile[]): void => {
      const visited: Set<string> = new Set();
      for (const f of files) {
        mkdir(operator.mkdir)(output)(visited)(f.location);
        operator.writeFile([output, f.location, f.file].join("/"), f.content);
      }
    };

  const mkdir =
    (creator: (path: string) => void) =>
    (output: string) =>
    (visited: Set<string>) =>
    (path: string): void => {
      const sequence: string[] = path
        .split("/")
        .map((_str, i, entire) => entire.slice(0, i + 1).join("/"));
      for (const s of sequence)
        if (visited.has(s) === false)
          try {
            creator([output, s].join("/"));
            visited.add(s);
          } catch {}
    };
}
