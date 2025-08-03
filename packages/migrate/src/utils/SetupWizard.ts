import cp from "child_process";

/**
 * Namespace containing utilities for setting up generated projects.
 * 
 * This wizard handles post-generation setup tasks such as installing
 * dependencies and configuring the generated project for immediate use.
 * 
 * @author Samchon
 */
export namespace SetupWizard {
  /**
   * Sets up a generated project by installing dependencies.
   * 
   * Executes the necessary setup commands in the output directory
   * to prepare the generated project for development or deployment.
   * Currently installs npm dependencies.
   * 
   * @param output - The output directory path where the project was generated
   * 
   * @example
   * ```typescript
   * // After generating files to ./my-api
   * SetupWizard.setup("./my-api");
   * // Executes: npm install in ./my-api directory
   * ```
   */
  export const setup = (output: string) => {
    execute(output)("npm install");
  };

  /**
   * Creates a function to execute commands in a specific directory.
   * 
   * @param cwd - The working directory for command execution
   * @returns Function that executes commands in the specified directory
   * @internal
   */
  const execute = (cwd: string) => (command: string, fake?: string) => {
    console.log(fake ?? command);
    cp.execSync(command, { cwd, stdio: "inherit" });
  };
}
