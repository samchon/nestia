import { NamingConvention } from "@typia/utils";
import { IMetadataComponents, IMetadataSchema } from "typia";

import {
  IMetadataDictionary,
  MetadataAliasType,
  MetadataArrayType,
  MetadataComponents,
  MetadataFactory,
  MetadataObjectType,
  MetadataSchema,
  MetadataTupleType,
} from "../internal/legacy";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedHttpRouteException } from "../structures/ITypedHttpRouteException";
import { ITypedHttpRouteParameter } from "../structures/ITypedHttpRouteParameter";
import { ITypedHttpRouteSuccess } from "../structures/ITypedHttpRouteSuccess";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";
import { PathUtil } from "../utils/PathUtil";
import { StringUtil } from "../utils/StringUtil";

/**
 * Turns reflected HTTP operations into typed routes, one per path, and builds
 * the shared dictionary of the JSON components HTTP and MCP routes use.
 *
 * @evidence contracts/common.md#principled-implementation Each operation's metadata is resolved against its own components and validated by the policy of its position, the routes carry the typed parameters, the success response, and the exceptions, and the dictionary of the routes is built after component names that collide with different definitions are renamed per controller.
 * @evidence contracts/common.md#clear-and-simple-design Two public functions and private collectors for the component rename.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rename mutates only component definitions owned by analysis; consumers emit resolved structural types rather than modifying foreign cache fields or replacing names in strings.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * efficient algorithms: This namespace groups operations; analyze and routeDictionary own the algorithms.
 * reuse equivalent work: The namespace itself coordinates no completed or in-flight work.
 * bound retention and release resources: The namespace owns no cache, handle or running task.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation TypedHttpRouteAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace TypedHttpRouteAnalyzer {
  /**
   * Returns the typed routes of one operation, one per path, or none when the
   * metadata violates a policy; the violations are pushed to the errors.
   *
   * @evidence contracts/common.md#principled-implementation Each metadata is resolved against its own components and validated with the policy of its position (JSON, query, header, or text), the `@setHeader` and `@assignHeaders` tags become header directives, and the route splits the parameters by category.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The policies come from the validators of the package.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result and the errors.
   * efficient algorithms: Each supplied parameter and exception is cast once, policy validation belongs to MetadataFactory, and route splitting maps only the supplied paths.
   * reuse equivalent work: Independently supplied operation metadata and position-specific validation have no shared completed or in-flight request.
   * bound retention and release resources: Metadata dictionaries and local diagnostics belong to this synchronous operation and its returned routes; no process, handle or persistent history is retained.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation TypedHttpRouteAnalyzer.analyze analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const analyze = (props: {
    controller: IReflectController;
    errors: IReflectOperationError[];
    operation: IReflectHttpOperation;
    paths: string[];
  }): ITypedHttpRoute[] => {
    const errors: IReflectOperationError[] = [];
    const cast = (
      next: {
        metadata: IMetadataSchema;
        components: IMetadataComponents;
        validate?: MetadataFactory.Validator;
      },
      from: string,
    ): MetadataSchema => {
      const components: MetadataComponents = MetadataComponents.from(
        next.components,
      );
      const metadata: MetadataSchema = MetadataSchema.from(
        next.metadata,
        components.dictionary,
      );
      const metaErrors: MetadataFactory.IError[] =
        next.validate === undefined
          ? []
          : MetadataFactory.validate({
              functor: next.validate,
              metadata,
            });
      if (metaErrors.length)
        errors.push({
          file: props.controller.file,
          class: props.controller.class.name,
          function: props.operation.name,
          from,
          contents: metaErrors.map((e) => ({
            name: e.name,
            accessor:
              e.explore.object !== null
                ? join({
                    object: e.explore.object,
                    key: e.explore.property,
                  })
                : null,
            messages: e.messages,
          })),
        });
      return metadata;
    };
    const exceptions: Record<
      number | "2XX" | "3XX" | "4XX" | "5XX",
      ITypedHttpRouteException
    > = Object.fromEntries(
      Object.entries(props.operation.exceptions).map(([key, value]) => [
        key as any,
        {
          status: value.status,
          description: value.description,
          example: value.example,
          examples: value.examples,
          type: value.type,
          metadata: cast(value, `exception (status: ${key})`),
        },
      ]),
    );
    const parameters: ITypedHttpRouteParameter[] =
      props.operation.parameters.map((p) => ({
        ...p,
        metadata: cast(p, `parameter (name: ${JSON.stringify(p.name)})`),
      }));
    const success: ITypedHttpRouteSuccess = {
      ...props.operation.success,
      metadata: cast(props.operation.success, "success"),
      setHeaders: props.operation.jsDocTags
        .filter(
          (t) =>
            t.text?.length &&
            t.text[0]!.text &&
            (t.name === "setHeader" || t.name === "assignHeaders"),
        )
        .map((t) => {
          // the words of the first line; the next lines only describe
          const words: string[] = t
            .text![0]!.text.split("\n")[0]!
            .trim()
            .split(/\s+/);
          return t.name === "setHeader"
            ? {
                type: "setter" as const,
                source: words[0]!,
                target: words[1],
              }
            : {
                type: "assigner" as const,
                source: words[0]!,
              };
        }),
    };
    if (errors.length) {
      props.errors.push(...errors);
      return [];
    }
    return props.paths.map(
      (path) =>
        ({
          ...props.operation,
          controller: props.controller,
          key: props.operation.name,
          path,
          accessor: [...PathUtil.accessors(path), props.operation.name],
          exceptions,
          pathParameters: parameters.filter((p) => p.category === "param"),
          queryParameters: parameters
            .filter((p) => p.category === "query")
            .filter((p) => p.field !== null),
          headerParameters: parameters
            .filter((p) => p.category === "headers")
            .filter((p) => p.field !== null),
          queryObject:
            parameters
              .filter((p) => p.category === "query")
              .filter((p) => p.field === null)[0] ?? null,
          body: parameters.filter((p) => p.category === "body")[0] ?? null,
          headerObject:
            parameters
              .filter((p) => p.category === "headers")
              .filter((p) => p.field === null)[0] ?? null,
          success,
          extensions: props.operation.extensions,
        }) satisfies ITypedHttpRoute,
    );
  };

  /**
   * Returns the dictionary of the components the routes actually use, after
   * renaming components whose names collide with different definitions.
   *
   * @evidence contracts/common.md#principled-implementation Objects, aliases and recursive arrays/tuples share their emitted accessor-path slots, while finite and object-mediated collections remain kind-specific inline groups. Different semantic classes in one slot receive unique controller-qualified names, and the emitted dictionary follows escaped returns rather than original-only toJSON declarations.
   * @evidence contracts/common.md#clear-and-simple-design One function over private collectors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite partition refinement preserves semantic discriminators and user payloads while component edges reference equivalence classes. Only actual component ordinals are omitted; no foreign name cache or generated text is rewritten.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result and the rename.
   * efficient algorithms: Each refinement round encodes each distinct component body with constant-sized component edges. The partition only splits and stabilizes within the distinct component count, avoiding exponential expansion of shared DAGs.
   * reuse equivalent work: One local partition compares all routes together, reuses graph node colors for shared children and supplies all collision groups; equivalent same-slot definitions reuse one emitted representative.
   * bound retention and release resources: Collected nodes, partitions and visited sets are local to this synchronous call and are released with it; the returned dictionary retains only its reachable emitted representatives.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation TypedHttpRouteAnalyzer.routeDictionary analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const routeDictionary = (
    routes: Array<ITypedHttpRoute | ITypedMcpRoute>,
  ): IMetadataDictionary => {
    renameDuplicateComponents(routes);
    const dictionary: IMetadataDictionary = {
      objects: new Map(),
      aliases: new Map(),
      arrays: new Map(),
      tuples: new Map(),
    };
    for (const route of routes)
      for (const metadata of routeMetadatas(route))
        enrollMetadata(dictionary, metadata);
    return dictionary;
  };
}

type ComponentKind = "objects" | "aliases" | "arrays" | "tuples";
type ComponentType =
  | MetadataObjectType
  | MetadataAliasType
  | MetadataArrayType
  | MetadataTupleType;

interface IComponentEntry {
  kind: ComponentKind;
  route: ITypedHttpRoute | ITypedMcpRoute;
  signature: string;
  type: ComponentType;
}

const renameDuplicateComponents = (
  routes: Array<ITypedHttpRoute | ITypedMcpRoute>,
): void => {
  const entries: IComponentEntry[] = [];
  for (const route of routes)
    for (const metadata of routeMetadatas(route))
      collectComponentEntries(entries, route, metadata);
  // Original toJSON definitions participate in semantic comparison but do not
  // become emitted declarations unless another route uses them directly.
  const comparisonEntries: IComponentEntry[] = [];
  for (const route of routes)
    for (const metadata of routeMetadatas(route))
      collectComponentEntries(
        comparisonEntries,
        route,
        metadata,
        createCollectVisited(),
        true,
      );
  const signatures = componentSignatures(comparisonEntries);
  for (const entry of entries) entry.signature = signatures.get(entry.type)!;

  const used: Set<string> = new Set(
    entries.map((e) => StringUtil.accessorsOf(e.type.name).join(".")),
  );
  const groups: Map<string, IComponentEntry[]> = new Map();
  for (const entry of entries) {
    // Named recursive collections also need a declaration to break cycles.
    // Ordinary arrays and tuples remain inline forms without their own slot.
    const slot =
      entry.kind === "objects" ||
      entry.kind === "aliases" ||
      entry.type.recursive
        ? "declarations"
        : entry.kind;
    const name =
      slot === "declarations"
        ? StringUtil.accessorsOf(entry.type.name).join(".")
        : entry.type.name;
    const key: string = `${slot}:${name}`;
    const group: IComponentEntry[] | undefined = groups.get(key);
    if (group === undefined) groups.set(key, [entry]);
    else group.push(entry);
  }
  for (const group of groups.values()) {
    const signatures: Set<string> = new Set(group.map((e) => e.signature));
    if (signatures.size <= 1) continue;

    const renamed: Map<string, string> = new Map();
    for (const entry of group) {
      const oldName: string = entry.type!.name;
      const next: string =
        renamed.get(entry.signature) ??
        (() => {
          const prefix: string = normalizeComponentNamespace(
            entry.route.controller.class.name,
          );
          const name: string = escapeComponentName(
            used,
            `${prefix}.${oldName}`,
          );
          renamed.set(entry.signature, name);
          used.add(StringUtil.accessorsOf(name).join("."));
          return name;
        })();
      (entry.type as { name: string }).name = next;
    }
  }
};

const routeMetadatas = (
  route: ITypedHttpRoute | ITypedMcpRoute,
): MetadataSchema[] =>
  route.protocol === "mcp"
    ? [route.inputMetadata, route.outputMetadata].filter(
        (m): m is MetadataSchema => m !== undefined,
      )
    : [
        ...[
          ...route.pathParameters,
          ...route.queryParameters,
          ...route.headerParameters,
          ...(route.queryObject ? [route.queryObject] : []),
          ...(route.body ? [route.body] : []),
          ...(route.headerObject ? [route.headerObject] : []),
        ].map((p) => p.metadata),
        ...Object.values(route.exceptions).map((e) => e.metadata),
        route.success.metadata,
      ];

const collectComponentEntries = (
  entries: IComponentEntry[],
  route: ITypedHttpRoute | ITypedMcpRoute,
  metadata: MetadataSchema,
  visited: ICollectVisited = createCollectVisited(),
  includeOriginal: boolean = false,
): void => {
  if (visited.schemas.has(metadata)) return;
  visited.schemas.add(metadata);

  if (metadata.rest !== null)
    collectComponentEntries(
      entries,
      route,
      metadata.rest,
      visited,
      includeOriginal,
    );
  if (metadata.escaped !== null) {
    if (includeOriginal)
      collectComponentEntries(
        entries,
        route,
        metadata.escaped.original,
        visited,
        includeOriginal,
      );
    collectComponentEntries(
      entries,
      route,
      metadata.escaped.returns,
      visited,
      includeOriginal,
    );
  }
  for (const template of metadata.templates)
    for (const elem of template.row ?? template)
      collectComponentEntries(entries, route, elem, visited, includeOriginal);
  for (const func of metadata.functions) {
    for (const p of func.parameters)
      collectComponentEntries(entries, route, p.type, visited, includeOriginal);
    collectComponentEntries(
      entries,
      route,
      func.output,
      visited,
      includeOriginal,
    );
  }
  for (const set of metadata.sets)
    collectComponentEntries(
      entries,
      route,
      set.value,
      visited,
      includeOriginal,
    );
  for (const map of metadata.maps) {
    collectComponentEntries(entries, route, map.key, visited, includeOriginal);
    collectComponentEntries(
      entries,
      route,
      map.value,
      visited,
      includeOriginal,
    );
  }
  for (const array of metadata.arrays)
    if (visited.arrays.has(array.type as MetadataArrayType) === false) {
      visited.arrays.add(array.type as MetadataArrayType);
      entries.push(
        componentEntry(route, "arrays", array.type as MetadataArrayType),
      );
      collectComponentEntries(
        entries,
        route,
        (array.type as MetadataArrayType as MetadataArrayType).value,
        visited,
        includeOriginal,
      );
    }
  for (const tuple of metadata.tuples)
    if (visited.tuples.has(tuple.type as MetadataTupleType) === false) {
      visited.tuples.add(tuple.type as MetadataTupleType);
      entries.push(
        componentEntry(route, "tuples", tuple.type as MetadataTupleType),
      );
      for (const elem of (tuple.type as MetadataTupleType as MetadataTupleType)
        .elements)
        collectComponentEntries(entries, route, elem, visited, includeOriginal);
    }
  for (const alias of metadata.aliases)
    if (visited.aliases.has(alias.type as MetadataAliasType) === false) {
      visited.aliases.add(alias.type as MetadataAliasType);
      entries.push(
        componentEntry(route, "aliases", alias.type as MetadataAliasType),
      );
      collectComponentEntries(
        entries,
        route,
        (alias.type as MetadataAliasType as MetadataAliasType).value,
        visited,
        includeOriginal,
      );
    }
  for (const obj of metadata.objects)
    if (visited.objects.has(obj.type as MetadataObjectType) === false) {
      visited.objects.add(obj.type as MetadataObjectType);
      entries.push(
        componentEntry(route, "objects", obj.type as MetadataObjectType),
      );
      for (const p of (obj.type as MetadataObjectType as MetadataObjectType)
        .properties) {
        collectComponentEntries(
          entries,
          route,
          p.key,
          visited,
          includeOriginal,
        );
        collectComponentEntries(
          entries,
          route,
          p.value,
          visited,
          includeOriginal,
        );
      }
    }
};

const componentEntry = <T extends ComponentType>(
  route: ITypedHttpRoute | ITypedMcpRoute,
  kind: ComponentKind,
  type: T,
): IComponentEntry => ({
  kind,
  route,
  signature: "",
  type,
});

/**
 * Refines a finite component graph until no semantic equivalence class splits.
 * Component edges carry class numbers, so shared children are never expanded as
 * trees. Ordinary payloads retain separate object/array representations. Each
 * round preserves the previous partition and can only split its classes; at
 * most the number of distinct components rounds are necessary.
 */
const componentSignatures = (
  entries: IComponentEntry[],
): Map<ComponentType, string> => {
  const kinds = new Map<ComponentType, ComponentKind>();
  for (const entry of entries) kinds.set(entry.type, entry.kind);
  const nodes = [...kinds.keys()];
  let colors = new Map(nodes.map((node) => [node, 0]));
  let classes = nodes.length ? 1 : 0;
  while (nodes.length) {
    const intern = new Map<string, number>();
    const next = new Map<ComponentType, number>();
    for (const node of nodes) {
      const ancestors = new WeakMap<object, number>();
      let depth = 0;
      const encode = (value: unknown, root = false): unknown => {
        if (value === null || typeof value !== "object") return value;
        if (!root && kinds.has(value as ComponentType))
          return ["component", colors.get(value as ComponentType)];
        const position = ancestors.get(value);
        if (position !== undefined) return ["payload-cycle", position];
        ancestors.set(value, depth++);
        const result = Array.isArray(value)
          ? ["array", value.map((child) => encode(child))]
          : [
              "object",
              Object.entries(value)
                .filter(
                  ([key, child]) =>
                    child !== undefined && !(root && key === "index"),
                )
                .map(([key, child]) => [key, encode(child)]),
            ];
        ancestors.delete(value);
        --depth;
        return result;
      };
      const signature = JSON.stringify([
        colors.get(node),
        kinds.get(node),
        encode(node, true),
      ]);
      let color = intern.get(signature);
      if (color === undefined) {
        color = intern.size;
        intern.set(signature, color);
      }
      next.set(node, color);
    }
    colors = next;
    if (intern.size === classes) break;
    classes = intern.size;
  }
  return new Map(nodes.map((node) => [node, String(colors.get(node))]));
};

const normalizeComponentNamespace = (name: string): string => {
  const next: string = name.replace(/[^A-Za-z0-9_$]/g, "_");
  return next.length ? next : "Route";
};

const escapeComponentName = (used: Set<string>, name: string): string =>
  used.has(StringUtil.accessorsOf(name).join("."))
    ? escapeComponentName(used, `_${name}`)
    : name;

interface ICollectVisited {
  aliases: WeakSet<MetadataAliasType>;
  arrays: WeakSet<MetadataArrayType>;
  objects: WeakSet<MetadataObjectType>;
  schemas: WeakSet<MetadataSchema>;
  tuples: WeakSet<MetadataTupleType>;
}

const createCollectVisited = (): ICollectVisited => ({
  aliases: new WeakSet<MetadataAliasType>(),
  arrays: new WeakSet<MetadataArrayType>(),
  objects: new WeakSet<MetadataObjectType>(),
  schemas: new WeakSet<MetadataSchema>(),
  tuples: new WeakSet<MetadataTupleType>(),
});

const enrollMetadata = (
  dictionary: IMetadataDictionary,
  metadata: MetadataSchema,
  visited: IVisitedMetadata = createVisitedMetadata(),
): void => {
  if (visited.schemas.has(metadata)) return;
  visited.schemas.add(metadata);

  if (metadata.rest !== null)
    enrollMetadata(dictionary, metadata.rest, visited);
  if (metadata.escaped !== null) {
    enrollMetadata(dictionary, metadata.escaped.returns, visited);
  }
  for (const template of metadata.templates)
    for (const elem of template.row ?? template)
      enrollMetadata(dictionary, elem, visited);
  for (const func of metadata.functions) {
    for (const p of func.parameters)
      enrollMetadata(dictionary, p.type, visited);
    enrollMetadata(dictionary, func.output, visited);
  }
  for (const set of metadata.sets)
    enrollMetadata(dictionary, set.value, visited);
  for (const map of metadata.maps) {
    enrollMetadata(dictionary, map.key, visited);
    enrollMetadata(dictionary, map.value, visited);
  }
  for (const array of metadata.arrays)
    if (enroll(dictionary.arrays, array.type as MetadataArrayType))
      enrollMetadata(
        dictionary,
        (array.type as MetadataArrayType as MetadataArrayType).value,
        visited,
      );
  for (const tuple of metadata.tuples)
    if (enroll(dictionary.tuples, tuple.type as MetadataTupleType))
      for (const elem of (tuple.type as MetadataTupleType as MetadataTupleType)
        .elements)
        enrollMetadata(dictionary, elem, visited);
  for (const alias of metadata.aliases)
    if (enroll(dictionary.aliases, alias.type as MetadataAliasType))
      enrollMetadata(
        dictionary,
        (alias.type as MetadataAliasType as MetadataAliasType).value,
        visited,
      );
  for (const obj of metadata.objects)
    if (enroll(dictionary.objects, obj.type as MetadataObjectType))
      for (const p of (obj.type as MetadataObjectType as MetadataObjectType)
        .properties) {
        enrollMetadata(dictionary, p.key, visited);
        enrollMetadata(dictionary, p.value, visited);
      }
};

const enroll = <
  T extends
    | MetadataObjectType
    | MetadataAliasType
    | MetadataArrayType
    | MetadataTupleType,
>(
  dict: Map<string, T>,
  elem: T,
): boolean => {
  // Collision refinement established equivalence for every remaining same-name
  // entry in this kind; selecting another representative cannot add meaning.
  const oldbie: T | undefined = dict.get(elem.name);
  if (oldbie === elem) return false;
  if (oldbie === undefined) {
    dict.set(elem.name, elem);
    return true;
  }
  return false;
};

interface IVisitedMetadata {
  schemas: WeakSet<MetadataSchema>;
}

const createVisitedMetadata = (): IVisitedMetadata => ({
  schemas: new WeakSet<MetadataSchema>(),
});

const join = ({
  object,
  key,
}: {
  object: MetadataObjectType;
  key: string | object | null;
}) => {
  if (key === null) return object.name;
  else if (typeof key === "object") return `${object.name}[key]`;
  else if (NamingConvention.variable(key)) return `${object.name}.${key}`;
  return `${object.name}[${JSON.stringify(key)}]`;
};
