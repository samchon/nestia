import { NestiaSdkApplication } from "../../NestiaSdkApplication";

export namespace NestiaSdkCommand {
    export const sdk = () => main((app) => app.sdk());
    export const swagger = () => main((app) => app.swagger());
    export const e2e = () => main((app) => app.e2e());

    const main = async (task: (app: NestiaSdkApplication) => Promise<void>) => {
        await generate(task);
    };

    const generate = async (
        task: (app: NestiaSdkApplication) => Promise<void>,
    ) => {
        // CALL THE APP.GENERATE()
        const app: NestiaSdkApplication = await NestiaSdkApplication.create();
        await task(app);
    };
}
