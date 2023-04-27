import typia from "typia";

import api from "../api";
import { IFilesystemBucket } from "../api/structures/IFilesystemBucket";

export async function test_filesystem(
    connection: api.IConnection,
): Promise<void> {
    const buckets: IFilesystemBucket[] = await api.functional.filesystem.get(
        connection,
        {
            locations: ["a", "b", "c"],
            trashed: false,
            extension: "jpg",
        },
    );
    typia.assertEquals(buckets);

    try {
        await api.functional.filesystem.get(connection, {
            locations: ["a", "b", "c"],
            trashed: "something" as any, // WRONG
            extension: "jpg",
        });
    } catch (exp) {
        if (exp instanceof api.HttpError) {
            if (exp.status === 400) return;
        }
    }
    throw new Error("Must be 400 error in here.");
}
