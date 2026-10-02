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
  /** Class identifier shared by its declaration, filename and module import. */
  name: string;

  /** Shared router path prefix, including router escapes for literal characters. */
  path: string;

  /** Slash-separated source directory relative to the backend package. */
  location: string;

  /** Operations grouped into this controller, in document order. */
  routes: IHttpMigrateRoute[];
}
