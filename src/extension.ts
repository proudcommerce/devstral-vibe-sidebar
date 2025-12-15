import * as vscode from 'vscode';

const TERMINAL_NAME = 'Devstral Vibe';

export function activate(context: vscode.ExtensionContext) {
    console.log('Devstral Vibe extension is now active');

    // Register command to open/focus existing Devstral Vibe terminal
    context.subscriptions.push(
        vscode.commands.registerCommand('devstralVibe.openTerminal', () => {
            openTerminal(context, false);
        })
    );

    // Register command to open a new Devstral Vibe terminal
    context.subscriptions.push(
        vscode.commands.registerCommand('devstralVibe.openNewTerminal', () => {
            openTerminal(context, true);
        })
    );
}

export function deactivate() {
    console.log('Devstral Vibe extension is being deactivated');
}

function getWorkingDirectory(): string {
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

function findExistingTerminal(): vscode.Terminal | undefined {
    return vscode.window.terminals.find(t => t.name === TERMINAL_NAME);
}

function openTerminal(context: vscode.ExtensionContext, forceNew: boolean) {
    // Check if a Devstral Vibe terminal already exists
    if (!forceNew) {
        const existingTerminal = findExistingTerminal();
        if (existingTerminal) {
            existingTerminal.show();
            return;
        }
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('devstralVibe');
    const command = config.get<string>('command', 'vibe');
    const additionalArgs = config.get<string>('additionalArgs', '');

    // Build the full command
    const fullCommand = additionalArgs ? `${command} ${additionalArgs}` : command;

    // Create terminal with icon and position it beside the editor
    const terminal = vscode.window.createTerminal({
        name: TERMINAL_NAME,
        cwd: getWorkingDirectory(),
        iconPath: {
            light: vscode.Uri.file(context.asAbsolutePath('resources/devstral-logo.svg')),
            dark: vscode.Uri.file(context.asAbsolutePath('resources/devstral-logo.svg'))
        },
        location: {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: false
        },
        env: {
            DEVSTRAL_VIBE_CALLER: 'vscode'
        }
    });

    // Show the terminal and run the command
    terminal.show();
    terminal.sendText(fullCommand);
}
