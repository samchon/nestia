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
import { PathUtil } from "../utils/PathUtil";

export namespace TypedHttpRouteAnalyzer {
  export const dictionary = (
    controllers: IReflectController[],
  ): IMetadataDictionary => {
    const individual: IMetadataComponents[] = [];
    for (const c of controllers)
      for (const o of c.operations) {
        if (o.protocol !== "http") continue;
        if (o.success) individual.push(o.success.components);
        for (const p of o.parameters) individual.push(p.components);
        for (const e of Object.values(o.exceptions))
          individual.push(e.components);
      }
    const components: MetadataComponents = MetadataComponents.from({
      objects: uniqueComponents(individual.flatMap((c) => c.objects)),
      arrays: uniqueComponents(individual.flatMap((c) => c.arrays)),
      tuples: uniqueComponents(individual.flatMap((c) => c.tuples)),
      aliases: uniqueComponents(individual.flatMap((c) => c.aliases)),
    });
    return components.dictionary;
  };

  export const analyze = (props: {
    controller: IReflectController;
    errors: IReflectOperationError[];
    dictionary: IMetadataDictionary;
    operation: IReflectHttpOperation;
    paths: string[];
  }): ITypedHttpRoute[] => {
    const errors: IReflectOperationError[] = [];
    const cast = (
      next: {
        metadata: IMetadataSchema;
        components: IMetadataComponents;
        validate: MetadataFactory.Validator;
      },
      from: string,
      escape: boolean,
    ): MetadataSchema => {
      const components: MetadataComponents = MetadataComponents.from(
        next.components,
      );
      const metadata: MetadataSchema = MetadataSchema.from(
        next.metadata,
        components.dictionary,
      );
      const metaErrors: MetadataFactory.IError[] = MetadataFactory.validate({
        options: {
          escape,
          constant: true,
          absorb: true,
          validate: next.validate, // @todo -> CHECK IN TYPIA
        },
        functor: next.validate, // @todo -> CHECK IN TYPIA
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
          metadata: cast(value, `exception (status: ${key})`, true),
        },
      ]),
    );
    const parameters: ITypedHttpRouteParameter[] =
      props.operation.parameters.map((p) => ({
        ...p,
        metadata: cast(
          p,
          `parameter (name: ${JSON.stringify(p.name)})`,
          p.category === "body" &&
            (p.contentType === "application/json" || p.encrypted === true),
        ),
      }));
    const success: ITypedHttpRouteSuccess = {
      ...props.operation.success,
      metadata: cast(
        props.operation.success,
        "success",
        props.operation.success.encrypted ||
          props.operation.success.contentType === "application/json",
      ),
      setHeaders: props.operation.jsDocTags
        .filter(
          (t) =>
            t.text?.length &&
            t.text[0]!.text &&
            (t.name === "setHeader" || t.name === "assignHeaders"),
        )
        .map((t) =>
          t.name === "setHeader"
            ? {
                type: "setter",
                source: t.text![0]!.text.split(" ")[0]!.trim(),
                target: t.text![0]!.text.split(" ")[1]?.trim(),
              }
            : {
                type: "assigner",
                source: t.text![0]!.text,
              },
        ),
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

  export const routeDictionary = (
    routes: Array<ITypedHttpRoute>,
  ): IMetadataDictionary => {
    renameDuplicateComponents(routes);
    const dictionary: IMetadataDictionary = {
      objects: new Map(),
      aliases: new Map(),
      arrays: new Map(),
      tuples: new Map(),
    };
    for (const route of routes) {
      for (const p of [
        ...route.pathParameters,
        ...route.queryParameters,
        ...route.headerParameters,
        ...(route.queryObject ? [route.queryObject] : []),
        ...(route.body ? [route.body] : []),
        ...(route.headerObject ? [route.headerObject] : []),
      ])
        enrollMetadata(dictionary, p.metadata);
      for (const e of Object.values(route.exceptions))
        enrollMetadata(dictionary, e.metadata);
      enrollMetadata(dictionary, route.success.metadata);
    }
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
  route: ITypedHttpRoute;
  signature: string;
  type: ComponentType;
}

const renameDuplicateComponents = (routes: ITypedHttpRoute[]): void => {
  const entries: IComponentEntry[] = [];
  for (const route of routes)
    for (const metadata of routeMetadatas(route))
      collectComponentEntries(entries, route, metadata);

  const used: Set<string> = new Set(entries.map((e) => e.type!.name));
  const groups: Map<string, IComponentEntry[]> = new Map();
  for (const entry of entries) {
    const key: string = `${entry.kind}:${entry.type!.name}`;
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
          used.add(name);
          return name;
        })();
      (entry.type as { name: string }).name = next;
    }
  }
  for (const route of routes)
    for (const metadata of routeMetadatas(route))
      clearMetadataNameCache(metadata);
};

const routeMetadatas = (route: ITypedHttpRoute): MetadataSchema[] => [
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
  route: ITypedHttpRoute,
  metadata: MetadataSchema,
  visited: ICollectVisited = createCollectVisited(),
): void => {
  if (visited.schemas.has(metadata)) return;
  visited.schemas.add(metadata);

  if (metadata.rest !== null)
    collectComponentEntries(entries, route, metadata.rest, visited);
  if (metadata.escaped !== null) {
    collectComponentEntries(entries, route, metadata.escaped.original, visited);
    collectComponentEntries(entries, route, metadata.escaped.returns, visited);
  }
  for (const func of metadata.functions) {
    for (const p of func.parameters)
      collectComponentEntries(entries, route, p.type, visited);
    collectComponentEntries(entries, route, func.output, visited);
  }
  for (const set of metadata.sets)
    collectComponentEntries(entries, route, set.value, visited);
  for (const map of metadata.maps) {
    collectComponentEntries(entries, route, map.key, visited);
    collectComponentEntries(entries, route, map.value, visited);
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
        collectComponentEntries(entries, route, elem, visited);
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
        collectComponentEntries(entries, route, p.key, visited);
        collectComponentEntries(entries, route, p.value, visited);
      }
    }
};

const componentEntry = <T extends ComponentType>(
  route: ITypedHttpRoute,
  kind: ComponentKind,
  type: T,
): IComponentEntry => ({
  kind,
  route,
  signature: componentSignature(type),
  type,
});

const componentSignature = (type: ComponentType): string =>
  JSON.stringify(type, (key, value) =>
    // `type` is the resolved back-reference attached by
    // `MetadataSchema.from`; it closes a cycle on recursive schemas.
    // `index` carries the per-route ordinal and is not part of the
    // component's identity.
    key === "index" || key === "type" ? undefined : value,
  );

const normalizeComponentNamespace = (name: string): string => {
  const next: string = name.replace(/[^A-Za-z0-9_$]/g, "_");
  return next.length ? next : "Route";
};

const escapeComponentName = (used: Set<string>, name: string): string =>
  used.has(name) ? escapeComponentName(used, `_${name}`) : name;

const clearMetadataNameCache = (
  metadata: MetadataSchema,
  visited: WeakSet<MetadataSchema> = new WeakSet(),
): void => {
  if (visited.has(metadata)) return;
  visited.add(metadata);
  (metadata as unknown as { name_?: string }).name_ = undefined;

  if (metadata.rest !== null) clearMetadataNameCache(metadata.rest, visited);
  if (metadata.escaped !== null) {
    clearMetadataNameCache(metadata.escaped.original, visited);
    clearMetadataNameCache(metadata.escaped.returns, visited);
  }
  for (const func of metadata.functions) {
    for (const p of func.parameters) clearMetadataNameCache(p.type, visited);
    clearMetadataNameCache(func.output, visited);
  }
  for (const set of metadata.sets) {
    (set as unknown as { name_?: string }).name_ = undefined;
    clearMetadataNameCache(set.value, visited);
  }
  for (const map of metadata.maps) {
    (map as unknown as { name_?: string }).name_ = undefined;
    clearMetadataNameCache(map.key, visited);
    clearMetadataNameCache(map.value, visited);
  }
  for (const array of metadata.arrays) {
    (array as unknown as { name_?: string }).name_ = undefined;
    clearMetadataNameCache(
      (array.type as MetadataArrayType as MetadataArrayType).value,
      visited,
    );
  }
  for (const tuple of metadata.tuples) {
    (tuple as unknown as { name_?: string }).name_ = undefined;
    for (const elem of (tuple.type as MetadataTupleType as MetadataTupleType)
      .elements)
      clearMetadataNameCache(elem, visited);
  }
  for (const alias of metadata.aliases) {
    (alias as unknown as { name_?: string }).name_ = undefined;
    clearMetadataNameCache(
      (alias.type as MetadataAliasType as MetadataAliasType).value,
      visited,
    );
  }
  for (const obj of metadata.objects) {
    (obj as unknown as { name_?: string }).name_ = undefined;
    for (const p of (obj.type as MetadataObjectType as MetadataObjectType)
      .properties) {
      clearMetadataNameCache(p.key, visited);
      clearMetadataNameCache(p.value, visited);
    }
  }
};

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

const uniqueComponents = <T extends { name: string }>(input: T[]): T[] => {
  const dict: Record<string, T> = {};
  for (const elem of input) {
    const oldbie: T | undefined = dict[elem.name];
    if (oldbie === undefined) dict[elem.name] = elem;
    else if (
      elem.name.includes(".") ||
      componentScore(oldbie) < componentScore(elem)
    )
      dict[elem.name] = elem;
  }
  return Object.values(dict);
};

const componentScore = (input: unknown): number =>
  JSON.stringify(input, (key, value) =>
    // Resolved-reference back-edges close cycles on recursive schemas;
    // skip them when scoring component "richness".
    key === "type" ? undefined : value,
  ).length;

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
    enrollMetadata(dictionary, metadata.escaped.original, visited);
    enrollMetadata(dictionary, metadata.escaped.returns, visited);
  }
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
  const oldbie: T | undefined = dict.get(elem.name);
  if (oldbie === elem) return false;
  if (oldbie === undefined) {
    dict.set(elem.name, elem);
    return true;
  } else if (
    elem.name.includes(".") ||
    componentScore(oldbie) < componentScore(elem)
  ) {
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
