const path = require("path");

// @nestia/sdk's exports map blocks deep subpath imports, so this suite
// requires the built files by absolute path instead.
const LIB = path.join(__dirname, "..", "..", "..", "packages", "sdk", "lib");

exports.PackageManagerDetector = require(
  path.join(LIB, "utils", "PackageManagerDetector.js"),
).PackageManagerDetector;
exports.SdkDistributionComposer = require(
  path.join(LIB, "generates", "internal", "SdkDistributionComposer.js"),
).SdkDistributionComposer;
exports.DependenciesInstaller = require(
  path.join(LIB, "executable", "internal", "DependenciesInstaller.js"),
).DependenciesInstaller;
exports.BUNDLE = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "sdk",
  "assets",
  "bundle",
  "distribute",
);
