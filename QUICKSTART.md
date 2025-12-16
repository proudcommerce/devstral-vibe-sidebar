# Quick Start Guide

This guide will get you up and running with the Mistral Vibe Sidebar extension in under 5 minutes.

## Prerequisites Check

Before you start, verify you have everything installed:

```bash
# Check Node.js (should be v18+)
node --version

# Check npm
npm --version

# Check Mistral Vibe CLI
vibe --version

# Check if you have build tools (macOS)
xcode-select -p
```

If any of these commands fail, install the missing prerequisites first (see README.md).


## Installation Steps

### 1. Get the Code

```bash
git clone https://github.com/proud-commerce/VSCode-Mistral-Vibe-Sidebar
cd VSCode-Mistral-Vibe-Sidebar
```

### 2. Install & Build

```bash
npm install
npm run compile
```

### 3. Test the Extension

Open in VS Code and press F5:

```bash
code .
# Press F5 when VS Code opens
```

A new VS Code window will open with the extension running.

### 4. Use the Extension

1. Look for the Mistral Vibe icon above your current editor tab
2. Click it to open a terminal next to your current editor
3. The terminal automatically runs `vibe` for you
4. Start chatting with Devstral in the terminal!

## That's It!

You now have Mistral Vibe integrated into your VS Code sidebar.

For permanent installation (so it's available in all VS Code windows), see the README.md file.

## Common Issues

**"vibe: command not found"**

- Install Mistral Vibe CLI first
- Make sure it's in your PATH

**Extension doesn't show in sidebar**

- Make sure you pressed F5 to launch the Extension Development Host
- Look for the new VS Code window that opens

**"node-pty" errors or module version mismatch**

- This is the most common issue!
- Solution: `npm run rebuild`
- If that doesn't work: `rm -rf node_modules && npm install`

**Terminal shows errors**

- Check the Debug Console in the original VS Code window
- Make sure Mistral Vibe CLI works in your regular terminal first
