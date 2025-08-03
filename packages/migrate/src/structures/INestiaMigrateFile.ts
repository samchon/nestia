/**
 * Interface representing a file structure for migration output.
 * 
 * This interface defines the structure of files that will be generated
 * during the migration process, including their content and metadata.
 * 
 * @author Samchon
 */
export interface INestiaMigrateFile {
  /**
   * The file system location where the file will be generated.
   * 
   * Relative path from the project root to where the file
   * should be created (e.g., "src/controllers/UsersController.ts").
   */
  location: string;

  /**
   * The name of the file.
   * 
   * The actual filename including extension
   * (e.g., "UsersController.ts", "package.json").
   */
  file: string;

  /**
   * The complete content of the file.
   * 
   * The generated source code, configuration, or other content
   * that should be written to the file.
   */
  content: string;
}
