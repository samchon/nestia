cd ../packages/fetcher
npm install
npm run build
npm publish --access public --tag next

cd ../core
npm install
npm run build
npm publish --access public --tag next

cd ../sdk
npm install
npm run build
npm publish --access public --tag next