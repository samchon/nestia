import path from "path";

/**
 * Local helpers for the `@nestia/editor` test suite.
 *
 * The suite exercises the built library artifacts under `packages/editor/lib`,
 * not the TypeScript sources: the archiver and the composer are internal
 * modules that the package's exports map does not expose, so they are loaded
 * through absolute-path `require()` calls.
 */
export namespace EditorTestHarness {
  /** Ttsx relocates compiled sources, so anchor on the workspace cwd. */
  export const ROOT: string = path.resolve(process.cwd(), "..", "..");
  export const LIB: string = path.join(ROOT, "packages", "editor", "lib");

  export interface IArchiver {
    pack: (files: Record<string, string>) => Uint8Array;
    name: (packageName: string) => string;
    download: (props: { name: string; files: Record<string, string> }) => void;
  }
  export interface IComposer {
    nest: (props: IComposerProps) => Promise<IComposerResult>;
    sdk: (props: IComposerProps) => Promise<IComposerResult>;
  }
  export interface IComposerProps {
    document: object;
    e2e: boolean;
    keyword: boolean;
    simulate: boolean;
    package?: string;
  }
  export interface IComposerResult {
    success: boolean;
    data?: { files: Record<string, string> };
    errors?: unknown;
  }

  export const archiver = (): IArchiver =>
    require(path.join(LIB, "internal", "NestiaEditorArchiver.js"))
      .NestiaEditorArchiver;

  export const composer = (): IComposer =>
    require(path.join(LIB, "internal", "NestiaEditorComposer.js"))
      .NestiaEditorComposer;

  export const defaultPackage = (): string =>
    require(path.join(LIB, "internal", "NestiaEditorDefaultPackage.js"))
      .NESTIA_EDITOR_DEFAULT_PACKAGE as string;

  /** Minimal OpenAPI 3.1 document accepted by the migrate application. */
  export const document = (): object => ({
    openapi: "3.1.0",
    info: { title: "Editor Test", version: "1.0.0" },
    paths: {
      "/bbs/articles": {
        get: {
          responses: {
            "200": {
              description: "List up articles.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/IBbsArticle" },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        IBbsArticle: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
          },
          required: ["id", "title", "body"],
        },
      },
    },
  });
}
