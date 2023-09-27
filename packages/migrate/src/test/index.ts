import cp from "child_process";
import fs from "fs";

import { NestiaMigrateApplication } from "../NestiaMigrateApplication";
import { ISwagger } from "../structures/ISwagger";

const SAMPLE = __dirname + "/../../assets/input";
const TEST = __dirname + "/../../../../test/features";
const OUTPUT = __dirname + "/../../assets/output";

const measure = (title: string) => (task: () => void) => {
    process.stdout.write(`  - ${title}: `);
    const time: number = Date.now();
    task();
    console.log(`${(Date.now() - time).toLocaleString()} ms`);
    return time;
};

const execute = (project: string) => (swagger: ISwagger) =>
    measure(project)(() => {
        const app: NestiaMigrateApplication = new NestiaMigrateApplication(
            swagger,
        );
        app.analyze();
        app.generate({
            mkdir: fs.mkdirSync,
            writeFile: (path, content) =>
                fs.writeFileSync(path, content, "utf8"),
        })(`${OUTPUT}/${project}`);

        cp.execSync(`npx tsc -p ${OUTPUT}/${project}/tsconfig.json`, {
            stdio: "inherit",
            cwd: `${OUTPUT}/${project}`,
        });
    });

const main = () => {
    if (fs.existsSync(OUTPUT)) fs.rmSync(OUTPUT, { recursive: true });
    fs.mkdirSync(OUTPUT);

    const only = (() => {
        const index: number = process.argv.indexOf("--only");
        if (index !== -1) return process.argv[index + 1]?.trim();
        return undefined;
    })();

    for (const file of fs.readdirSync(SAMPLE)) {
        const location: string = `${SAMPLE}/${file}`;
        if (!location.endsWith(".json")) continue;

        const project: string = file.substring(0, file.length - 5);
        if ((only ?? project) !== project) continue;

        const swagger: ISwagger = JSON.parse(fs.readFileSync(location, "utf8"));
        execute(project)(swagger);
    }

    for (const feature of fs.readdirSync(TEST)) {
        if ((only ?? feature) !== feature) continue;
        else if (feature === "clone-and-propagate") continue;

        const stats: fs.Stats = fs.statSync(`${TEST}/${feature}`);
        if (stats.isDirectory() === false) continue;
        else if (feature.includes("error")) continue;

        const location: string = `${TEST}/${feature}/swagger.json`;
        if (fs.existsSync(location) === false) continue;

        const swagger: ISwagger = JSON.parse(fs.readFileSync(location, "utf8"));
        execute(feature)(swagger);
    }
};
main();
