cd default
npx rimraf -rf src/api/functional
npx ts-node ../../src/bin/nestia sdk src/controllers --out src/api

cd ../tsconfig.json
npx rimraf -rf src/api/functional
npx ts-node ../../src/bin/nestia sdk src/controllers --out src/api

cd ../nestia.config.ts
npx rimraf -rf src/api/functional
npx ts-node ../../src/bin/nestia sdk