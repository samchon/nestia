import cp from "child_process";

export namespace SetupWizard {
  export const setup = (output: string) => {
    execute(output)("npm install");
    execute(output)("npx nestia e2e", "npm run build:sdk");
    execute(output)("npm run build:test");
    execute(output)("npm run test");
  };

  const execute = (cwd: string) => (command: string, fake?: string) => {
    console.log(fake ?? command);
    cp.execSync(command, { cwd, stdio: "inherit" });
  };
}
