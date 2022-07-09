/**
 * Attachemd (physical) file info.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IAttachmentFile {
    /**
     * Primary Key.
     */
    id: number;

    /**
     * Name of the file.
     */
    name: string;

    /**
     * Extension of the file, but ommitable.
     */
    extension: string | null;

    /**
     * Full URL path of the file.
     */
    url: string;
}
