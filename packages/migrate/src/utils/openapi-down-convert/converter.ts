/** OpenAPI Down Converted - convert an OAS document from OAS 3.1 to OAS 3.0 */
import {
  JsonNode,
  SchemaObject,
  SchemaVisitor,
  visitRefObjects,
  visitSchemaObjects,
  walkObject,
} from "./RefVisitor";

/** Lightweight OAS document top-level fields */
interface OpenAPI3 {
  openapi: string;
  info: object;
  paths: object;
  components: object;
  tags: object;
}

/** Options for the converter instantiation */
export interface ConverterOptions {
  /** If `true`, log conversion transformations to stderr */
  verbose?: boolean;
  /**
   * If `true`, remove `id` values in schema examples, to bypass [Spectral issue
   * 2081](https://github.com/stoplightio/spectral/issues/2081)
   */
  deleteExampleWithId?: boolean;
  /** If `true`, replace a `$ref` object that has siblings into an `allOf` */
  allOfTransform?: boolean;

  /** The authorizationUrl for openIdConnect -> oauth2 transformation */
  authorizationUrl?: string;
  /** The tokenUrl for openIdConnect -> oauth2 transformation */
  tokenUrl?: string;
  /**
   * Name of YAML/JSON file with scope descriptions. This is a simple map in the
   * format `{ scope1: "description of scope1", ... }`
   */
  scopeDescriptionFile?: string;
  /**
   * Earlier versions of the tool converted $comment to x-comment in JSON
   * Schemas. The tool now deletes $comment values by default. Use this option
   * to preserve the conversion and not delete comments.
   */
  convertSchemaComments?: boolean;
}

export class Converter {
  private openapi30: OpenAPI3;
  private verbose = false;
  private deleteExampleWithId = false;
  private allOfTransform = false;
  private authorizationUrl: string;
  /** The tokenUrl for openIdConnect -> oauth2 transformation */
  private tokenUrl: string;
  private scopeDescriptions = undefined;
  private convertSchemaComments = false;
  private returnCode = 0;

  /**
   * Construct a new Converter
   *
   * @throws Error if the scopeDescriptionFile (if specified) cannot be read or
   *   parsed as YAML/JSON
   */
  constructor(openapiDocument: object, options?: ConverterOptions) {
    this.openapi30 = Converter.deepClone(openapiDocument) as OpenAPI3;
    this.verbose = Boolean(options?.verbose);
    this.deleteExampleWithId = Boolean(options?.deleteExampleWithId);
    this.allOfTransform = Boolean(options?.allOfTransform);
    this.authorizationUrl =
      options?.authorizationUrl || "https://www.example.com/oauth2/authorize";
    this.tokenUrl = options?.tokenUrl || "https://www.example.com/oauth2/token";
    this.loadScopeDescriptions(options?.scopeDescriptionFile);
    this.convertSchemaComments = !!options?.convertSchemaComments;
  }

  /**
   * Load the scopes.yaml file and save in this.scopeDescriptions
   *
   * @throws Error if the file cannot be read or parsed as YAML/JSON
   */
  private loadScopeDescriptions(scopeDescriptionFile?: string) {
    if (!scopeDescriptionFile) {
      return;
    }
  }

  /**
   * Log a message to console.warn stream if verbose is true
   *
   * @param message Parameters for console.warn
   */
  private log(...message: any[]) {
    if (this.verbose) {
      this.warn(...message);
    }
  }

  /**
   * Log a message to console.warn stream. Prefix the message string with
   * `Warning: ` if it does not already have that text.
   *
   * @param message Parameters for console.warn
   */
  private warn(...message: any[]) {
    if (!message[0].startsWith("Warning")) {
      message[0] = `Warning: ${message[0]}`;
    }
    console.warn(...message);
  }

  /**
   * Log an error message to `console.error` stream. Prefix the message string
   * with `Error: ` if it does not already start with `'Error'`. Increments the
   * `returnCode`, causing the CLI to throw an Error when done.
   *
   * @param message Parameters for `console.error`
   */
  private error(...message: any[]) {
    if (!message[0].startsWith("Error")) {
      message[0] = `Error: ${message[0]}`;
    }
    this.returnCode++;
    console.error(...message);
  }

  /**
   * Convert the OpenAPI document to 3.0
   *
   * @returns The converted document. The input is not modified.
   */
  public convert(): object {
    this.log("Converting from OpenAPI 3.1 to 3.0");
    this.openapi30.openapi = "3.0.3";
    this.removeLicenseIdentifier();
    this.convertSchemaRef();
    this.simplifyNonSchemaRef();
    if (this.scopeDescriptions) {
      this.convertSecuritySchemes();
    }
    this.convertJsonSchemaExamples();
    this.convertJsonSchemaContentEncoding();
    this.convertJsonSchemaContentMediaType();
    this.convertConstToEnum();
    this.convertNullableTypeArray();
    this.removeWebhooksObject();
    this.removeUnsupportedSchemaKeywords();
    if (this.convertSchemaComments) {
      this.renameSchema$comment();
    } else {
      this.deleteSchema$comment();
    }
    if (this.returnCode > 0) {
      throw new Error("Cannot down convert this OpenAPI definition.");
    }
    return this.openapi30;
  }

  /**
   * OpenAPI 3.1 uses JSON Schema 2020-12 which allows schema `examples`;
   * OpenAPI 3.0 uses JSON Scheme Draft 7 which only allows `example`. Replace
   * all `examples` with `example`, using `examples[0]`
   */
  convertJsonSchemaExamples() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      for (const key in schema) {
        const subSchema = schema[key];
        if (subSchema !== null && typeof subSchema === "object") {
          if (key === "examples") {
            const examples = schema["examples"];
            if (Array.isArray(examples) && examples.length > 0) {
              delete schema["examples"];
              const first = examples[0];
              if (
                this.deleteExampleWithId &&
                first != null &&
                typeof first === "object" &&
                first.hasOwnProperty("id")
              ) {
                this.log(
                  `Deleted schema example with \`id\` property:\n${this.json(examples)}`,
                );
              } else {
                schema["example"] = first;
                this.log(
                  `Replaces examples with examples[0]. Old examples:\n${this.json(examples)}`,
                );
              }
              // TODO: Add an else here to check example for `id` and delete the example if this.deleteExampleWithId
              // We've put most of those in `examples` so this is probably not needed, but it would be more robust.
            }
          } else {
            schema[key] = walkObject(subSchema, schemaVisitor);
          }
        }
      }
      return schema;
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  private walkNestedSchemaObjects(schema: any, schemaVisitor: any) {
    for (const key in schema) {
      const subSchema = schema[key];
      if (subSchema !== null && typeof subSchema === "object") {
        schema[key] = walkObject(subSchema, schemaVisitor);
      }
    }
    return schema;
  }

  /**
   * OpenAPI 3.1 uses JSON Schema 2020-12 which allows `const` OpenAPI 3.0 uses
   * JSON Scheme Draft 7 which only allows `enum`. Replace all `const: value`
   * with `enum: [ value ]`
   */
  convertConstToEnum() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      if (schema["const"]) {
        const constant = schema["const"];
        delete schema["const"];
        schema["enum"] = [constant];
        this.log(`Converted const: ${constant} to enum`);
      }
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  /**
   * Convert 2-element type arrays containing 'null' to string type and
   * `nullable: true`
   */
  convertNullableTypeArray() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      if (schema.hasOwnProperty("type")) {
        const schemaType = schema["type"];
        if (
          Array.isArray(schemaType) &&
          schemaType.length === 2 &&
          schemaType.includes("null")
        ) {
          const nonNull = schemaType.filter((_) => _ !== "null")[0];
          schema["type"] = nonNull;
          schema["nullable"] = true;
          this.log(`Converted schema type array to nullable`);
        }
      }
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  removeWebhooksObject() {
    if (Object.hasOwnProperty.call(this.openapi30, "webhooks")) {
      this.log(`Deleted webhooks object`);
      delete (this.openapi30 as any)["webhooks"];
    }
  }
  removeUnsupportedSchemaKeywords() {
    const keywordsToRemove = [
      "$id",
      "$schema",
      "unevaluatedProperties",
      "contentMediaType",
      "patternProperties",
    ];
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      keywordsToRemove.forEach((key) => {
        if (schema.hasOwnProperty(key)) {
          delete schema[key];
          this.log(`Removed unsupported schema keyword ${key}`);
        }
      });
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  renameSchema$comment() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      if (schema.hasOwnProperty("$comment")) {
        schema["x-comment"] = schema["$comment"];
        delete schema["$comment"];
        this.log(`schema $comment renamed to x-comment`);
      }
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  private deleteSchema$comment() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      if (schema.hasOwnProperty("$comment")) {
        const comment = schema["$comment"];
        delete schema["$comment"];
        this.log(`schema $comment deleted: ${comment}`);
      }
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  /**
   * Convert
   *
   *     contentMediaType: "application/octet-stream";
   *
   * To
   *
   *     format: binary;
   *
   * In `type: string` schemas. Warn if schema has a `format` already and it is
   * not `binary`.
   */
  convertJsonSchemaContentMediaType() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      if (
        schema.hasOwnProperty("type") &&
        schema["type"] === "string" &&
        schema.hasOwnProperty("contentMediaType") &&
        schema["contentMediaType"] === "application/octet-stream"
      ) {
        if (schema.hasOwnProperty("format")) {
          if (schema["format"] === "binary") {
            this.log(
              `Deleted schema contentMediaType: application/octet-stream (leaving format: binary)`,
            );
            delete schema["contentMediaType"];
          } else {
            this.error(
              `Unable to down-convert schema with contentMediaType: application/octet-stream to format: binary because the schema already has a format (${schema["format"]})`,
            );
          }
        } else {
          delete schema["contentMediaType"];
          schema["format"] = "binary";
          this.log(
            `Converted schema contentMediaType: application/octet-stream to format: binary`,
          );
        }
      }
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  /**
   * Convert
   *
   *     contentEncoding: base64;
   *
   * To
   *
   *     format: byte;
   *
   * In `type: string` schemas. It is an error if the schema has a `format`
   * already and it is not `byte`.
   */
  convertJsonSchemaContentEncoding() {
    const schemaVisitor: SchemaVisitor = (schema: any): SchemaObject => {
      if (
        schema.hasOwnProperty("type") &&
        schema["type"] === "string" &&
        schema.hasOwnProperty("contentEncoding")
      ) {
        if (schema["contentEncoding"] === "base64") {
          if (schema.hasOwnProperty("format")) {
            if (schema["format"] === "byte") {
              this.log(
                `Deleted schema contentEncoding: base64 (leaving format: byte)`,
              );
              delete schema["contentEncoding"];
            } else {
              this.error(
                `Unable to down-convert schema contentEncoding: base64 to format: byte because the schema already has a format (${schema["format"]})`,
              );
            }
          } else {
            delete schema["contentEncoding"];
            schema["format"] = "byte";
            this.log(
              `Converted schema: 'contentEncoding: base64' to 'format: byte'`,
            );
          }
        } else {
          this.error(
            `Unable to down-convert contentEncoding: ${schema["contentEncoding"]}`,
          );
        }
      }
      return this.walkNestedSchemaObjects(schema, schemaVisitor);
    };
    visitSchemaObjects(this.openapi30, schemaVisitor);
  }

  private json(x: any) {
    return JSON.stringify(x, null, 2);
  }

  /**
   * OpenAPI 3.1 defines a new `openIdConnect` security scheme. Down-convert the
   * scheme to `oauth2` / authorization code flow. Collect all the scopes used
   * in any security requirements within operations and add them to the scheme.
   * Also define the URLs to the `authorizationUrl` and `tokenUrl` of `oauth2`.
   */
  convertSecuritySchemes() {
    const oauth2Scopes = (schemeName: string): object => {
      const scopes = {} as any;
      const paths: any = this.openapi30?.paths ?? {};
      for (const path in paths) {
        for (const op in paths[path]) {
          if (op === "parameters") {
            continue;
          }
          const operation = paths[path][op];
          const sec = operation?.security as object[];
          sec.forEach((s: any) => {
            const requirement = s?.[schemeName] as string[];
            if (requirement) {
              requirement.forEach((scope) => {
                scopes[scope] =
                  this.scopeDescriptions?.[scope] ??
                  `TODO: describe the '${scope}' scope`;
              });
            }
          });
        }
      }
      return scopes;
    };
    const schemes =
      (this.openapi30?.components as any)?.["securitySchemes"] ?? {};
    for (const schemeName in schemes) {
      const scheme = schemes[schemeName];
      const type = scheme.type;
      if (type === "openIdConnect") {
        this.log(
          `Converting openIdConnect security scheme to oauth2/authorizationCode`,
        );
        scheme.type = "oauth2";
        const openIdConnectUrl = scheme.openIdConnectUrl;
        scheme.description = `OAuth2 Authorization Code Flow. The client may
          GET the OpenID Connect configuration JSON from \`${openIdConnectUrl}\`
          to get the correct \`authorizationUrl\` and \`tokenUrl\`.`;
        delete scheme.openIdConnectUrl;
        const scopes = oauth2Scopes(schemeName);
        scheme.flows = {
          authorizationCode: {
            // TODO: add options for these URLs
            authorizationUrl: this.authorizationUrl,
            tokenUrl: this.tokenUrl,
            scopes: scopes,
          },
        };
      }
    }
  }

  /**
   * Find remaining OpenAPI 3.0 [Reference
   * Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#referenceObject)
   * and down convert them to [JSON
   * Reference](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03)
   * objects with _only_ a `$ref` property.
   */
  simplifyNonSchemaRef() {
    visitRefObjects(this.openapi30, (node: any): JsonNode => {
      if (Object.keys(node).length === 1) {
        return node;
      } else {
        this.log(
          `Down convert reference object to JSON Reference:\n${JSON.stringify(node, null, 3)}`,
        );
        Object.keys(node)
          .filter((key) => key !== "$ref")
          .forEach((key) => delete node[key]);
        return node;
      }
    });
  }

  removeLicenseIdentifier() {
    if ((this.openapi30 as any)?.["info"]?.["license"]?.["identifier"]) {
      this.log(
        `Removed info.license.identifier: ${(this.openapi30 as any)["info"]["license"]["identifier"]}`,
      );
      delete (this.openapi30 as any)["info"]["license"]["identifier"];
    }
  }

  // This transformation ends up breaking openapi-generator
  // SDK gen (typescript-axios, typescript-angular)
  // so it is disabled unless the `allOfTransform` option is `true`.

  convertSchemaRef() {
    /**
     * In a JSON Schema, replace `{ blah blah, $ref: "uri"}` with `{ blah blah,
     * allOf: [ $ref: "uri" ]}`
     *
     * @param object An object that may contain JSON schemas (directly or in
     *   sub-objects)
     */
    const simplifyRefObjectsInSchemas = (
      object: SchemaObject,
    ): SchemaObject => {
      return visitRefObjects(object, (node: any): JsonNode => {
        if (Object.keys(node).length === 1) {
          return node;
        } else {
          this.log(
            `Converting JSON Schema $ref ${this.json(node)} to allOf: [ $ref ]`,
          );
          node["allOf"] = [{ $ref: node.$ref }];
          delete node.$ref;
          return node;
        }
      });
    };

    if (this.allOfTransform) {
      visitSchemaObjects(
        this.openapi30,
        (schema: SchemaObject): SchemaObject => {
          return simplifyRefObjectsInSchemas(schema);
        },
      );
    }
  }

  public static deepClone(obj: object): object {
    return JSON.parse(JSON.stringify(obj)); // kinda simple way to clone, but it works...
  }
}
