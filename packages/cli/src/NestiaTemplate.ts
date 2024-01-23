import cp from "child_process";
import fs from "fs";

export namespace NestiaTemplate {
  export const clone =
    (halter: (msg?: string) => never) =>
    async (argv: string[]): Promise<void> => {
      // VALIDATION
      const dest: string | undefined = argv[0];
      if (dest === undefined) halter();
      else if (fs.existsSync(dest) === true)
        halter("The target directory already exists.");

      console.log("-----------------------------------------");
      console.log(" Nestia Template Kit");
      console.log("-----------------------------------------");

      // COPY PROJECTS
      execute(`git clone https://github.com/samchon/backend ${dest}`);
      console.log(`cd "${dest}"`);
      process.chdir(dest);

      // INSTALL DEPENDENCIES
      execute("npm install");

      // BUILD TYPESCRIPT
      execute("npm run build");

      // REMOVE .GIT DIRECTORY
      cp.execSync("npx rimraf .git");
    };

  function execute(command: string): void {
    console.log(`\n$ ${command}`);
    cp.execSync(command, { stdio: "inherit" });
  }
}
