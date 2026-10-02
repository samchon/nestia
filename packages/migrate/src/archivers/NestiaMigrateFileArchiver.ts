import { VariadicSingleton } from "tstl";

/**
 * Writes a file map into a directory through injected file-system functions.
 *
 * Each path is the root, a `/` and the key's `/`-separated segments, a spelling
 * the filesystem calls of every supported platform accept, and creation and
 * writing are delegated to injected functions, so the caller's filesystem
 * decides existence, case policy and permissions. Directories are created one
 * segment at a time because the injected creator is not recursive. Remaining
 * assumptions: keys are trusted generated names, since a `..` or absolute
 * segment would leave the root, and on a case-insensitive volume two keys that
 * differ only in case write to the same file.
 *
 * @evidence contracts/common.md#principled-implementation Directories are created one path prefix at a time, each once, through a memoized creator, and the files are then written in the order of the map; injecting the functions keeps the archiver independent of Node and of the browser.
 * @evidence contracts/common.md#clear-and-simple-design One function with one memoized directory creator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It writes exactly the given files, and injection is the supported boundary for the platform.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace NestiaMigrateFileArchiver {
  /**
   * Writes every file of `files` below `root`, creating the directories on the
   * way.
   *
   * A directory that cannot be created is not reported, because the creator is
   * also called for a directory that already exists; the failure surfaces when
   * the file is written.
   *
   * The memo of created directories is keyed by the spelled path, so on a
   * case-insensitive volume a second spelling attempts the creation again and
   * receives the already-exists error, which is the swallowed outcome.
   *
   * @evidence contracts/common.md#principled-implementation The root and each prefix of each file's directory are created once, in order, before the file is written, and a creation failure is deferred to the write that needs the directory, since the injected creator is not recursive and reports an existing directory as an error.
   * @evidence contracts/common.md#clear-and-simple-design One function; the memoized creator makes a repeated directory a no-op.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The dropped creation error is a stated consequence of the non-recursive creator, and the write still fails loudly when the directory is missing.
   * @evidence contracts/common.md#meaningful-documentation The comment states the order of creation and the deferred error.
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
