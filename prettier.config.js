module.exports = {
  // DEFAULT CONFIGURATIONS
  parser: "typescript",
  printWidth: 80,
  semi: true,
  tabWidth: 2,
  trailingComma: "all",

  // PLUG-IN CONFIGURATIONS
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: ["<THIRD_PARTY_MODULES>", "@api(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ["decorators-legacy", "typescript", "jsx"],
};
