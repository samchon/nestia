import { IHttpMigrateRoute } from "@typia/interface";

/**
 * A controller to generate: its name, its path, its source location, and its
 * routes.
 *
 * @evidence contracts/common.md#principled-implementation The record is the output of the analyzer and the input of the controller programmer.
 * @evidence contracts/common.md#clear-and-simple-design A four-member record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the members.
 */
export interface INestiaMigrateController {
  name: string;
  path: string;
  location: string;
  routes: IHttpMigrateRoute[];
}
