// Internal utilities for the plain metadata emitted by the SDK's Go
// contributor in `packages/sdk/native/sdk/sdk_transform.go`. These adapters
// preserve the names formerly provided by `@typia/core` without rebuilding
// its runtime classes.
//
// The utilities index components, resolve references, read metadata flags
// and precomputed fields, validate SDK policy, and read the precomputed JSON
// schemas, including the per-property ones decomposed parameters use.
import type {
  IJsonSchemaCollection,
  IMetadataComponents,
  IMetadataSchema,
  IMetadataTypeTag,
  OpenApi,
} from "@typia/interface";

// Module augmentation: typia v13's `IReference` carries only a symbolic
// `name` + tags, but `MetadataSchema.from(plain, dictionary)` mutates
// each reference to also hold the resolved target type so downstream
// sdk code can keep its `ref.type!.value` / `ref.type!.elements` access
// pattern from the legacy `@typia/core` `MetadataArray` / `MetadataTuple`
// classes. The field is optional because it is only populated after a
// `MetadataSchema.from` walk against a dictionary.
declare module "@typia/interface" {
  namespace IMetadataSchema {
    interface IReference {
      type?: IArrayType | ITupleType | IObjectType | IAliasType;
    }
  }
}

/**
 * Plain `IMetadataSchema` augmented with the fields the nestia transform
 * pre-bakes. `size`, `name`, and `empty` replace the methods the legacy
 * `MetadataSchema` class exposed; `jsonSchema` is the OpenAPI 3.1 conversion
 * typia's Go-side produces but does not expose to JS at runtime.
 *
 * Fields are declared optional so that nested `IMetadataSchema` values
 * (`metadata.rest`, `metadata.escaped.original`, `IObjectType.value`, …) —
 * which are not top-level route inputs and therefore do not carry the pre-baked
 * overlay — still satisfy the type when passed through legacy utilities. The
 * utilities read the fields via the optional accessor and fall back when
 * absent.
 */
export interface IReflectMetadata extends IMetadataSchema {
  size?: number;
  name?: string;
  empty?: boolean;
  jsonSchema?: IReflectJsonSchema;
}

export interface IReflectJsonSchema {
  version: "3.0" | "3.1";
  components: OpenApi.IComponents;
  schema: OpenApi.IJsonSchema;

  /**
   * The schema of each property of the first object type, keyed by property
   * name and resolved against {@link components}: the property schema typia's
   * object schema holds, without the title, description, deprecation, and
   * readOnly an OpenAPI parameter carries in its own fields or cannot use.
   *
   * Baked on the resolved schema of route parameters only, for the Swagger
   * generator to decompose a query or headers object into one parameter per
   * property. A property typia's object schema omits (`@hidden`, `@ignore`,
   * `@internal`, or a value with no JSON form) has no entry.
   */
  properties?: Record<string, OpenApi.IJsonSchema>;
}

/**
 * Cross-reference dictionary produced by `MetadataComponents.from`. Each map is
 * keyed by the entry's `.name`, matching the lookup pattern the legacy
 * `MetadataComponents.dictionary` getter offered.
 */
export interface IMetadataDictionary {
  objects: Map<string, IMetadataSchema.IObjectType>;
  aliases: Map<string, IMetadataSchema.IAliasType>;
  arrays: Map<string, IMetadataSchema.IArrayType>;
  tuples: Map<string, IMetadataSchema.ITupleType>;
}

// ---------------------------------------------------------------------
//  Type aliases — the legacy class names ↔ typia v13 plain interfaces.
// ---------------------------------------------------------------------

export type MetadataSchema = IMetadataSchema;
export type MetadataComponents = IMetadataComponents & {
  dictionary: IMetadataDictionary;
};
export type MetadataAliasType = IMetadataSchema.IAliasType;
export type MetadataArrayType = IMetadataSchema.IArrayType;
export type MetadataTupleType = IMetadataSchema.ITupleType;
export type MetadataObjectType = IMetadataSchema.IObjectType;
export type MetadataAtomic = IMetadataSchema.IAtomic;
/**
 * Flattened constant-value shape: typia v13 splits `IConstant.IValue<T>` by the
 * atomic discriminator, but sdk's literal writer just needs the runtime `value`
 * payload, so collapse the union to a single ergonomic shape.
 */
export interface MetadataConstantValue {
  value: string | number | bigint | boolean;
  tags: IMetadataTypeTag[][];
}
export type MetadataEscaped = IMetadataSchema.IEscaped;
export type MetadataProperty = IMetadataSchema.IProperty;

/**
 * Reference to a named array/tuple/object/alias type. typia v13's plain
 * `IReference` carries only the symbolic `name` + tags; the legacy class
 * additionally exposed `.type` as a getter that resolved against the
 * dictionary. `MetadataSchema.from` walks the metadata tree once and attaches
 * the resolved `.type` field so downstream sdk code can keep its `ref.type`
 * access pattern.
 */
export type MetadataArray = IMetadataSchema.IReference & {
  type: MetadataArrayType;
};
export type MetadataTuple = IMetadataSchema.IReference & {
  type: MetadataTupleType;
};
export type MetadataObject = IMetadataSchema.IReference & {
  type: MetadataObjectType;
};
export type MetadataAlias = IMetadataSchema.IReference & {
  type: MetadataAliasType;
};

// ---------------------------------------------------------------------
//  Metadata utility functions — read pre-baked fields, no class wrapping.
// ---------------------------------------------------------------------

/** `MetadataSchema.size()` → reads the pre-baked `size` field. */
export const sizeOf = (m: IMetadataSchema): number =>
  (m as IReflectMetadata).size ?? 0;

/** `MetadataSchema.getName()` → reads the pre-baked `name` field. */
export const nameOf = (m: IMetadataSchema): string =>
  (m as IReflectMetadata).name ?? "";

/** `MetadataSchema.empty()` → reads the pre-baked `empty` field. */
export const emptyOf = (m: IMetadataSchema): boolean =>
  (m as IReflectMetadata).empty ?? false;

/** A property is required only when neither omission nor undefined is allowed. */
export const isRequiredOf = (m: IMetadataSchema): boolean =>
  m.required && !m.optional;

/**
 * Reads a constant's or a type tag's value as the SDK's Go contributor writes
 * it.
 *
 * JSON holds neither a bigint nor NaN or ±Infinity, so the metadata carries a
 * bigint value as its decimal digits and a non-finite number by its name
 * (`"Infinity"`), both as strings. `type` is the value's own type, the
 * constant's type or the tag's target, and the only type such a string can
 * stand for; every other value, a composite one included, is returned as it
 * is.
 */
export const decodeMetadataValue = (type: string, value: unknown): unknown => {
  if (type === "bigint")
    return (typeof value === "string" && /^-?[0-9]+$/.test(value)) ||
      (typeof value === "number" && Number.isInteger(value))
      ? BigInt(value)
      : value;
  else if (type === "number")
    return value === "NaN" || value === "Infinity" || value === "-Infinity"
      ? Number(value)
      : value;
  return value;
};

/**
 * Equivalent of the legacy `MetadataSchema.isSoleLiteral()` method: `true` when
 * the schema represents exactly one constant literal value and nothing else.
 * Used by sdk's type printer to fall back to literal emission instead of a
 * union.
 */
export const isSoleLiteralOf = (m: IMetadataSchema): boolean => {
  if (m.any) return false;
  if (m.nullable) return false;
  if (m.functions.length !== 0) return false;
  if (m.atomics.length !== 0) return false;
  if (m.templates.length !== 0) return false;
  if (m.arrays.length !== 0) return false;
  if (m.tuples.length !== 0) return false;
  if (m.objects.length !== 0) return false;
  if (m.aliases.length !== 0) return false;
  if (m.natives.length !== 0) return false;
  if (m.sets.length !== 0) return false;
  if (m.maps.length !== 0) return false;
  if (m.rest !== null) return false;
  if (m.escaped !== null) return false;
  if (m.constants.length !== 1) return false;
  return m.constants[0]!.values.length === 1;
};

// ---------------------------------------------------------------------
//  `MetadataComponents.from(plain)` — namespace utility, not a class.
// ---------------------------------------------------------------------

export namespace MetadataComponents {
  export const from = (plain: IMetadataComponents): MetadataComponents => {
    const dictionary: IMetadataDictionary = {
      objects: new Map(plain.objects.map((o) => [o.name, o])),
      aliases: new Map(plain.aliases.map((a) => [a.name, a])),
      arrays: new Map(plain.arrays.map((a) => [a.name, a])),
      tuples: new Map(plain.tuples.map((t) => [t.name, t])),
    };
    return Object.assign({}, plain, { dictionary });
  };
}

// ---------------------------------------------------------------------
//  `MetadataSchema.from(plain, dictionary)` — reference resolution.
// ---------------------------------------------------------------------

export namespace MetadataSchema {
  /**
   * Walks the metadata tree and attaches the resolved `.type` field to every
   * `IReference` it encounters, using the supplied dictionary as the lookup
   * index. This is idempotent — references whose `.type` has already been
   * resolved are left alone — and mutates the input, matching the in-place
   * resolution model `@typia/core` 12.x used.
   */
  export const from = (
    plain: IMetadataSchema,
    dictionary?: IMetadataDictionary,
  ): IMetadataSchema => {
    if (dictionary !== undefined) {
      attachTypes(plain, dictionary, new WeakSet());
    }
    return plain;
  };
}

/**
 * The walk tracks visited _targets_ (the IObjectType / IArrayType / … instances
 * reached through the dictionary), not the wrapper schemas. Wrapper schemas are
 * reconstructed on the JS side and are not shared across recursive references,
 * so a `visited<IMetadataSchema>` set never matches and the walk would recurse
 * forever on cycles like `interface Node { children: Node[] }`.
 */
const attachTypes = (
  schema: IMetadataSchema | null | undefined,
  dict: IMetadataDictionary,
  visited: WeakSet<object>,
): void => {
  if (schema === null || schema === undefined) return;
  attachReferences(schema.arrays, dict.arrays, visited, (target) =>
    attachTypes(target.value, dict, visited),
  );
  attachReferences(schema.tuples, dict.tuples, visited, (target) => {
    for (const elem of target.elements) attachTypes(elem, dict, visited);
  });
  attachReferences(schema.objects, dict.objects, visited, (target) => {
    for (const prop of target.properties)
      attachTypes(prop.value, dict, visited);
  });
  attachReferences(schema.aliases, dict.aliases, visited, (target) =>
    attachTypes(target.value, dict, visited),
  );
  for (const fn of schema.functions ?? []) {
    for (const param of fn.parameters) attachTypes(param.type, dict, visited);
    attachTypes(fn.output, dict, visited);
  }
  for (const set of schema.sets ?? []) attachTypes(set.value, dict, visited);
  for (const map of schema.maps ?? []) {
    attachTypes(map.key, dict, visited);
    attachTypes(map.value, dict, visited);
  }
  if (schema.rest) attachTypes(schema.rest, dict, visited);
  if (schema.escaped) {
    attachTypes(schema.escaped.original, dict, visited);
    attachTypes(schema.escaped.returns, dict, visited);
  }
};

const attachReferences = <Target extends { name: string }>(
  refs: ReadonlyArray<IMetadataSchema.IReference> | undefined,
  index: Map<string, Target>,
  visited: WeakSet<object>,
  walk: (target: Target) => void,
): void => {
  if (!refs) return;
  for (const ref of refs) {
    const mutable = ref as IMetadataSchema.IReference & { type?: Target };
    if (mutable.type === undefined) {
      const target = index.get(ref.name);
      if (target !== undefined) (mutable as { type?: Target }).type = target;
    }
    if (mutable.type !== undefined && visited.has(mutable.type) === false) {
      visited.add(mutable.type);
      walk(mutable.type);
    }
  }
};

// ---------------------------------------------------------------------
//  Validators — the typia native transform already enforces most of the
//  invariants the legacy `@typia/core` 12.x helpers re-checked at runtime,
//  but a few JSON-serialization constraints (bare `bigint` payloads, etc.)
//  are SDK-policy choices that the SDK still has to flag itself.
// ---------------------------------------------------------------------

export namespace MetadataFactory {
  export interface IExplore {
    object: IMetadataSchema.IObjectType | null;
    property: string | null;
    parameter: string | null;
    output: boolean;
  }
  export interface IError {
    name: string;
    explore: IExplore;
    messages: string[];
  }
  export type Validator = (props: {
    metadata: IMetadataSchema;
    explore: IExplore;
  }) => string[];

  /**
   * Walks the metadata tree once, invoking the provided validator on each
   * visited node, and accumulates the produced messages into `IError` entries.
   * The walk skips back-edges through references so cyclic structures
   * terminate. This is a faithful reimplementation of the legacy `@typia/core`
   * walker, kept lean: the typia native transform has already validated
   * structural invariants, so the validator is only called for SDK-side policy
   * checks (JSON-serializability, query/header atomic-only rules, …).
   */
  export const validate = (props: {
    options?: unknown;
    functor: Validator;
    metadata: IMetadataSchema;
  }): IError[] => {
    const errors: IError[] = [];
    // Tracks visited *targets* (IObjectType / IArrayType / IAliasType /
    // ITupleType) so recursive schemas like `interface Node { children:
    // Node[] }` terminate. Wrapper IMetadataSchema instances are not
    // shared across recursive references, so they cannot stand in for
    // the visit marker.
    const visited = new WeakSet<object>();
    const visit = (metadata: IMetadataSchema, explore: IExplore): void => {
      const messages = props.functor({ metadata, explore });
      if (messages.length)
        errors.push({ name: nameOf(metadata), explore, messages });
      for (const obj of metadata.objects) {
        const type = (
          obj as IMetadataSchema.IReference & {
            type?: IMetadataSchema.IObjectType;
          }
        ).type;
        if (type === undefined || visited.has(type)) continue;
        visited.add(type);
        for (const prop of type.properties)
          visit(prop.value, {
            object: type,
            property:
              nameOf(prop.key) ||
              String(prop.key.constants[0]?.values[0]?.value ?? ""),
            parameter: null,
            output: explore.output,
          });
      }
      for (const arr of metadata.arrays) {
        const type = (
          arr as IMetadataSchema.IReference & {
            type?: IMetadataSchema.IArrayType;
          }
        ).type;
        if (type === undefined || visited.has(type)) continue;
        visited.add(type);
        visit(type.value, explore);
      }
      for (const tuple of metadata.tuples) {
        const type = (
          tuple as IMetadataSchema.IReference & {
            type?: IMetadataSchema.ITupleType;
          }
        ).type;
        if (type === undefined || visited.has(type)) continue;
        visited.add(type);
        for (const elem of type.elements) visit(elem, explore);
      }
      for (const alias of metadata.aliases) {
        const type = (
          alias as IMetadataSchema.IReference & {
            type?: IMetadataSchema.IAliasType;
          }
        ).type;
        if (type === undefined || visited.has(type)) continue;
        visited.add(type);
        visit(type.value, explore);
      }
      if (metadata.escaped) {
        visit(metadata.escaped.original, explore);
        visit(metadata.escaped.returns, explore);
      }
    };
    visit(props.metadata, {
      object: null,
      property: null,
      parameter: null,
      output: false,
    });
    return errors;
  };
}

export namespace JsonMetadataFactory {
  /**
   * Rejects metadata that cannot be losslessly JSON-serialized. The typia
   * native runtime already screens out most structurally invalid types, so this
   * only adds the JSON-policy bans the legacy `@typia/core` walker enforced —
   * bare `bigint` payloads, function-typed properties, and `Map` / `Set`
   * containers that have no canonical JSON representation.
   */
  export const validate: MetadataFactory.Validator = (props) => {
    const messages: string[] = [];
    if (props.metadata.atomics.some((a) => a.type === "bigint"))
      messages.push("does not allow bigint type in JSON.");
    if (props.metadata.functions.length !== 0)
      messages.push("does not allow function type in JSON.");
    if (props.metadata.sets.length !== 0)
      messages.push("does not allow Set type in JSON.");
    if (props.metadata.maps.length !== 0)
      messages.push("does not allow Map type in JSON.");
    return messages;
  };
}

export namespace HttpQueryProgrammer {
  export const validate: MetadataFactory.Validator = () => [];
}

export namespace HttpHeadersProgrammer {
  export const validate: MetadataFactory.Validator = () => [];
}

export namespace HttpParameterProgrammer {
  export const validate: MetadataFactory.Validator = () => [];
}

export namespace HttpFormDataProgrammer {
  export const validate: MetadataFactory.Validator = () => [];
}

// ---------------------------------------------------------------------
//  `JsonSchemasProgrammer.writeSchemas` — consumes the per-metadata
//  pre-baked `jsonSchema` field the nestia transform emits.
// ---------------------------------------------------------------------

export namespace JsonSchemasProgrammer {
  /**
   * Consumes the per-metadata `jsonSchema` field the nestia transform
   * pre-bakes. Top-level route metadata (success / parameter / exception)
   * carries a baked schema whenever typia can describe the type. Metadata
   * without one falls back to a minimal JS-side converter that reads only the
   * atomic kinds — no type tags, template patterns, or constant annotations —
   * so it is no substitute for the bake.
   *
   * The schemas and components are copies. The bake belongs to the route
   * metadata, which every composition in the process reads, while the composer
   * edits what it is given in place (the readonly-array emender), and so can a
   * `SwaggerCustomizer`; handing the bake out by reference let each document
   * inherit the previous one's edits.
   */
  export const writeSchemas = (props: {
    version: "3.0" | "3.1";
    metadatas: readonly IMetadataSchema[];
  }): IJsonSchemaCollection => {
    const components: OpenApi.IComponents = { schemas: {} };
    const schemas: OpenApi.IJsonSchema[] = [];
    for (const m of props.metadatas) {
      const baked = (m as IReflectMetadata).jsonSchema;
      if (baked !== undefined) {
        schemas.push(copy(baked.schema));
        Object.assign(
          (components.schemas ??= {}),
          baked.components.schemas ?? {},
        );
      } else {
        schemas.push(schemaFromMetadata(m));
      }
    }
    // Copied once the last bake of each name has won, rather than per bake.
    if (components.schemas !== undefined)
      components.schemas = copy(components.schemas);
    return {
      version: props.version,
      components,
      schemas,
    } as IJsonSchemaCollection;
  };

  /**
   * Writes the schema of one property of `metadata`'s first object type, for a
   * decomposed query or headers parameter.
   *
   * Reads the schema baked beside `metadata`'s own schema (see
   * {@link IReflectJsonSchema.properties}), resolved against the same
   * components. The schema and components are copies, for the reason
   * {@link writeSchemas} gives. Returns `null` when that bake exists but has no
   * entry for the property, because typia's object schema omits it, so no
   * parameter describes it either. Only metadata the transform did not bake
   * falls back to {@link writeSchemas} over the property value.
   */
  export const writeProperty = (props: {
    version: "3.0" | "3.1";
    metadata: IMetadataSchema;
    key: string;
    value: IMetadataSchema;
  }): IJsonSchemaCollection | null => {
    const properties: Record<string, OpenApi.IJsonSchema> | undefined = (
      props.metadata as IReflectMetadata
    ).jsonSchema?.properties;
    if (properties === undefined)
      return writeSchemas({
        version: props.version,
        metadatas: [props.value],
      });
    if (Object.prototype.hasOwnProperty.call(properties, props.key) === false)
      return null;
    return {
      version: props.version,
      components: copy(
        (props.metadata as IReflectMetadata).jsonSchema!.components,
      ),
      schemas: [copy(properties[props.key]!)],
    } as IJsonSchemaCollection;
  };
}

/** Deep copy of baked data, which is parsed JSON, so JSON copies it exactly. */
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const schemaFromMetadata = (m: IMetadataSchema): OpenApi.IJsonSchema => {
  const union: OpenApi.IJsonSchema[] = [];
  if (m.nullable) union.push({ type: "null" } as OpenApi.IJsonSchema);
  for (const atomic of m.atomics)
    union.push(schemaFromAtomic(atomic) as OpenApi.IJsonSchema);
  for (const constant of m.constants)
    for (const value of constant.values)
      union.push({
        const: jsonValue(decodeMetadataValue(constant.type, value.value)),
      } as unknown as OpenApi.IJsonSchema);
  for (const tpl of m.templates) {
    union.push({ type: "string" } as OpenApi.IJsonSchema);
    void tpl;
  }
  for (const arr of m.arrays) {
    const inner = (
      arr as IMetadataSchema.IReference & {
        type?: IMetadataSchema.IArrayType;
      }
    ).type;
    union.push({
      type: "array",
      items: inner
        ? schemaFromMetadata(inner.value)
        : ({} as OpenApi.IJsonSchema),
    } as unknown as OpenApi.IJsonSchema);
  }
  for (const obj of m.objects)
    union.push({
      $ref: `#/components/schemas/${obj.name}`,
    } as unknown as OpenApi.IJsonSchema);
  for (const alias of m.aliases)
    union.push({
      $ref: `#/components/schemas/${alias.name}`,
    } as unknown as OpenApi.IJsonSchema);
  if (m.any || union.length === 0) return {} as OpenApi.IJsonSchema;
  if (union.length === 1) return union[0]!;
  return { oneOf: union } as unknown as OpenApi.IJsonSchema;
};

/**
 * A value as a JSON document holds it: the number a bigint is, and null for a
 * non-finite number, as `JSON.stringify` writes it.
 */
const jsonValue = (value: unknown): unknown =>
  typeof value === "bigint"
    ? Number(value)
    : typeof value === "number" && Number.isFinite(value) === false
      ? null
      : value;

const schemaFromAtomic = (atomic: IMetadataSchema.IAtomic): unknown => {
  if (atomic.type === "boolean") return { type: "boolean" };
  if (atomic.type === "bigint" || atomic.type === "number")
    return { type: atomic.type === "bigint" ? "integer" : "number" };
  if (atomic.type === "string") return { type: "string" };
  return {};
};
