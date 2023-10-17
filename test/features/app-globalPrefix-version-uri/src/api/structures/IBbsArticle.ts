import { tags } from "typia";

import { IAttachmentFile } from "./IAttachmentFile";

export interface IBbsArticle extends IBbsArticle.IStore {
    id: string & tags.Format<"uuid">;
    section: string;
    created_at: string & tags.Format<"date-time">;
}
export namespace IBbsArticle {
    export interface IStore {
        title: string & tags.MinLength<3> & tags.MaxLength<50>;
        body: string;
        files: IAttachmentFile[];
    }

    export interface ISummary {
        id: string & tags.Format<"uuid">;
        section: string;
        writer: string;
        title: string & tags.MinLength<3> & tags.MaxLength<50>;
        created_at: string & tags.Format<"date-time">;
    }
}
