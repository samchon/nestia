const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const packages = ["fetcher", "core", "sdk"];

const execute =
    (cwd, stdio = "ignore") =>
    (command) => {
        console.log(command);
        cp.execSync(command, { cwd, stdio });
    };

const setup = (tag) => (version) => (directory) => {
    // CHANGE PACKAGE.JSON INFO
    const file = `${directory}/package.json`;
    const info = JSON.parse(fs.readFileSync(file, "utf8"));
    info.version = version;

    for (const record of [info.dependencies ?? {}, info.devDependencies ?? {}])
        for (const key of Object.keys(record))
            if (
                key.startsWith("@nestia") &&
                packages.includes(key.replace("@nestia/", ""))
            ) {
                if (
                    tag === "tgz" &&
                    fs.existsSync(`${directory}/node_modules/${key}`)
                )
                    execute(directory)(`npm uninstall ${key}`);
                record[key] =
                    tag === "tgz"
                        ? path.resolve(
                              `${__dirname}/../packages/${key.replace(
                                  "@nestia/",
                                  "",
                              )}/nestia-${key.replace(
                                  "@nestia/",
                                  "",
                              )}-${version}.tgz`,
                          )
                        : `^${version}`;
            }
    for (const key of Object.keys(info.peerDependencies ?? {}))
        if (
            key.startsWith("@nestia") &&
            packages.includes(key.replace("@nestia/", ""))
        )
            info.peerDependencies[key] = `>=${version}`;

    // SETUP UPDATED DEPENDENCIES
    fs.writeFileSync(file, JSON.stringify(info, null, 2), "utf8");
    execute(directory)("npm cache clean --force");
    execute(directory)(`npm install`);
};

const deploy = (tag) => (version) => (name) => {
    console.log("-----------------------------------------");
    console.log(name.toUpperCase());
    console.log("-----------------------------------------");

    // SETUP
    const directory = `${__dirname}/../packages/${name}`;
    setup(tag)(version)(directory);
    execute(directory)(`npm run build`);

    // PUBLISH (OR PACK)
    if (tag === "tgz") execute(directory)(`npm pack`);
    else execute(directory)(`npm publish --tag ${tag} --access public`);
    console.log("");
};

const publish = (tag) => (version) => {
    // VALIDATE TAG
    const dev = version.includes("-dev.") === true;
    if (tag !== "latest" && dev === false)
        throw new Error(`${tag} tag can only be used for dev versions.`);
    else if (tag === "latest" && dev === true)
        throw new Error(`latest tag can only be used for non-dev versions.`);

    // DO DEPLOY
    const skip = (() => {
        const index = process.argv.indexOf("--skip");
        if (index === -1) return [];

        const targets = process.argv.slice(index + 1);
        return targets.filter((t) => packages.includes(t));
    })();
    for (const pack of packages) {
        if (skip.includes(pack)) continue;
        deploy(tag)(version)(pack);
    }

    // SETUP INTO TEST
    console.log("-----------------------------------------");
    console.log("TEST");
    console.log("-----------------------------------------");
    setup(tag)(version)(`${__dirname}/../test`);
};

module.exports = { publish };
