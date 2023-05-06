const fs = require("fs");

function main() {
    const packages = fs.readdirSync(`${__dirname}/../packages`);
    for (const directory of packages) {
        const location = `${__dirname}/../packages/${directory}/README.md`;
        if (fs.existsSync(location) === false)
            continue;

        fs.copyFileSync(`${__dirname}/../README.md`, location);
    }
}
main();