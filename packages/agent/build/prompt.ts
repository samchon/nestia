import fs from "fs";

const DIRECTORY = `${__dirname}/../prompts`;

const main = async (): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(DIRECTORY);
  const record: Record<string, string> = {};

  for (const file of directory) {
    if (file.endsWith(".md") === false) continue;
    const content: string = await fs.promises.readFile(
      `${DIRECTORY}/${file}`,
      "utf8",
    );
    record[file.substring(0, file.length - 3)] = content
      .split("\r\n")
      .join("\n")
      .trim();
  }
  await fs.promises.writeFile(
    `${__dirname}/../src/internal/NestiaChatAgentSystemPrompt.ts`,
    [
      `export namespace NestiaChatAgentSystemPrompt {`,
      ...Object.entries(record).map(
        ([key, value]) =>
          `  export const ${key.toUpperCase()} = ${JSON.stringify(value)};`,
      ),
      `}`,
      "",
    ].join("\n"),
    "utf8",
  );
};
main().catch(console.error);
