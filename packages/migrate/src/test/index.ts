import fs from "fs";

import { ISwagger, NestiaMigrateApplication } from "../module";
import { SetupWizard } from "../utils/SetupWizard";

const INPUT = __dirname + "/../../assets/input";
const OUTPUT = __dirname + "/../../assets/output";

const main = async () => {
    if (fs.existsSync(OUTPUT))
        await fs.promises.rm(OUTPUT, { recursive: true });
    await fs.promises.mkdir(OUTPUT);

    const directory: string[] = await fs.promises.readdir(INPUT);
    for (const file of directory) {
        const location: string = `${INPUT}/${file}`;
        if (!location.endsWith(".json")) continue;

        const swagger: ISwagger = JSON.parse(
            await fs.promises.readFile(location, "utf8"),
        );
        const app = new NestiaMigrateApplication(swagger);
        app.analyze();

        const project: string = `${OUTPUT}/${file.replace(".json", "")}`;
        await fs.promises.mkdir(project);
        await app.generate({
            mkdir: fs.promises.mkdir,
            writeFile: (path, content) =>
                fs.promises.writeFile(path, content, "utf8"),
        })(project);
        await SetupWizard.setup(project);
    }
};
main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
