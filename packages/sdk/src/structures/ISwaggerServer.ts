/**
 * Remote server definition.
 */
export interface ISwaggerServer {
  /**
   * A URL to the target host.
   *
   * @format uri
   */
  url: string;

  /**
   * An optional string describing the target server.
   */
  description?: string;
}
