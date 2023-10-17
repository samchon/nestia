import { tags } from "typia";

import { IAttachmentFile } from "./IAttachmentFile";

export interface IBbsComment extends IBbsComment.IStore {
    id: string & tags.Format<"uuid">;
    created_at: string & tags.Format<"date-time">;
}
export namespace IBbsComment {
    export interface IStore {
        body: string;
        files: IAttachmentFile[];
    }
}
