cd default
rm -rf src/api/functional
npx ts-node ../../src/bin/nestia sdk src/controllers --out src/api

cd ../tsconfig.json
rm -rf src/api/functional
npx ts-node ../../src/bin/nestia sdk src/controllers --out src/api

cd ../nestia.config.ts
rm -rf src/api/functional
npx ts-node ../../src/bin/nestia sdk