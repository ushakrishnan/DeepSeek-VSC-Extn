// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Ollama } from 'ollama';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Register the command 'codehelper.codehelper-ext'
	const disposable = vscode.commands.registerCommand('codehelper.codehelper-ext', () => {
		// Create and show a new webview panel
		const panel = vscode.window.createWebviewPanel(
			'CodeHelperChat', // Identifies the type of the webview. Used internally
			'CodeHelper Chat', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{ enableScripts: true } // Webview options. More on these later.
		);

		// Set the HTML content for the webview
		panel.webview.html = getWebviewContent();

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(async (message: any) => {
			try {
				switch (message.command) {
					case 'chat':
						// Create an instance of Ollama
						const ollama = new Ollama();
						// Send a chat request to the deepseek-coder:1.3b model
						const streamresponse = await ollama.chat({ 
							model: 'deepseek-coder:1.3b',
							messages: [{ role: 'user', content: message.text }],
							stream: true
						});
				
						let responseText = '';
						// Process the streaming response
						for await (const part of streamresponse) {
							responseText += part.message.content;
							// Send the response back to the webview
							panel.webview.postMessage({ command: 'response', text: responseText });
						}
						break;
				}
			} catch (error) {
				console.error('Error handling message:', error);
				panel.webview.postMessage({ command: 'response', text: 'An error occurred while processing your request - OnDidReceive function.' });
			}
		});
	});

	// Add the command to the extension's subscriptions
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
			// Acquire the VS Code API
			const vscode = acquireVsCodeApi();
			// Add an event listener to the button
			document.getElementById('askBtn').addEventListener('click', () => {
				const promptValue = document.getElementById('prompt').value;
				// Send a message to the extension
				vscode.postMessage({ command: 'chat', text: promptValue });
			});

			// Handle messages from the extension
			window.addEventListener('message', event => {
				const message = event.data;
				switch (message.command) {
					case 'response':
						// Display the response in the webview
						document.getElementById('response').innerText = message.text;
						break;
				}
			});
		</script>
	</body>
	</html>`;
}

