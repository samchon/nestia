import fs from "fs";

import { ISwagger, NestiaMigrateApplication } from "../module";
import { SetupWizard } from "../utils/SetupWizard";

const INPUT = __dirname + "/../../assets/input";
const OUTPUT = __dirname + "/../../assets/output";

const main = () => {
    if (fs.existsSync(OUTPUT)) fs.rmSync(OUTPUT, { recursive: true });
    fs.mkdirSync(OUTPUT);

    const directory: string[] = fs.readdirSync(INPUT);
    for (const file of directory) {
        const location: string = `${INPUT}/${file}`;
        if (!location.endsWith(".json")) continue;

        const swagger: ISwagger = JSON.parse(fs.readFileSync(location, "utf8"));
        const app = new NestiaMigrateApplication(swagger);
        app.analyze();

        const project: string = `${OUTPUT}/${file.replace(".json", "")}`;
        fs.mkdirSync(project);
        app.generate({
            mkdir: fs.mkdirSync,
            writeFile: (path, content) =>
                fs.promises.writeFile(path, content, "utf8"),
        })(project);
        SetupWizard.setup(project);
    }
};
main();
