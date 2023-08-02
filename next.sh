cd packages/fetcher
npm run build
npm publish --access public --tag next

cd ../sdk
npm run build
npm publish --access public --tag next

cd ../core
npm run build
npm publish --access public --tag next