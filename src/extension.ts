import * as vscode from 'vscode';
import * as pty from 'node-pty';
import * as os from 'os';

let ptyProcess: pty.IPty | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Devstral Vibe Sidebar extension is now active');

    // Register the webview view provider
    const provider = new DevstralVibeViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'devstralVibeView',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Register command to open Devstral Vibe sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('devstralVibe.openTerminal', () => {
            // Focus the Devstral Vibe view in the sidebar
            vscode.commands.executeCommand('devstralVibeView.focus');
        })
    );

    // Clean up PTY process on deactivation
    context.subscriptions.push({
        dispose: () => {
            if (ptyProcess) {
                console.log('Cleaning up Vibe terminal...');
                ptyProcess.kill();
                ptyProcess = undefined;
            }
        }
    });
}

export function deactivate() {
    console.log('Devstral Vibe Sidebar extension is being deactivated');
    if (ptyProcess) {
        console.log('Terminating Vibe terminal...');
        ptyProcess.kill();
        ptyProcess = undefined;
    }
}

class DevstralVibeViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'input':
                    if (ptyProcess) {
                        ptyProcess.write(data.value);
                    }
                    break;
                case 'resize':
                    if (ptyProcess) {
                        ptyProcess.resize(data.cols, data.rows);
                    }
                    break;
                case 'ready':
                    this.startTerminal();
                    break;
            }
        });
    }

    private getWorkingDirectory(): string {
        // 1. Try to get the first workspace folder
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // 2. Fallback to home directory
        if (process.env.HOME) {
            return process.env.HOME;
        }

        // 3. Last resort: current working directory
        return process.cwd();
    }

    private startTerminal() {
        if (ptyProcess) {
            return;
        }

        try {
            // Get configuration
            const config = vscode.workspace.getConfiguration('devstralVibeSidebar');
            const command = config.get<string>('command', 'vibe');
            const additionalArgs = config.get<string>('additionalArgs', '');

            // Determine the shell to use
            const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash');

            // Create PTY process
            ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-256color',
                cols: 80,
                rows: 30,
                cwd: this.getWorkingDirectory(),
                env: process.env as { [key: string]: string }
            });

            // Send data to webview
            ptyProcess.onData((data: string) => {
                this._view?.webview.postMessage({
                    type: 'data',
                    value: data
                });
            });

            // Handle terminal exit
            ptyProcess.onExit((e: { exitCode: number; signal?: number }) => {
                this._view?.webview.postMessage({
                    type: 'exit',
                    value: e.exitCode
                });
                ptyProcess = undefined;
            });

            // Automatically run configurable command
            setTimeout(() => {
                if (ptyProcess) {
                    const fullCommand = additionalArgs
                        ? `${command} ${additionalArgs}\r`
                        : `${command}\r`;
                    ptyProcess.write(fullCommand);
                }
            }, 100);

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start terminal: ${message}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devstral Vibe Terminal</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #000;
            overflow: hidden;
        }
        #terminal {
            height: 100vh;
            width: 100%;
        }
    </style>
</head>
<body>
    <div id="terminal"></div>

    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
    <script>
        const vscode = acquireVsCodeApi();

        // Initialize xterm.js
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 12,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4'
            }
        });

        // Add fit addon
        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);

        // Open terminal in the container
        term.open(document.getElementById('terminal'));
        fitAddon.fit();

        // Handle terminal input
        term.onData(data => {
            vscode.postMessage({
                type: 'input',
                value: data
            });
        });

        // Handle terminal resize
        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
            vscode.postMessage({
                type: 'resize',
                cols: term.cols,
                rows: term.rows
            });
        });
        resizeObserver.observe(document.getElementById('terminal'));

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'data':
                    term.write(message.value);
                    break;
                case 'exit':
                    term.write('\\r\\n\\r\\n[Process exited with code ' + message.value + ']\\r\\n');
                    break;
            }
        });

        // Notify extension that terminal is ready
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
    }
}
