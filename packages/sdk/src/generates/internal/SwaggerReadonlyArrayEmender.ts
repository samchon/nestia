import { OpenApi } from "@typia/interface";

import {
  MetadataAliasType,
  MetadataArrayType,
  MetadataObjectType,
  MetadataSchema,
  MetadataTupleType,
} from "../../internal/legacy";

type JsonSchemaObject = OpenApi.IJsonSchema & Record<string, any>;

export namespace SwaggerReadonlyArrayEmender {
  export const emend = (props: {
    components: OpenApi.IComponents;
    schema: OpenApi.IJsonSchema | undefined;
    metadata: MetadataSchema;
  }): void => {
    const visited: IVisited = {
      aliases: new WeakSet(),
      arrays: new WeakSet(),
      objects: new WeakSet(),
      schemas: new WeakSet(),
      tuples: new WeakSet(),
    };
    visitMetadata({
      components: props.components,
      schema: props.schema,
      metadata: props.metadata,
      visited,
    });
  };
}

interface IVisited {
  aliases: WeakSet<MetadataAliasType>;
  arrays: WeakSet<MetadataArrayType>;
  objects: WeakSet<MetadataObjectType>;
  schemas: WeakSet<MetadataSchema>;
  tuples: WeakSet<MetadataTupleType>;
}

const visitMetadata = (props: {
  components: OpenApi.IComponents;
  schema: OpenApi.IJsonSchema | undefined;
  metadata: MetadataSchema;
  visited: IVisited;
}): void => {
  if (props.schema !== undefined && isReadonlyArrayLike(props.metadata))
    setReadonlyArray(props.schema);

  if (props.visited.schemas.has(props.metadata)) return;
  props.visited.schemas.add(props.metadata);

  for (const array of props.metadata.arrays) {
    const type: MetadataArrayType | undefined = array.type as
      | MetadataArrayType
      | undefined;
    if (type !== undefined)
      visitArrayType({
        components: props.components,
        schema: arraySchema(props.schema),
        type,
        visited: props.visited,
      });
  }
  for (const tuple of props.metadata.tuples) {
    const type: MetadataTupleType | undefined = tuple.type as
      | MetadataTupleType
      | undefined;
    if (type !== undefined)
      visitTupleType({
        components: props.components,
        schema: props.schema,
        type,
        visited: props.visited,
      });
  }
  for (const alias of props.metadata.aliases) {
    const type: MetadataAliasType | undefined = alias.type as
      | MetadataAliasType
      | undefined;
    if (type !== undefined)
      visitAliasType({
        components: props.components,
        schema: componentSchema(props.components, type.name),
        type,
        visited: props.visited,
      });
  }
  for (const object of props.metadata.objects) {
    const type: MetadataObjectType | undefined = object.type as
      | MetadataObjectType
      | undefined;
    if (type !== undefined)
      visitObjectType({
        components: props.components,
        type,
        visited: props.visited,
      });
  }
};

const visitAliasType = (props: {
  components: OpenApi.IComponents;
  schema: OpenApi.IJsonSchema | undefined;
  type: MetadataAliasType;
  visited: IVisited;
}): void => {
  if (props.visited.aliases.has(props.type)) return;
  props.visited.aliases.add(props.type);
  if (props.schema !== undefined && isReadonlyArrayLike(props.type.value))
    setReadonlyArray(props.schema);
  visitMetadata({
    components: props.components,
    schema: props.schema,
    metadata: props.type.value,
    visited: props.visited,
  });
};

const visitArrayType = (props: {
  components: OpenApi.IComponents;
  schema: OpenApi.IJsonSchema | undefined;
  type: MetadataArrayType;
  visited: IVisited;
}): void => {
  if (props.visited.arrays.has(props.type)) return;
  props.visited.arrays.add(props.type);
  const component: OpenApi.IJsonSchema | undefined = componentSchema(
    props.components,
    props.type.name,
  );
  if (component !== undefined && isReadonlyArrayName(props.type.name))
    setReadonlyArray(component);
  visitMetadata({
    components: props.components,
    schema: arraySchema(props.schema ?? component),
    metadata: props.type.value,
    visited: props.visited,
  });
};

const visitTupleType = (props: {
  components: OpenApi.IComponents;
  schema: OpenApi.IJsonSchema | undefined;
  type: MetadataTupleType;
  visited: IVisited;
}): void => {
  if (props.visited.tuples.has(props.type)) return;
  props.visited.tuples.add(props.type);
  const component: OpenApi.IJsonSchema | undefined = componentSchema(
    props.components,
    props.type.name,
  );
  if (component !== undefined && isReadonlyArrayName(props.type.name))
    setReadonlyArray(component);
  const schema: JsonSchemaObject | undefined = objectSchema(
    props.schema ?? component,
  );
  props.type.elements.forEach((metadata, index) =>
    visitMetadata({
      components: props.components,
      schema: Array.isArray(schema?.prefixItems)
        ? schema.prefixItems[index]
        : undefined,
      metadata,
      visited: props.visited,
    }),
  );
};

const visitObjectType = (props: {
  components: OpenApi.IComponents;
  type: MetadataObjectType;
  visited: IVisited;
}): void => {
  if (props.visited.objects.has(props.type)) return;
  props.visited.objects.add(props.type);

  const schema: JsonSchemaObject | undefined = objectSchema(
    componentSchema(props.components, props.type.name),
  );
  const properties: Record<string, OpenApi.IJsonSchema> | undefined =
    schema?.properties as Record<string, OpenApi.IJsonSchema> | undefined;
  for (const property of props.type.properties) {
    const key: string | undefined = propertyKey(property.key);
    const child: OpenApi.IJsonSchema | undefined =
      key === undefined ? undefined : properties?.[key];
    visitMetadata({
      components: props.components,
      schema: child,
      metadata: property.value,
      visited: props.visited,
    });
  }
};

const isReadonlyArrayLike = (
  metadata: MetadataSchema,
  visited: WeakSet<MetadataSchema> = new WeakSet(),
): boolean => {
  if (visited.has(metadata)) return false;
  visited.add(metadata);
  const name: unknown = (metadata as { name?: unknown }).name;
  return (
    (typeof name === "string" && isReadonlyArrayName(name)) ||
    metadata.arrays.some((array) => isReadonlyArrayName(array.name)) ||
    metadata.tuples.some((tuple) => isReadonlyArrayName(tuple.name)) ||
    metadata.aliases.some((alias) => {
      const type: MetadataAliasType | undefined = alias.type as
        | MetadataAliasType
        | undefined;
      return type !== undefined && isReadonlyArrayLike(type.value, visited);
    })
  );
};

const isReadonlyArrayName = (name: string): boolean => {
  const trimmed: string = name.trim();
  const compact: string = name.replace(/\s+/g, "");
  return (
    compact === "ReadonlyArray" ||
    compact.startsWith("ReadonlyArray<") ||
    compact.startsWith("readonly[") ||
    trimmed.startsWith("readonly ")
  );
};

const componentSchema = (
  components: OpenApi.IComponents,
  name: string,
): OpenApi.IJsonSchema | undefined =>
  (components.schemas ?? {})[name] as OpenApi.IJsonSchema | undefined;

const arraySchema = (
  schema: OpenApi.IJsonSchema | undefined,
): OpenApi.IJsonSchema | undefined => {
  const obj: JsonSchemaObject | undefined = objectSchema(schema);
  return obj?.items as OpenApi.IJsonSchema | undefined;
};

const objectSchema = (
  schema: OpenApi.IJsonSchema | undefined,
): JsonSchemaObject | undefined =>
  typeof schema === "object" && schema !== null
    ? (schema as JsonSchemaObject)
    : undefined;

const propertyKey = (metadata: MetadataSchema): string | undefined => {
  const value: unknown = metadata.constants[0]?.values[0]?.value;
  return typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : undefined;
};

const setReadonlyArray = (schema: OpenApi.IJsonSchema): void => {
  const obj: JsonSchemaObject | undefined = objectSchema(schema);
  if (obj !== undefined) obj["x-readonly-array"] = true;
};
