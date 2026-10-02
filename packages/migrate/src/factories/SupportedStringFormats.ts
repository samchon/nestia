/**
 * The string formats of the OpenAPI document that the typia `Format` tag
 * validates, so a schema carrying one of them is generated as a `Format` tag
 * and a schema carrying any other format stays a plain `string`.
 */
export const SUPPORTED_STRING_FORMATS: ReadonlySet<string> = new Set([
  "byte",
  "password",
  "regex",
  "uuid",
  "email",
  "hostname",
  "idn-email",
  "idn-hostname",
  "iri",
  "iri-reference",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uri-template",
  "url",
  "date-time",
  "date",
  "time",
  "duration",
  "json-pointer",
  "relative-json-pointer",
]);
