import fs from "fs";
import os from "os";

import { BenchmarkServer } from "./BenchmarkServer";
import { BenchmarkStream } from "./BenhmarkStream";
import { HorizontalBarChart } from "./HorizontalBarChart";

export namespace BenchmarkReporter {
  export interface Measurement {
    type: string;
    result: Record<string, number | null>;
    unit: string;
  }

  export const write =
    (stream: BenchmarkStream) =>
    async (report: BenchmarkServer.IAggregation): Promise<void> => {
      // TITLE AND IMAGE TAG
      await stream.write(`## ${report.category}`);
      await stream.write(
        `![${report.category} benchmark](images/${report.category}.svg)`,
      );
      await stream.write("");

      // THE TABLE
      await stream.write(` Types | ${report.libraries.join(" | ")} `);
      await stream.write(
        "-------|" + report.libraries.map(() => "------").join("|"),
      );
      for (const type of report.types) {
        const label: string = DICTIONARY[type];
        const record: string[] = report.libraries.map((library) => {
          const value = report.result[type][library];
          if (value === null) return " - ";

          const space: number =
            value.amount / (value.time / 1_000) / 1_024 / 1_024;
          if (isNaN(space)) return " - ";

          return space < 10
            ? space.toFixed(2)
            : Math.round(space).toLocaleString();
        });
        await stream.write(` ${label} | ${record.join(" | ")} `);
      }
      await stream.write("");
      await stream.write("> Unit: Megabytes/sec");
      await stream.write("\n\n\n");

      // GENERATE CHART
      const relatives: HorizontalBarChart.IMeasure[] = report.types.map(
        (type) => {
          const label: string = DICTIONARY[type];
          const record: HorizontalBarChart.IMeasure = {
            label,
            result: {},
          };
          for (const library of report.libraries) {
            const value = report.result[type][library];
            record.result[library] =
              value === null ? 0 : value.time ? value.amount / value.time : 0;
          }

          const minimum: number = Math.min(
            ...(Object.values(record.result) as number[]).filter(
              (value) => value !== 0,
            ),
          );
          for (const library of report.libraries)
            record.result[library] /= minimum;
          return record;
        },
      );

      const svg = HorizontalBarChart.generate(stream.environments)(
        `${report.category} benchmark`,
      )(report.libraries)(relatives);
      await fs.promises.writeFile(
        `${stream.path}/images/${report.category}.svg`,
        svg.node()?.outerHTML ?? "",
        "utf8",
      );
    };

  export async function initialize(): Promise<BenchmarkStream> {
    const results: string = `${__dirname}/../../results`;

    const cpu: string = os.cpus()[0].model.trim();
    const location: string = `${results}/${cpu.split("\\").join("").split("/").join("")}`;

    await mkdir(results);
    await mkdir(location);
    await mkdir(`${location}/images`);

    const stream: BenchmarkStream = new BenchmarkStream(location, {
      cpu,
      memory: os.totalmem(),
      os: os.platform(),
      node: process.version,
      nestia: await get_package_version(),
    });
    await stream.write("# Benchmark of `nestia`");
    await stream.write(`> - CPU: ${cpu}`);
    await stream.write(
      `> - Memory: ${Math.round(
        stream.environments.memory / 1024 / 1024,
      ).toLocaleString()} MB`,
    );
    await stream.write(`> - OS: ${stream.environments.os}`);
    await stream.write(`> - NodeJS version: ${stream.environments.node}`);
    await stream.write(`> - nestia version: v${stream.environments.nestia}`);
    await stream.write("\n");
    return stream;
  }

  export async function terminate(stream: BenchmarkStream): Promise<void> {
    await stream.write("\n\n");
    await stream.write(
      `Total elapsed time: ${stream.elapsed().toLocaleString()} ms`,
    );
    await stream.close();
  }

  async function mkdir(location: string): Promise<void> {
    try {
      await fs.promises.mkdir(location);
    } catch {}
  }

  async function get_package_version(): Promise<string> {
    const content: string = await fs.promises.readFile(
      __dirname + "/../../package.json",
      "utf8",
    );
    const data = JSON.parse(content);
    return data.dependencies["@nestia/core"].substring(1);
  }

  const DICTIONARY: Record<string, string> = {
    ObjectSimple: "object (simple)",
    ObjectHierarchical: "object (hierarchical)",
    ObjectRecursive: "object (recursive)",
    ObjectUnionExplicit: "object (union, explicit)",
    ObjectUnionImplicit: "object (union, implicit)",
    ArraySimple: "array (simple)",
    ArrayHierarchical: "array (hierarchical)",
    ArrayRecursive: "array (recursive)",
    ArrayRecursiveUnionExplicit: "array (union, explicit)",
    ArrayRecursiveUnionImplicit: "array (union, implicit)",
    UltimateUnion: "ultimate union",
  };
}
