import { IHttpMigrateApplication } from "@typia/interface";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

/**
 * The shared input of the programmers: the mode, the analyzed application, and
 * the configuration.
 *
 * @evidence contracts/common.md#principled-implementation The record is built once per migration, so every programmer sees the same routes and options.
 * @evidence contracts/common.md#clear-and-simple-design A three-member record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the members.
 */
export interface INestiaMigrateContext {
  mode: "nest" | "sdk";
  application: IHttpMigrateApplication;
  config: INestiaMigrateConfig;
}
