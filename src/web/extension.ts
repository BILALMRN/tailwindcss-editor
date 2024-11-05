import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let panel: vscode.WebviewPanel | undefined;
	const webview = vscode.commands.registerCommand(
		"tailwindCss-editor.costumeTailwindCss",
		() => {
			if (panel) {
				panel.dispose();
			}
			panel = vscode.window.createWebviewPanel(
				"tailwindCss-editor",
				"TailwindCss Editor",
				{
					viewColumn: vscode.ViewColumn.One,
					preserveFocus: true,
				},
				{
					enableScripts: true,
				}
			);

			panel.onDidDispose(() => {
				panel = undefined;
			});
			const stylePath = vscode.Uri.joinPath(
				context.extensionUri,
				"media",
				"style.css"
			);
			const scriptPath = vscode.Uri.joinPath(
				context.extensionUri,
				"media",
				"main.js"
			);
			const styleUri = panel.webview.asWebviewUri(stylePath);
			const scriptUri = panel.webview.asWebviewUri(scriptPath);
			panel.webview.html = getWebviewContent(
				panel.webview.cspSource,
				styleUri,
				scriptUri
			);


			const editor = vscode.window.activeTextEditor;
			panel.webview.onDidReceiveMessage(
				async (message) => {

					switch (message.command) {
						case "onReady":
							if (editor) {
								const selection: vscode.Range | vscode.Position = editor.selection;
								if (selection && !selection.isEmpty) {
									const selectionText = editor.document.getText(new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character));
									panel!.webview.postMessage({ command: "setHtml", data: selectionText });
								}else{
									vscode.window.showErrorMessage("text selected is not found");
									// Dispose of the webview panel
									panel?.dispose();
								}
							}
							break;
						case "save":
							try {
								if (editor) {
									replaceText(editor, message.data);
								} else {
									vscode.window.showErrorMessage("text selected is not found");
								}
							} catch (error) {
								vscode.window.showErrorMessage("something went wrong (try again) (^_^)");
							}finally {
								// Dispose of the webview panel
								panel?.dispose();
							}
							break;
					}
				},
				undefined,
				context.subscriptions
			);
		}

	);

	context.subscriptions.push(webview);
}


function replaceText(editor: vscode.TextEditor, replacement: string) {
	const edit = new vscode.WorkspaceEdit();
	const selection = editor.selection;
	edit.replace(editor.document.uri, new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character), replacement);
	vscode.workspace.applyEdit(edit);
}

function getWebviewContent(
	_cspSource: string,
	styleUri: vscode.Uri,
	scriptUri: vscode.Uri
) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy">
	<link rel="stylesheet" href="${styleUri}"/>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/grapesjs/0.22.1/css/grapes.min.css" />
	
	<title>GrapesJS Editor</title>
</head>
<body>
    <div id="gjs" style="height: 100vh; overflow: hidden"></div>
</body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/grapesjs/0.22.1/grapes.min.js"></script>
<script src="https://unpkg.com/grapesjs-custom-code"></script>
<script type="module" src="${scriptUri}" ></script>
<script src="https://cdn.tailwindcss.com"></script>
</html>`;
}


// This method is called when your extension is deactivated
export function deactivate() { }
