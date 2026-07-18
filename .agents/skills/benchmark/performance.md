# Library Performance Benchmark

Read this document before running or changing the `benchmark/` workspace, regenerating `benchmark/src/programs/`, changing its structure fixtures, or publishing results under `benchmark/results/`.

## Workload

The private `@samchon/nestia-benchmark` workspace measures throughput in megabytes per second for `@nestia/core` against a stock NestJS application. `benchmark/src/index.ts` runs three categories through `BenchmarkServer` worker processes over tgrid, and the reporter writes markdown plus D3/jsdom SVG charts into the current CPU's result directory.

| Category | Measures | Compared against |
| --- | --- | --- |
| `assert` | request-body validation | `class-validator` on stock NestJS |
| `stringify` | response serialization | `class-transformer` on stock NestJS |
| `performance` | end-to-end HTTP throughput | the same stock NestJS application |

Every category runs the full matrix: four comparators (`nestia-express`, `nestia-fastify`, `NestJS-express`, `NestJS-fastify`) across eight canonical structures — `ObjectSimple`, `ObjectHierarchical`, `ObjectRecursive`, `ObjectUnionExplicit`, `ArraySimple`, `ArrayHierarchical`, `ArrayRecursive`, and `ArrayRecursiveUnionExplicit`.

## Fixture Contract

`benchmark/src/generate/` holds the generators (`BenchmarkProgrammer.ts` plus one module per category) that emit the leaf programs under `benchmark/src/programs/<category>/<library>/benchmark-<category>-<library>-<Type>.ts`. `benchmark/src/structures/` owns the input types, and `benchmark/src/internal/` owns the server, reporter, stream, and chart implementations.

- **Generated programs:** edit the matching generator instead of a generated `benchmark-*.ts` leaf. `pnpm generate` regenerates them, formats the sources, and rebuilds the package. Edit the `createNest{Express,Fastify}{Assert,Stringify,Performance}Program.ts` helpers under `programs/*/servers/` in place.
- **Paired structures:** `structures/pure/` holds the plain TypeScript DTOs that `@nestia/core` consumes; `structures/class-validator/` holds the decorated twins the NestJS comparator consumes. The two trees must describe the same shape. A property present in one and missing from the other silently changes the measured payload and invalidates every row for that type.
- **Comparators:** the adapter axis is part of the contract. Keep Express and Fastify present for both libraries in every category; a cross-adapter row measures the adapter, not the library.

## Run Locally

Run from `benchmark/`:

```bash
pnpm generate
pnpm start
```

`pnpm generate` regenerates the programs from `src/generate/`, formats them, and builds. `pnpm build` rebuilds `bin/` alone when the programs are already current. `pnpm start` builds and then writes the report for the current CPU.

## Publish

Run publication measurements on an otherwise quiet host. The reporter keys output by `os.cpus()[0].model` with slashes stripped, so confirm the destination directory before accepting the result — `benchmark/results/` already holds nine machine directories, and a run on a matching CPU overwrites one of them.

Each `benchmark/results/<CPU model>/` directory is one machine's committed report: `README.md` plus one `images/<category>.svg` per category. A new machine adds its own directory; do not overwrite another machine's results.

After the run, inspect the generated `README.md` and every SVG. Require correct host metadata, all three categories, comparable rows across the full library and structure matrix, and no stale images from an older run. Commit the new or intentionally refreshed machine directory as one result set.
