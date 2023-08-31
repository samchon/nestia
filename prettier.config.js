module.exports = {
    parser: "typescript",
    printWidth: 80,
    semi: true,
    tabWidth: 4,
    trailingComma: "all",
    importOrder: [
        "<THIRD_PARTY_MODULES>",
        "@api(.*)$",
        "^[./]",
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    importOrderParserPlugins: ["decorators-legacy", "typescript"],
};