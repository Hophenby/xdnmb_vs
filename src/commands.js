const vscode = require('vscode');
const cheerio = require('cheerio');
const axios = require('axios')
const BASE_URL = 'https://api.nmb.best/api/'


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
			await axios.get(BASE_URL + `thread?id=${tid}&page=1`, {
				headers: {
					'Cookie': COOKIE_FOR_DEBUG
				}
			}).then((res) => {
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
        const xdapi = require('./xdnmb/XDApi');
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
        const xdapi = require('./xdnmb/XDApi');
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
		const xdapi = require('./xdnmb/XDApi');
		let currentLoadedPage = globals.loadedReplyCurrentPage.has(tid) ? globals.loadedReplyCurrentPage.get(tid) : 1;
		let currentLoadedReply = globals.loadedReplyCurrentReply.has(tid) ? globals.loadedReplyCurrentReply.get(tid) : -1;
		currentLoadedReply++;
		if (currentLoadedReply >= globals.loadedReply.replies.length) {
			currentLoadedPage++;
			globals.loadedReply = await xdapi.getThread(tid, currentLoadedPage);
			currentLoadedReply = 0;
		}
		globals.loadedReplyCurrentPage.set(tid, currentLoadedPage);
		globals.loadedReplyCurrentReply.set(tid, currentLoadedReply);
		let md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
		globals.loadedMdTooltip = md_content;
		vscode.window.showInformationMessage(`串内容已加载到悬停提示\n\n当前位置：第${currentLoadedPage}页，第${currentLoadedReply+1}条回复`);
	},

	"xdnmb_vs.prevReply": async function (tid) {
		console.debug(`xdnmb_vs.prevReply?${tid}`);
		const vscode = require('vscode');
		const globals = require('./Globals');
		const xdapi = require('./xdnmb/XDApi');
		let currentLoadedPage = globals.loadedReplyCurrentPage.has(tid) ? globals.loadedReplyCurrentPage.get(tid) : 1;
		let currentLoadedReply = globals.loadedReplyCurrentReply.has(tid) ? globals.loadedReplyCurrentReply.get(tid) : -1;
		currentLoadedReply--;
		//console.debug(currentLoadedReply);
		if (currentLoadedReply < 0) {
			currentLoadedPage--;
			//console.debug(currentLoadedPage);
			currentLoadedReply = globals.loadedReply.replies.length - 1;
			if (currentLoadedPage <= 0) {
				currentLoadedPage = 1;
				currentLoadedReply = -1;
			}else{
				globals.loadedReply = await xdapi.getThread(tid, currentLoadedPage);
			}
		}
		globals.loadedReplyCurrentPage.set(tid, currentLoadedPage);
		globals.loadedReplyCurrentReply.set(tid, currentLoadedReply);
		//console.debug(globals.loadedReply.replies[currentLoadedReply])
		let md_content = ""
		//let md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
		if (currentLoadedReply < 0) {
			md_content = await globals.loadedReply.markdown();
		}else{
			md_content = await globals.loadedReply.replies[currentLoadedReply].markdown();
		}
		globals.loadedMdTooltip = md_content;
		vscode.window.showInformationMessage(`串内容已加载到悬停提示\n\n当前位置：第${currentLoadedPage}页，第${currentLoadedReply+1}条回复`);
	}
	

}

module.exports = COMMANDS;