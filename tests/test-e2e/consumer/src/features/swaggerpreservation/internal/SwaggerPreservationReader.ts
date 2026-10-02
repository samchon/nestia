import fs from "node:fs/promises";
import path from "node:path";
import { OpenApi } from "typia";

/**
 * Reads the immutable rich document and selects the original Swagger specimen.
 *
 * The projection limits the former whole-document null oracle to its original
 * inputs while other rich scenarios retain their own unrelated null values.
 *
 * @evidence contracts/common.md#principled-implementation Actual generated paths and component schemas are read without modifying the document. The null projection names only the original declaration owners, not a calculated expected output.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the document path, component lookup, parameter lookup and canonical comparison representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No metadata, framework method or generated file is replaced; projection creates a separate observation value.
 * @evidence contracts/common.md#meaningful-documentation The comment explains artifact identity and why the original null oracle needs an explicit scope in the combined document.
 * @evidence contracts/portability.md#os-neutral-implementation The document and SDK source readers own native path resolution and containment; operation names and component keys remain protocol strings.
 * @evidence contracts/performance.md#efficient-algorithms Artifact parsing visits its bytes once; bounded specimen lookup, property filtering and recursive canonical key sorting expose their separate input costs in the owning helpers.
 * @evidence contracts/performance.md#reuse-equivalent-work The same immutable generated document is parsed through one lazy promise; conversion callers receive separate copies because their version-specific adjustments are not shared effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One promise retains one document for this consumer process; file readers close their handles and the namespace owns no backend or child process.
 */
export namespace SwaggerParameterReader {
  const PROPERTY_FIELDS = ["title", "description", "deprecated", "readOnly"];
  let documentPromise: Promise<OpenApi.IDocument> | undefined;

  /**
   * Parameter with the optional deprecation extension asserted by the
   * originals.
   *
   * @evidence contracts/common.md#principled-implementation The public OpenAPI parameter type retains its original fields and adds the optional boolean that the composer emits for property deprecation.
   * @evidence contracts/common.md#clear-and-simple-design One intersection represents the additional field without copying the public schema.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This is only a type and introduces no execution substitution.
   * @evidence contracts/common.md#meaningful-documentation The comment names the extension used by the original deprecated-property assertion.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This protocol-only type carries no native filesystem or process representation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type declaration chooses no runtime computation or data processing strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no completed or in-flight runtime work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no runtime state, handle or task lifetime.
   */
  export type IParameter = OpenApi.IOperation.IParameter & {
    deprecated?: boolean;
  };

  /**
   * Reads the existing generated document once in this consumer process.
   *
   * Callers treat the shared artifact as immutable and copy it before
   * conversion.
   *
   * @evidence contracts/common.md#principled-implementation Parsing the caller-generated JSON observes the actual installed native producer and generator output.
   * @evidence contracts/common.md#clear-and-simple-design A lazy promise owns the single read and preserves an initial read or parse rejection for every caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper does not synthesize a schema or rewrite a generated file.
   * @evidence contracts/common.md#meaningful-documentation The comment states read reuse and the callers' nonmutation obligation.
   * @evidence contracts/portability.md#os-neutral-implementation Node path.resolve anchors the artifact to this emitted helper's directory using native separators; the path contains no platform-specific executable or URL conversion.
   * @evidence contracts/performance.md#efficient-algorithms Parsing costs linear time and space in the one document's bytes.
   * @evidence contracts/performance.md#reuse-equivalent-work All cases consume the same unchanged artifact in one compiled consumer process, so the same parse promise serves them without repeating IO or swallowing its first failure.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One promise retains one parsed document until this consumer process ends; readFile owns and closes its file handle and no application or child process is created.
   */
  export const document = (): Promise<OpenApi.IDocument> =>
    (documentPromise ??= fs
      .readFile(
        path.resolve(__dirname, "../../../../../../swagger.json"),
        "utf8",
      )
      .then((text) => JSON.parse(text) as OpenApi.IDocument));

  /**
   * Selects a real operation's parameters, rejecting an absent operation.
   *
   * @evidence contracts/common.md#principled-implementation Method and full prefixed path identify the authored operation; an existing operation without parameters legitimately returns an empty array.
   * @evidence contracts/common.md#clear-and-simple-design Lookup and the missing-operation diagnostic stay together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned parameters are actual output fields and no missing route is fabricated.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes an absent operation from an empty parameter list.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Route and method keys identify protocol data, with no filesystem or process boundary.
   * @evidence contracts/performance.md#efficient-algorithms Two direct property lookups select the operation without scanning other paths; the returned parameter array is borrowed rather than copied.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This direct lookup coordinates no cross-request computation; artifact parsing reuse belongs to document.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation borrows the caller's parameters and retains no state or native resource.
   */
  export const parameters = (
    source: OpenApi.IDocument,
    route: string,
    method: "get" | "post",
  ): IParameter[] => {
    const operation = source.paths?.[route]?.[method];
    if (operation === undefined)
      throw new Error(`Swagger document has no ${method} ${route} operation.`);
    return operation.parameters ?? [];
  };

  /**
   * Removes property annotations that a decomposed parameter carries
   * separately.
   *
   * This component-to-parameter consistency oracle shares generated input; the
   * cases retain independent literal schema pins and authored key sets.
   *
   * @evidence contracts/common.md#principled-implementation The original comparison removes only title, description, deprecated and readOnly from each component property while preserving its value schema and vendor extensions.
   * @evidence contracts/common.md#clear-and-simple-design A component lookup followed by a property projection exposes the exact original comparison rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This projection is an observation used alongside independent expectations and is not substituted for generated output.
   * @evidence contracts/common.md#meaningful-documentation The comment states both the annotation rule and the shared-source limitation of this oracle.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Component and property names are protocol keys without native path identity.
   * @evidence contracts/performance.md#efficient-algorithms Each selected property field is visited once and checked against four fixed annotation names; time and temporary output space grow with selected fields rather than the whole document.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This observation coordinates no equivalent work across consumers and receives the current caller-owned document directly.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned projection containers belong to the caller; the function retains no historical state, handle or running task.
   */
  export const parameterSchemas = (
    source: OpenApi.IDocument,
    component: string,
  ): Record<string, OpenApi.IJsonSchema> => {
    const schema = source.components.schemas?.[component] as
      | OpenApi.IJsonSchema.IObject
      | undefined;
    if (schema === undefined)
      throw new Error(`Swagger document has no ${component} component.`);
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [
        key,
        Object.fromEntries(
          Object.entries(value).filter(
            ([field]) => !PROPERTY_FIELDS.includes(field),
          ),
        ) as OpenApi.IJsonSchema,
      ]),
    );
  };

  /**
   * Observes every original parameter component and operation for null values.
   *
   * @evidence contracts/common.md#principled-implementation The original six DTO components and all eleven operation paths enter the recursive observation, including owners expected to contain no null. Missing owners reject before the assertion can vacuously pass.
   * @evidence contracts/common.md#clear-and-simple-design The same original declaration scope serves conversion and the null oracle, keeping unrelated rich scenarios outside both.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The projection copies actual values without editing the source document or filtering unexpected nulls within any original owned subtree.
   * @evidence contracts/common.md#meaningful-documentation The comment states the exact observation scope rather than claiming a whole-rich-document absence rule.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This observation delegates protocol-data projection and performs no native IO.
   * @evidence contracts/performance.md#efficient-algorithms It delegates one original-scope copy to parameterConversionView rather than traversing the unrelated rich specimen as well.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It coordinates no completed or in-flight work; raw artifact reuse belongs to document and the copy is caller-owned.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned observation owns no resource lifecycle and this function caches no copy.
   */
  export const ownedNullView = (source: OpenApi.IDocument): unknown => {
    return parameterConversionView(source);
  };

  /**
   * Copies the original parameter specimen's actual operations for conversion.
   *
   * Unrelated rich routes can carry version-incompatible security roles that
   * were absent from the original converter input. Every authored operation is
   * required before the converter receives its private observation document.
   *
   * @evidence contracts/common.md#principled-implementation Explicit original operation and DTO identities retain their actual generated values and document metadata; every original object component and operation is required before the private conversion copy is returned.
   * @evidence contracts/common.md#clear-and-simple-design The original scope is an explicit operation list rather than a predicate derived from generated answers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No native schema or route value is fabricated or corrected. This copy defines the same specimen scope that the formerly independent fixture supplied and does not claim source-input selector coverage.
   * @evidence contracts/common.md#meaningful-documentation The comment explains the incompatible unrelated routes and the ownership of the conversion copy.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Explicit route and component names are protocol identities; this function does not access native paths.
   * @evidence contracts/performance.md#efficient-algorithms Fixed owner lookups precede a deep JSON copy whose cost is linear in the selected document bytes; the copy isolates converter mutations without copying unrelated paths or schema components.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This projection does not coordinate consumers; each conversion needs its own mutable copy of the shared immutable artifact.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned copy; this function retains no cached documents, handles or tasks.
   */
  export const parameterConversionView = (
    source: OpenApi.IDocument,
  ): OpenApi.IDocument => {
    const routes = [
      "/decompose/typed-query",
      "/decompose/nest-query",
      "/decompose/typed-headers",
      "/decompose/nest-headers",
      "/example/query",
      "/example/headers",
      "/extension/non-finite",
      "/field/{id}",
      "/field/{id}/combined",
      "/field/vanilla/{kind}",
      "/field/absent",
    ].map((route) => `/swagger_only/parameters${route}`);
    for (const route of routes)
      if (source.paths?.[route] === undefined)
        throw new Error(`Swagger document has no ${route} operation.`);
    const components = [
      "IAbsentFields",
      "IDecomposeQuery",
      "IDecomposeHeaders",
      "IExampleQuery",
      "IExampleHeaders",
      "INonFiniteExtensions",
    ];
    for (const component of components)
      if (source.components.schemas?.[component] === undefined)
        throw new Error(`Swagger document has no ${component} component.`);
    // The enum's inline property verdict remains independent in the consumer;
    // retain an emitted named binding as well if the producer supplies one.
    if (source.components.schemas?.["DecomposeKind"] !== undefined)
      components.push("DecomposeKind");
    return JSON.parse(
      JSON.stringify({
        ...source,
        components: {
          ...source.components,
          schemas: Object.fromEntries(
            components.map((component) => [
              component,
              source.components.schemas![component],
            ]),
          ),
        },
        paths: Object.fromEntries(
          routes.map((route) => [route, source.paths![route]]),
        ),
      }),
    );
  };

  /**
   * Reads an actual generated TypeScript SDK source under the existing output.
   *
   * @evidence contracts/common.md#principled-implementation Resolving the relative generated filename under the caller's SDK output observes the generator's emitted comment text before consumer compilation; escaped paths reject.
   * @evidence contracts/common.md#clear-and-simple-design One contained path lookup and read serves the original multiline comment assertions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source is synthesized or rewritten, and a missing output rejects rather than using a committed baseline.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes freshly generated TypeScript from the consumer's compiled JavaScript.
   * @evidence contracts/portability.md#os-neutral-implementation Native path.resolve and path.relative check containment with path.sep on both Windows and POSIX; source files are read as UTF8.
   * @evidence contracts/performance.md#efficient-algorithms Path resolution and UTF8 reading cost linear work in the path and selected source size.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This unique generated file has one original consumer; no repeated computed result needs another cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources readFile closes its own file handle; only the caller's returned string remains and no process or server is acquired.
   */
  export const sdkSource = async (relative: string): Promise<string> => {
    const root = path.resolve(__dirname, "../../../../../../consumer/src/api");
    const file = path.resolve(root, relative);
    const contained = path.relative(root, file);
    if (
      contained === "" ||
      contained === ".." ||
      contained.startsWith(".." + path.sep) ||
      path.isAbsolute(contained)
    )
      throw new Error(`Generated SDK source escaped its output: ${relative}`);
    return fs.readFile(file, "utf8");
  };

  /**
   * Serializes compared JSON with sorted object keys and unchanged array order.
   *
   * @evidence contracts/common.md#principled-implementation Recursive key sorting removes object insertion-order noise while retaining values, array order and JSON's serialization semantics in both comparison directions.
   * @evidence contracts/common.md#clear-and-simple-design One JSON replacer returns fresh object containers and does not mutate either compared value.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonicalization does not generate expectations or discard fields according to observed output.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes object key order from semantically meaningful array order.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Canonicalization processes JSON values without filesystem, path or process identity.
   * @evidence contracts/performance.md#efficient-algorithms Every JSON member is visited and each object's k keys require sorting work proportional to k log k; fresh containers avoid mutating compared inputs and array order is preserved.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This serialization coordinates no equivalent work across requests; independent expected and observed inputs are each serialized as supplied.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary replacer containers and the returned string are caller-owned; no cache, native handle or running task is retained.
   */
  export const canonical = (value: unknown): string =>
    JSON.stringify(value, (_key, member) =>
      typeof member === "object" && member !== null && !Array.isArray(member)
        ? Object.fromEntries(
            Object.keys(member)
              .sort()
              .map((key) => [key, member[key]]),
          )
        : member,
    );
}
