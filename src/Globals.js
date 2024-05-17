let forumGroups = null // Array<ForumGroup>

let forumListDataProvider = null // ForumListDataProvider

let treeView = null // vscode.TreeView

let loadedMdTooltip = ""

let loadedReply = null // Reply

let loadedReplyCurrentPage = new Map() // Map<tid, number>

let loadedReplyCurrentReply = new Map() // Map<tid, number>

const puppeteer = require('puppeteer');
let browser = puppeteer.launch({ headless: true });




module.exports = {
    forumGroups: forumGroups,
    forumListDataProvider: forumListDataProvider,
    treeView: treeView,
    loadedMdTooltip: loadedMdTooltip,
    browser: browser,
    loadedReply: loadedReply,
    loadedReplyCurrentPage: loadedReplyCurrentPage,
    loadedReplyCurrentReply: loadedReplyCurrentReply
}