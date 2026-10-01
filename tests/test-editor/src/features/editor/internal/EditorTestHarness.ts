import path from "path";

/**
 * Local helpers for the `@nestia/editor` test suite.
 *
 * The suite exercises the built library artifacts under `packages/editor/lib`,
 * not the TypeScript sources: the archiver and the composer are internal
 * modules that the package's exports map does not expose, so they are loaded
 * through absolute-path `require()` calls.
 *
 * @evidence contracts/common.md#principled-implementation Accessors return real built owners while the document factory supplies independent inputs.
 * @evidence contracts/common.md#clear-and-simple-design One namespace shares native artifact locations without duplicating product generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The namespace groups maintained declarations and adds no expected-output behavior or foreign mutation.
 * @evidence contracts/common.md#meaningful-documentation Direct archive/composer owners and independent authored OpenAPI input.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups declarations; individual functions own their processing algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no completed or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained history, handles or running tasks.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The namespace groups declarations; its native loader accessors own filesystem path resolution.
 */
export namespace EditorTestHarness {
  /** Ttsx relocates compiled sources, so anchor on the workspace cwd. */
  export const ROOT: string = path.resolve(process.cwd(), "..", "..");
  export const LIB: string = path.join(ROOT, "packages", "editor", "lib");

  /**
   * Built archive owner exposed to direct cases.
   *
   * @evidence contracts/common.md#principled-implementation The callable shape retains real pack, filename and download operations with their original input/output values.
   * @evidence contracts/common.md#clear-and-simple-design One interface groups the archive owner's three public operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface does not implement archive behavior or replace foreign methods.
   * @evidence contracts/common.md#meaningful-documentation Built archive owner exposed to direct cases.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents in-memory inputs or results and accesses no native platform boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type represents values and chooses no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
  export interface IArchiver {
    /**
     * Encodes the supplied generated file map as archive bytes.
     *
     * @evidence contracts/common.md#principled-implementation The file-map input and Uint8Array output preserve the real archive owner's contract.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Maps an authored file map to archive bytes; thrown encoding failures belong to its implementation.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    pack: (files: Record<string, string>) => Uint8Array;

    /**
     * Chooses the archive filename from the supplied package name.
     *
     * @evidence contracts/common.md#principled-implementation The input package identity remains separate from its derived downloadable filename.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Returns an archive filename for the supplied package name.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    name: (packageName: string) => string;

    /**
     * Creates the browser download for the supplied files and name.
     *
     * @evidence contracts/common.md#principled-implementation One props record keeps the download name and its corresponding generated files together.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Requests a browser download of the named file map; thrown failures propagate to its caller.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    download: (props: { name: string; files: Record<string, string> }) => void;
  }
  /**
   * Built migration composer with independent SDK and Nest modes.
   *
   * @evidence contracts/common.md#principled-implementation The two asynchronous methods consume the same supported options and retain the real result representation.
   * @evidence contracts/common.md#clear-and-simple-design One interface distinguishes generation modes without duplicating their options.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No composer behavior is reimplemented by the interface.
   * @evidence contracts/common.md#meaningful-documentation Built migration composer with independent SDK and Nest modes.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents in-memory inputs or results and accesses no native platform boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type represents values and chooses no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
  export interface IComposer {
    /**
     * Generates a Nest project from the supplied document and options.
     *
     * @evidence contracts/common.md#principled-implementation The callback consumes all supported composer options and preserves success, generated data and diagnostics in its result.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Returns an asynchronous Nest composition result; rejected failures remain observable by the caller.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    nest: (props: IComposerProps) => Promise<IComposerResult>;

    /**
     * Generates an SDK project from the same supported options.
     *
     * @evidence contracts/common.md#principled-implementation The same composer options apply to SDK generation while the callable identity distinguishes it from Nest mode.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Returns an asynchronous SDK composition result; rejected failures remain observable by the caller.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    sdk: (props: IComposerProps) => Promise<IComposerResult>;
  }
  /**
   * Authored document and generation settings supplied to the composer.
   *
   * @evidence contracts/common.md#principled-implementation Separate boolean options retain each public keyword, simulator and e2e decision; an absent package name preserves its default.
   * @evidence contracts/common.md#clear-and-simple-design One record describes all inputs for either generation mode.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface does not encode expected output or silently drop options.
   * @evidence contracts/common.md#meaningful-documentation Authored document and generation settings supplied to the composer.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents in-memory inputs or results and accesses no native platform boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type represents values and chooses no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
  export interface IComposerProps {
    /** OpenAPI input authored independently of the composer. */
    document: object;

    /** Whether generated output includes e2e functions. */
    e2e: boolean;

    /** Whether operations accept keyword argument objects. */
    keyword: boolean;

    /** Whether generated SDK calls support simulation. */
    simulate: boolean;

    /** Requested package name; omission preserves the composer default. */
    package?: string;
  }
  /**
   * Composer result whose optional payload depends on success.
   *
   * @evidence contracts/common.md#principled-implementation Success, file output and diagnostics remain available without converting a failed result into generated files.
   * @evidence contracts/common.md#clear-and-simple-design The record preserves the actual composer return boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper type does not infer success from output or supply fabricated diagnostics.
   * @evidence contracts/common.md#meaningful-documentation Composer result whose optional payload depends on success.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents in-memory inputs or results and accesses no native platform boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type represents values and chooses no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
  export interface IComposerResult {
    /** Whether composition completed successfully. */
    success: boolean;

    /** Generated source map when composition succeeded. */
    data?: { files: Record<string, string> };

    /** Diagnostics retained when composition failed. */
    errors?: unknown;
  }

  /**
   * Loads the real built archive owner through its direct declaration.
   *
   * @evidence contracts/common.md#principled-implementation The exports map hides the internal module; Node require accesses the workspace artifact used by the product.
   * @evidence contracts/common.md#clear-and-simple-design One native path joins the shared library root with the archiver module.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No archive operation or global module loader is replaced.
   * @evidence contracts/common.md#meaningful-documentation Loads the real built archive owner through its direct declaration.
   * @evidence contracts/portability.md#os-neutral-implementation Node path.join and require handle native separators and loading without constructing shell commands.
   * @evidence contracts/performance.md#efficient-algorithms One module lookup returns the existing owner; Node manages normal require module caching.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
  export const archiver = (): IArchiver =>
    require(path.join(LIB, "internal", "NestiaEditorArchiver.js"))
      .NestiaEditorArchiver;

  /**
   * Loads the real built migration composer through its direct declaration.
   *
   * @evidence contracts/common.md#principled-implementation The selected module is the product composer that invokes actual migration generation.
   * @evidence contracts/common.md#clear-and-simple-design One native path uses the shared library root and selects the composer export.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor returns the actual owner without replacing its methods.
   * @evidence contracts/common.md#meaningful-documentation Loads the real built migration composer through its direct declaration.
   * @evidence contracts/portability.md#os-neutral-implementation Node path.join and require handle native module paths without platform-specific shell syntax.
   * @evidence contracts/performance.md#efficient-algorithms One module lookup returns the existing owner; no test-owned cache is introduced.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
  export const composer = (): IComposer =>
    require(path.join(LIB, "internal", "NestiaEditorComposer.js"))
      .NestiaEditorComposer;

  /**
   * Minimal OpenAPI 3.1 document accepted by the migrate application.
   *
   * @evidence contracts/common.md#principled-implementation An array response references the authored article object, whose three required strings supply independently known archive and composition input.
   * @evidence contracts/common.md#clear-and-simple-design The component and its one consuming operation are returned together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixture is independently authored input rather than saved composer output.
   * @evidence contracts/common.md#meaningful-documentation Creates one authored OpenAPI document referencing an article component.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents in-memory inputs or results and accesses no native platform boundary.
   * @evidence contracts/performance.md#efficient-algorithms The fixed operation and component have constant structural size; each call creates fresh input data.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no retained cache, handle or background task; returned values belong to its caller.
   */
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
