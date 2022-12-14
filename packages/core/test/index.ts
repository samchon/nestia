import { IEncryptionPassword } from "@nestia/fetcher";
import { NestFactory } from "@nestjs/core";

import { EncryptedModule } from "../src";
import api from "./api";
import { test_comment } from "./features/test_comments";
import { test_filesystem } from "./features/test_filesystem";
import { test_question } from "./features/test_questions";
import { test_review } from "./features/test_reviews";
import { test_system } from "./features/test_system";

const ENCRYPTION_PASSWORD: IEncryptionPassword = {
    key: "abcd".repeat(8),
    iv: "abcd".repeat(4),
};

async function feature(
    connection: api.IConnection,
    func: (connection: api.IConnection) => Promise<void>,
): Promise<void> {
    console.log(func.name);
    await func(connection);
}

async function main(): Promise<void> {
    // OPEN SERVER
    const app = await NestFactory.create(
        await EncryptedModule.dynamic(
            __dirname + "/controllers",
            ENCRYPTION_PASSWORD,
        ),
    );
    await app.listen(36999);

    // DO TEST
    const connection: api.IConnection = {
        host: "http://127.0.0.1:36999",
        encryption: ENCRYPTION_PASSWORD,
    };
    await feature(connection, test_comment);
    await feature(connection, test_filesystem);
    await feature(connection, test_question);
    await feature(connection, test_review);
    await feature(connection, test_system);

    // CLOSE
    await app.close();
}
main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
