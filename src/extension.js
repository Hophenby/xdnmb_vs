// The module 'vscode' contains the VS Code extensibility API

//import { sort } from '../vsc-extension-samples/helloworld-web-sample/webpack.config';

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
//const cheerio = require('cheerio');

//const axios = require('axios')

//const xdmodels = require('./XDModels');
const xdapi = require('./xdnmb/XDApi');

//const BASE_URL = 'https://api.nmb.best/api/'

const globals = require('./Globals');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "xdnmb_vs" is now active!');
	const commands = require('./commands');
	for (let command in commands) {
		context.subscriptions.push(vscode.commands.registerCommand(command, commands[command]));
	}
	


	globals.forumListDataProvider = new (require('./forumsView').ForumListDataProvider)();
	const treeDataProvider = globals.forumListDataProvider;

	globals.treeView = vscode.window.createTreeView('forumList', { treeDataProvider });
	const treeView = globals.treeView;

	treeView.onDidChangeSelection(async ({ selection }) => {
		console.debug(selection);
		console.debug(selection[0].thread);
		console.debug(selection[0].functional);
		console.debug(selection[0].functionalType);
		if (selection[0].thread) {
			let thread = selection[0].thread;
			//let md_content = await thread.markdown();
			let currentLoadedPage = globals.loadedReplyCurrentPage.has(thread.tid) ? globals.loadedReplyCurrentPage.get(thread.tid) : 1;
			globals.loadedReplyCurrentPage.set(thread.tid, currentLoadedPage);
			globals.loadedReply = await xdapi.getThread(thread, currentLoadedPage);
			console.debug(globals.loadedReply);
			let currentLoadedReply = globals.loadedReplyCurrentReply.has(thread.tid) ? globals.loadedReplyCurrentReply.get(thread.tid) : -1;
			globals.loadedMdTooltip = await globals.loadedReply.markdown();
			if (currentLoadedReply >=0) {
				globals.loadedMdTooltip = await globals.loadedReply.replies[currentLoadedReply].markdown();
			}
			//console.debug(globals.loadedMdTooltip);
			vscode.window.showInformationMessage(`串内容已加载到悬停提示\n\n当前位置：第${currentLoadedPage}页，第${currentLoadedReply+1}条回复`);
		}
		if (selection[0].functional && selection[0].functionalType === 'nextPage') {
			//let forum = selection[0].fid;
			//forum = globals.forumGroups.flatMap(group => group.forums).find(forum => forum.fid === forum);
			console.debug(selection[0].parent);
			let forum = selection[0].parent.forum;
			console.debug(forum);
			await treeDataProvider.nextPage(forum);
		}
		if (selection[0].functional && selection[0].functionalType === 'loading') {
			vscode.window.showInformationMessage('你急也没用');
		}
		
	});
	
	vscode.languages.registerHoverProvider(
		["typescript", "javascript", "vue"],
		{
		  async provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position);
			const word = document.getText(range);
			if (word === "const") {
				const tooltips=[
					globals.loadedMdTooltip,
					`[上一条回复](command:xdnmb_vs.prevReply?${globals.loadedReply.tid})\n\n`,
					`[下一条回复](command:xdnmb_vs.nextReply?${globals.loadedReply.tid})\n\n`

				].map(tooltip => new vscode.MarkdownString(tooltip)).map(tooltip => {tooltip.isTrusted = true;return tooltip;});
				//hover.appendCodeblock("const", "javascript");
				//console.debug(globals.loadedReply.);
				//hover.isTrusted = true;
			  return new vscode.Hover(tooltips, range);
			}
		  },
		}
	  );

    
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	
	xdapi.getForumList().then(forumGroup => {
		globals.forumGroups = forumGroup;
		if (forumGroup) {
			treeDataProvider.refresh();
			vscode.window.showInformationMessage('板块列表已刷新');
		} 
	}	).catch(e => {
		console.error(e);
		vscode.window.showErrorMessage('板块列表刷新失败'+ `${e}`);
	})

	//context.subscriptions.push(searchTid);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
