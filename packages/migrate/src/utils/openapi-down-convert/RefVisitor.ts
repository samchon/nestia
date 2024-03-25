/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Recursively walk a JSON object and invoke a callback function
 * on each `{ "$ref" : "path" }` object found
 */

/**
 * Represents a JSON Reference object, such as
 * `{"$ref": "#/components/schemas/problemResponse" }`
 */
export interface RefObject {
  $ref: string;
}

/**
 * JsonNode represents a node within the OpenAPI object
 */
export type JsonNode = object | [] | string | boolean | null | number;

/** A JSON Schema object in an API def */
export type SchemaObject = object;

/**
 * Function signature for the visitRefObjects callback
 */
export type RefVisitor = (node: RefObject) => JsonNode;
/**
 * Function signature for the visitSchemaObjects callback
 */
export type SchemaVisitor = (node: SchemaObject) => SchemaObject;

/**
/**
 * Function signature for the walkObject callback
 */
export type ObjectVisitor = (node: object) => JsonNode;

/**
 * Test if a JSON node is a `{ $ref: "uri" }` object
 */
export function isRef(node: any): boolean {
  return (
    node !== null &&
    typeof node === "object" &&
    node.hasOwnProperty("$ref") &&
    typeof node["$ref"] === "string"
  );
}

/**
 * Walk a JSON object and apply `schemaCallback` when a JSON schema is found.
 * JSON Schema objects are items in components/schemas or in an item named `schema`
 * @param node a node in the OpenAPI document
 * @param schemaCallback the function to call on JSON schema objects
 * @return the modified (annotated) node
 */
export function visitSchemaObjects(
  node: any,
  schemaCallback: SchemaVisitor,
): any {
  const objectVisitor = (node: any): JsonNode => {
    if (node.hasOwnProperty("schema")) {
      const schema = node["schema"];
      if (schema != null && typeof schema === "object") {
        node["schema"] = schemaCallback(schema);
      }
    } else if (node.hasOwnProperty("schemas")) {
      const schemas = node["schemas"];
      if (schemas != null && typeof schemas === "object") {
        for (const schemaName in schemas) {
          const schema = schemas[schemaName];
          const newSchema = schemaCallback(schema);
          schemas[schemaName] = newSchema;
        }
      }
    }
    return node;
  };
  return walkObject(node, objectVisitor);
}

/**
 * Walk a JSON object and apply `refCallback` when a JSON `{$ref: url }` is found
 * @param node a node in the OpenAPI document
 * @param refCallback the function to call on JSON `$ref` objects
 * @return the modified (annotated) node
 */
export function visitRefObjects(node: any, refCallback: RefVisitor): any {
  const objectVisitor = (node: object): JsonNode => {
    if (isRef(node)) {
      return refCallback(node as RefObject);
    }
    return node;
  };
  return walkObject(node, objectVisitor);
}

/**
 * Walk a JSON object or array and apply objectCallback when a JSON object is found
 * @param node a node in the OpenAPI document
 * @param objectCallback the function to call on JSON objects
 * @param nav tracks where we are in the original document
 * @return the modified (annotated) node
 */
export function walkObject(
  node: object,
  objectCallback: ObjectVisitor,
): JsonNode {
  return walkObj(node);

  function walkObj(node: any): JsonNode {
    const object = objectCallback(node);
    if (object !== null && typeof object === "object") {
      const keys = [...Object.keys(node)]; // make copy since this code may re-enter objects
      for (const key of keys) {
        const val = node[key];
        if (Array.isArray(val)) {
          node[key] = walkArray(val as []);
        } else if (val !== null && typeof val === "object") {
          node[key] = walkObj(val);
        }
      }
    }
    return object;
  }

  function walkArray(array: JsonNode[]): JsonNode[] {
    for (let index = 0; index < array.length; index += 1) {
      const val = array[index] as JsonNode;
      if (val !== null && typeof val === "object") {
        array[index] = walkObj(val) as object;
      } else if (Array.isArray(val)) {
        array[index] = walkArray(val as JsonNode[]) as [];
      }
    }
    return array;
  }
}
