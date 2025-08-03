/**
 * Interface representing a schema structure for migration.
 * 
 * This interface defines the hierarchical structure of schemas
 * that are organized and processed during the migration.
 * 
 * @author Samchon
 */
export interface INestiaMigrateSchema {
  /**
   * The name of the schema.
   * 
   * Identifier for this schema, typically corresponding to
   * a schema name from the OpenAPI components or a generated name.
   */
  name: string;

  /**
   * Array of child schemas nested within this schema.
   * 
   * Represents a hierarchical structure where schemas can contain
   * other schemas, useful for organizing complex schema relationships
   * and dependencies.
   */
  children: INestiaMigrateSchema[];
}
