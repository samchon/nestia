const { test_migrate_cli_archiving } = require("./test_migrate_cli_archiving.cjs");
const { test_migrate_generated_consumer } = require("./test_migrate_generated_consumer.cjs");
const { test_migrate_simulate_throws } = require("./test_migrate_simulate_throws.cjs");

module.exports = {
  prepareMigration: test_migrate_cli_archiving,
  prepareMigrationConsumer: test_migrate_generated_consumer,
  testMigrationConsumer: test_migrate_simulate_throws,
};
