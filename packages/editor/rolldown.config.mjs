import ttsc from "@ttsc/unplugin/rolldown";

import config from "../../config/rolldown.config.mjs";

// The default tsconfig.json is the vite application config; the publishable
// library compiles through tsconfig.lib.json.
export default { ...config, plugins: [ttsc({ project: "tsconfig.lib.json" })] };
