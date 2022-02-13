cd default
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"

cd ../tsconfig.json
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"

cd ../nestia.config.ts
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk

cd ../exclude
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --exclude "src/controllers/**/throw_error.ts" --out "src/api"

cd ../reference
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/**/*.controller.ts" --out "src/api"