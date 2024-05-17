let forumGroups = null // Array<ForumGroup>

let forumListDataProvider = null // ForumListDataProvider

let treeView = null // vscode.TreeView

let loadedMdTooltip = ""

let loadedReply = null // Reply

let loadedReplyCurrentPage = new Map() // Map<tid, number>

let loadedReplyCurrentReply = new Map() // Map<tid, number>

const puppeteer = require('puppeteer');
let browser = puppeteer.launch({ headless: true });

const axios = require('axios');
class Session {
    constructor() {
        this.browser = null;
        this.data = {};
        this.response_code = null;
        this.config = {};
    }

    async get(url) {
        
        await axios.get(url, this.config).then(response => {
            this.data = response.data;
            this.response_code = response.status;
        }).catch(e => {
            console.error(e);
            require('vscode').window.showErrorMessage('网络请求失败: '+`${e}`);
        });

        return this;
    }
}

const cookie = (require('vscode')).workspace.getConfiguration('xdnmb_vs').get('cookie');
require('vscode').window.showInformationMessage(`cookie: ${cookie}`);

const session = new Session();
session.config = {
    method: 'GET',
    headers: {
        //'Content-Type': 'application/json',
        'Cookie': `userhash=${cookie}`
    }
};


module.exports = {
    forumGroups: forumGroups,
    forumListDataProvider: forumListDataProvider,
    treeView: treeView,
    loadedMdTooltip: loadedMdTooltip,
    browser: browser,
    loadedReply: loadedReply,
    loadedReplyCurrentPage: loadedReplyCurrentPage,
    loadedReplyCurrentReply: loadedReplyCurrentReply,
    //Session: Session,
    session: session
}