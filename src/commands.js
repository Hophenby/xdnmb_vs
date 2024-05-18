const vscode = require('vscode');
const cheerio = require('cheerio');
//const axios = require('axios')
const BASE_URL = 'https://api.nmb.best/api/'

const session = require('./Globals').session;

async function _prevReply(tid, loadedReply, currentLoadedPage, currentLoadedReply) {
	const xdapi = require('./XDApi');
	//截胡开始
	currentLoadedReply--;
	//console.debug(currentLoadedReply);
	if (currentLoadedReply < 0) {
		currentLoadedPage--;
		//console.debug(currentLoadedPage);
		currentLoadedReply = loadedReply.replies.length - 1;
		if (currentLoadedPage <= 0) {
			currentLoadedPage = 1;
			currentLoadedReply = -1;
		}else{
			loadedReply = await xdapi.getThread(tid, currentLoadedPage);
		}
	}
	//loadedReplyCurrentPage.set(tid, currentLoadedPage);	//截胡输出
	//globals.loadedReplyCurrentReply.set(tid, currentLoadedReply); //截胡输出
	//console.debug(globals.loadedReply.replies[currentLoadedReply])
	let md_content = ""
	//let md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
	if (currentLoadedReply < 0) {
		md_content = await loadedReply.markdown();
	}else{
		md_content = await loadedReply.replies[currentLoadedReply].markdown();
	}
	let loadedMdTooltip = md_content; //截胡输出
	//截胡结束
	return {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip};
}

async function _nextReply(tid, loadedReply, currentLoadedPage, currentLoadedReply) {
	const xdapi = require('./XDApi');
	currentLoadedReply++;
	if (currentLoadedReply >= loadedReply.replies.length) {
		currentLoadedPage++;
		loadedReply = await xdapi.getThread(tid, currentLoadedPage);
		currentLoadedReply = 0;
	}
	//globals.loadedReplyCurrentPage.set(tid, currentLoadedPage); //截胡输出
	//globals.loadedReplyCurrentReply.set(tid, currentLoadedReply); //截胡输出
	let md_content = await loadedReply.replies[currentLoadedReply].markdown();
	let loadedMdTooltip = md_content; //截胡输出
	return {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip};
}

async function _nextNReplies(tid, loadedReply, currentLoadedPage, currentLoadedReply, n) {
	//let _prevNReplies = [];
	let mdTooltips = "";
	let _loadedReply = loadedReply, _currentLoadedPage=currentLoadedPage, _currentLoadedReply=currentLoadedReply;
	for(let i = 0; i < n; i++) {
		const {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip} = await _nextReply(tid, _loadedReply, _currentLoadedPage, _currentLoadedReply);
		//_prevNReplies.push({loadedReply1, currentLoadedPage1, currentLoadedReply1, loadedMdTooltip});
		_loadedReply = loadedReply;
		_currentLoadedPage = currentLoadedPage;
		_currentLoadedReply = currentLoadedReply;
		mdTooltips += loadedMdTooltip + "\n\n";
	}
	return {loadedReply: _loadedReply, currentLoadedPage: _currentLoadedPage, currentLoadedReply: _currentLoadedReply, loadedMdTooltip: mdTooltips};
}

async function _prevNReplies(tid, loadedReply, currentLoadedPage, currentLoadedReply, n) {
	//let _nextNReplies = [];
	let {_loadedReply, _currentLoadedPage, _currentLoadedReply, mdTooltips} = await _prevReply(tid, loadedReply, currentLoadedPage, currentLoadedReply);
	const __loadedReply = _loadedReply, __currentLoadedPage=_currentLoadedPage, __currentLoadedReply=_currentLoadedReply;
	for(let i = 0; i < n-1; i++) {
		const {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip} = await _prevReply(tid, _loadedReply, _currentLoadedPage, _currentLoadedReply);
		//_nextNReplies.push({loadedReply1, currentLoadedPage1, currentLoadedReply1, loadedMdTooltip});
		_loadedReply = loadedReply;
		_currentLoadedPage = currentLoadedPage;
		_currentLoadedReply = currentLoadedReply;
		mdTooltips += loadedMdTooltip + "\n\n";
		if (currentLoadedReply < 0) {
			break;
		}
	}
	return {loadedReply: __loadedReply, currentLoadedPage: __currentLoadedPage, currentLoadedReply: __currentLoadedReply, loadedMdTooltip: mdTooltips};
}



const COMMANDS=
{
    'xdnmb_vs.searchTid': async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from xdnmb_vs!');
		let tid = await vscode.window.showInputBox({
			placeHolder: '请输入串ID'
		});
		if (/[^0-9]{8,9}/.test(tid)) {
			vscode.window.showErrorMessage('请输入正确的串ID')
			return
		}
		try {
			await session.get(BASE_URL + `thread?id=${tid}&page=1`).then((res) => {
				console.log(res.data)
				//vscode.window.showInformationMessage(res.data.content)
				let $ = cheerio.load(res.data.content)
				let listContent = $('ul').children('li')
				let plainText = ''
				listContent.each((index, element) => {
					plainText += $(element).text() + '\n'
				})
				vscode.window.showInformationMessage(plainText)
				

			})
		}	catch (e) {
			console.warn(e)
		}
	},

    "xdnmb_vs.refreshForumGroup" : async function(){
        const globals = require('./Globals');
        const xdapi = require('./XDApi');
        xdapi.getForumList().then(forumGroup => {
            globals.forumGroups = forumGroup;
            if (forumGroup && globals.forumListDataProvider) {
                globals.forumListDataProvider.refresh();
                vscode.window.showInformationMessage('板块列表已刷新');
            }
        }).catch(e => {
            console.error(e);
            vscode.window.showErrorMessage('板块列表刷新失败');
        })
    },

    "xdnmb_vs.resetForumGroup" : async function(){
        const globals = require('./Globals');
        const xdapi = require('./XDApi');
        xdapi.getForumList().then(forumGroup => {
            globals.forumGroups = forumGroup;
            if (forumGroup && globals.forumListDataProvider) {
                globals.forumListDataProvider.reset();
                vscode.window.showInformationMessage('板块列表已重置');
            }
        }).catch(e => {
            console.error(e);
            vscode.window.showErrorMessage('板块列表重置失败');
        })
    },

	"xdnmb_vs.nextReply": async function (tid) {
		console.debug(`xdnmb_vs.nextReply?${tid}`);
		const vscode = require('vscode');
		const globals = require('./Globals');
		//const xdapi = require('./XDApi');
		//截胡开始
		let numToLoad = globals.replyNumToLoad;
		let loadedReplyCurrentPage = globals.loadedReplyCurrentPage.has(tid) ? globals.loadedReplyCurrentPage.get(tid) : 1; //截胡输入
		let loadedReplyCurrentReply = globals.loadedReplyCurrentReply.has(tid) ? globals.loadedReplyCurrentReply.get(tid) : -1; //截胡输入
		//const {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip} = await _nextReply(tid, globals.loadedReply, loadedReplyCurrentPage, loadedReplyCurrentReply);
		const {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip} = await _nextNReplies(tid, globals.loadedReply, loadedReplyCurrentPage, loadedReplyCurrentReply, numToLoad);
		globals.loadedReply = loadedReply; //截胡输出
		globals.loadedReplyCurrentPage.set(tid, currentLoadedPage); //截胡输出
		globals.loadedReplyCurrentReply.set(tid, currentLoadedReply); //截胡输出
		//let md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
		globals.loadedMdTooltip = loadedMdTooltip; //截胡输出
		//截胡结束
		vscode.window.showInformationMessage(`${numToLoad}条串内容已加载到悬停提示\n\n当前位置：第${currentLoadedPage}页，第${currentLoadedReply+1}条回复`);
	},

	"xdnmb_vs.prevReply": async function (tid) {
		console.debug(`xdnmb_vs.prevReply?${tid}`);
		const vscode = require('vscode');
		const globals = require('./Globals');
		//const xdapi = require('./XDApi');
		
		let numToLoad = globals.replyNumToLoad;
		let loadedReplyCurrentPage = globals.loadedReplyCurrentPage.has(tid) ? globals.loadedReplyCurrentPage.get(tid) : 1; 
		let loadedReplyCurrentReply = globals.loadedReplyCurrentReply.has(tid) ? globals.loadedReplyCurrentReply.get(tid) : -1; 

		//const {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip} = await _prevReply(tid, globals.loadedReply, loadedReplyCurrentPage, loadedReplyCurrentReply);
		const {loadedReply, currentLoadedPage, currentLoadedReply, loadedMdTooltip} = await _prevNReplies(tid, globals.loadedReply, loadedReplyCurrentPage, loadedReplyCurrentReply, numToLoad);
		
		globals.loadedReply = loadedReply;
		globals.loadedReplyCurrentPage.set(tid, currentLoadedPage);	
		globals.loadedReplyCurrentReply.set(tid, currentLoadedReply); 
		globals.loadedMdTooltip = loadedMdTooltip; 

		vscode.window.showInformationMessage(`${numToLoad}条串内容已加载到悬停提示\n\n当前位置：第${currentLoadedPage}页，第${currentLoadedReply+1}条回复`);
	},
	"xdnmb_vs.firstReply": async function (tid) {
		console.debug(`xdnmb_vs.firstReply?${tid}`);
		const vscode = require('vscode');
		const globals = require('./Globals');
		const xdapi = require('./XDApi');
		let currentLoadedPage = globals.loadedReplyCurrentPage.has(tid) ? globals.loadedReplyCurrentPage.get(tid) : 1;
		let currentLoadedReply = -1;
		if (currentLoadedPage != 1) {
			globals.loadedReply = await xdapi.getThread(tid, 1);
			console.debug(globals.loadedReply);
		}
		currentLoadedPage = 1;

		globals.loadedReplyCurrentPage.set(tid, currentLoadedPage);
		globals.loadedReplyCurrentReply.set(tid, currentLoadedReply);
		let md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
		globals.loadedMdTooltip = md_content;
		vscode.window.showInformationMessage(`串内容已加载到悬停提示\n\n当前位置：第${currentLoadedPage}页，第${currentLoadedReply+1}条回复`);
	},
	"xdnmb_vs.lastReply": async function (tid) {
		console.debug(`xdnmb_vs.lastReply?${tid}`);
		const vscode = require('vscode');
		const globals = require('./Globals');
		const xdapi = require('./XDApi');
		let maxPage = await xdapi.getThread(tid, 1).then(thread => thread.maxPage());
		globals.loadedReply = await xdapi.getThread(tid, maxPage);
		globals.loadedReplyCurrentPage.set(tid, maxPage);
		const currentLoadedReply = globals.loadedReply.replies.length - 1;
		globals.loadedReplyCurrentReply.set(tid, currentLoadedReply);
		let md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
		globals.loadedMdTooltip = md_content;
		vscode.window.showInformationMessage(`串内容已加载到悬停提示\n\n当前位置：第${maxPage}页，第${currentLoadedReply+1}条回复`);
	},
	"xdnmb_vs.changeNumToLoad": async function (n) {
		console.debug(`xdnmb_vs.changeNumToLoad?${n}`);
		const vscode = require('vscode');
		const globals = require('./Globals');
		globals.replyNumToLoad = n;
		vscode.window.showInformationMessage(`每次加载${n}条回复`);
	}

	

}

module.exports = COMMANDS;