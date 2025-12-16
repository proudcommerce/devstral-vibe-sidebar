#!/bin/bash

echo "Building extension..."
npm install
npm run compile
npx vsce package

code --install-extension devstral-vibe-sidebar-0.0.3.vsix --force

echo "Please reload the VS Code window to use the extension."