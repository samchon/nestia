import { VariadicSingleton } from "tstl";

export namespace NestiaMigrateFileArchiver {
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
    // The file set may lead with a nested path (the monorepo template's
    // first key is `.github/workflows/build.yml`), so the archive root must
    // exist before the per-directory mkdir walk below it.
    await mkdir.get("");
    for (const [key, value] of Object.entries(props.files)) {
      await iterate(key.split("/").slice(0, -1).join("/"));
      await props.writeFile(`${props.root}/${key}`, value);
    }
  };
}
