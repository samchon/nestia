import api from "../api";
import { Backend } from "../Backend";
import { Configuration } from "../Configuration";
import { DynamicImportIterator } from "./internal/DynamicImportIterator";

async function main(): Promise<void> {
    const server: Backend = new Backend();
    await server.open();

    const connection: api.IConnection = {
        host: `http://127.0.0.1:${Configuration.PORT}`,
        encryption: Configuration.ENCRYPTION_PASSWORD,
    };
    await DynamicImportIterator.main(__dirname, {
        prefix: "test",
        parameters: () => [connection],
    });

    await server.close();
}
main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
