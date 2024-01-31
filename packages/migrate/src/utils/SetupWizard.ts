import cp from "child_process";

export namespace SetupWizard {
  export const setup = (output: string) => {
    execute(output)("npm install");
  };

  const execute = (cwd: string) => (command: string, fake?: string) => {
    console.log(fake ?? command);
    cp.execSync(command, { cwd, stdio: "inherit" });
  };
}
