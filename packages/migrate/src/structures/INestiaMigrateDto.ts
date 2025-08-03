import { OpenApi } from "@samchon/openapi";

/**
 * Interface representing a Data Transfer Object (DTO) structure for migration.
 * 
 * This interface defines the structure of DTOs that will be generated during
 * the migration process, representing the data schemas from the OpenAPI document.
 */
export interface INestiaMigrateDto {
  /**
   * The name of the DTO class or interface.
   * 
   * This will be used as the TypeScript class/interface name for the
   * generated DTO (e.g., "CreateUserDto", "ProductResponseDto").
   */
  name: string;

  /**
   * The file system location where the DTO will be generated.
   * 
   * Relative path from the project root to where the DTO
   * TypeScript file should be created.
   */
  location: string;

  /**
   * The JSON schema definition for this DTO.
   * 
   * Contains the OpenAPI JSON schema that defines the structure,
   * validation rules, and type information for this DTO.
   * Can be null if the DTO is a container for child DTOs only.
   */
  schema: OpenApi.IJsonSchema | null;

  /**
   * Array of child DTOs nested within this DTO.
   * 
   * Represents nested or related DTOs that should be generated
   * along with this DTO, typically for complex object structures
   * or when organizing DTOs hierarchically.
   */
  children: INestiaMigrateDto[];
}
