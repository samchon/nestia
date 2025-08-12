import { IHttpMigrateRoute } from "@samchon/openapi";

/**
 * Interface representing a NestJS controller structure for migration.
 * 
 * This interface defines the structure of a controller that will be generated
 * during the migration process, including its metadata and associated routes.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaMigrateController {
  /**
   * The name of the controller class.
   * 
   * This will be used as the TypeScript class name for the generated
   * NestJS controller (e.g., "UsersController", "ProductsController").
   */
  name: string;

  /**
   * The base path for the controller routes.
   * 
   * This represents the route prefix that will be applied to all
   * methods in this controller (e.g., "/users", "/products").
   */
  path: string;

  /**
   * The file system location where the controller will be generated.
   * 
   * Relative path from the project root to where the controller
   * TypeScript file should be created.
   */
  location: string;

  /**
   * Array of HTTP routes associated with this controller.
   * 
   * Each route represents an API endpoint that will be implemented
   * as a method in the generated controller class.
   */
  routes: IHttpMigrateRoute[];
}
