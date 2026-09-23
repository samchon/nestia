import { tags } from "typia";

import { DecomposeKind } from "./DecomposeKind";

export interface IAbsentFields {
  literal: "x" | "y";
  anything: any;
  kind: DecomposeKind;
  plugin: string & tags.JsonSchemaPlugin<{ "x-empty": null }>;
  named: string & tags.Examples<{ none: null; some: "a" }>;
}
