export interface IAttachmentFile {
  /**
   * @minLengt 1
   * @maxLength 255
   */
  name: string | null;

  /**
   * @minLength 1
   * @maxLength 8
   */
  extension: string | null;

  /**
   * @format uri
   */
  url: string;
}
