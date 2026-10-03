const fs = require("node:fs");
const path = require("node:path");

/**
 * Discovers configured source fixtures, excluding generated directory remnants.
 *
 * The caller supplies the same configuration filename used for execution.
 * Each command reads current directory contents; no previous discovery survives
 * source removal or creation. Missing roots and unreadable inputs remain errors.
 *
 * @evidence contracts/common.md#principled-implementation Only directories with their execution configuration file are fixtures. A leftover node_modules or output directory cannot independently define a source test; real configured error fixtures remain enrolled.
 * @evidence contracts/common.md#clear-and-simple-design One directory scan and the caller's existing configuration-name policy produce sorted fixture names. The operation starts no preparation and retains no cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filesystem discovery uses real config files, without a retired-name blacklist or Git-dependent selection. It does not suppress generator or malformed-config failures.
 * @evidence contracts/common.md#meaningful-documentation The comment states the source boundary, caller-owned filename policy and current-input/error behavior.
 * @evidence contracts/portability.md#os-neutral-implementation Native directory entries and path.join represent actual filesystem paths. No shell enumeration, platform spelling or case-policy assumption is used.
 */
function discoverSdkFixtures(root, configurationName) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".tmp-"))
    .filter((entry) => {
      const config = path.join(root, entry.name, configurationName(entry.name));
      try {
        return fs.statSync(config).isFile();
      } catch (error) {
        if (error.code === "ENOENT") return false;
        throw error;
      }
    })
    .map((entry) => entry.name)
    .sort();
}

module.exports = { discoverSdkFixtures };
