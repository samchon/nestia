import { tags } from "typia";

/**
 * Attachment File.
 *
 * Every attachment files that are managed in current system.
 *
 * @author Samchon
 */
export interface IAttachmentFile extends IAttachmentFile.ICreate {
  /**
   * Primary Key.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Creation time of attachment file.
   */
  created_at: string & tags.Format<"date-time">;
}

export namespace IAttachmentFile {
  export interface ICreate {
    /**
     * File name, except extension.
     */
    name: string & tags.MaxLength<255>;

    /**
     * Extension.
     *
     * Possible to omit like `README` case.
     */
    extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);

    /**
     * URL path of the real file.
     */
    url: string & tags.Format<"uri"> & tags.ContentMediaType<"image/*">;
  }
}
