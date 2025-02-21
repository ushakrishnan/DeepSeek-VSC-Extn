// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Ollama } from 'ollama';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('codehelper.codehelper-ext', () => {
		const panel = vscode.window.createWebviewPanel(
			'CodeHelperChat', // Identifies the type of the webview. Used internally
			'CodeHelper Chat', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			 { enableScripts: true } // Webview options. More on these later.
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			try {
				switch (message.command) {
					case 'chat':
					const ollama = new Ollama();
					const streamresponse = await ollama.chat({ 
						model: 'deepseek-coder:1.3b',
						messages: [{ role: 'user', content: message.text }],
						stream: true
					});
			
					let responseText = '';
					for await (const part of streamresponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'response', text: responseText });
					}
				}
			} catch (error) {
				console.error('Error handling message:', error);
				panel.webview.postMessage({ command: 'response', text: 'An error occurred while processing your request - OnDidReceive function.' });
			}
		});
	});

	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
export function deactivate() {}

// Function to get the HTML content for the webview
function getWebviewContent() {
	return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>CodeHelper</title>
	</head>
	<body>
		<h1>Hello from CodeHelper!</h1>
		<textarea id="prompt" rows="4" cols="50"></textarea><br>
		<button id="askBtn">Send</button>
		<div id="response"></div>
		<script>
			const vscode = acquireVsCodeApi();
			document.getElementById('askBtn').addEventListener('click', () => {
				const promptValue = document.getElementById('prompt').value;
				vscode.postMessage({ command: 'chat', text: promptValue });
			});

			window.addEventListener('message', event => {
				const message = event.data;
				switch (message.command) {
					case 'response':
						document.getElementById('response').innerText = message.text;
						break;
				}
			});
		</script>
	</body>
	</html>`;
}

