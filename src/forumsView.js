//import { all } from 'axios';

//import { get } from 'axios';

const vscode = require('vscode');

class ForumListDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.pages={};
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    reset() {
        this.pages={};
        this.refresh();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        const globals = require('./Globals');
        const xdapi = require('./xdnmb/XDApi');
        if (!globals.forumGroups) {
            return [new ThreadTreeItem('loading')];
        }
        if (!element) {
            return globals.forumGroups.map(group => {
                return new ForumGroupTreeItem(group, vscode.TreeItemCollapsibleState.Collapsed);
            });
        }
        if (element instanceof ForumGroupTreeItem) {
            let group = globals.forumGroups.find(group => group.gid === element.gid);
            return group.forums.map(forum => {
                return new ForumTreeItem(forum, vscode.TreeItemCollapsibleState.Collapsed);

            });
        }
        if (element instanceof ForumTreeItem) {
            let forum = globals.forumGroups.flatMap(group => group.forums).find(forum => forum.fid === element.fid);

            if (!this.pages[forum.fid]) {this.pages[forum.fid]=new Map();}
            //console.debug("element.page:"+element.page);

            if (this.pages[forum.fid].size==0){
                let threads = await xdapi.getForum(forum, 1);
                this.pages[forum.fid].set(1, threads);
            }
            console.debug(this.pages[forum.fid]);
            console.debug(`size of pages[${forum.fid}]:`+this.pages[forum.fid].size);
            //console.debug(this.pages[forum.fid][2]);
            let allPagesThreads = [];
            this.pages[forum.fid].forEach((value,key,map) => {
                allPagesThreads=allPagesThreads.concat(value);
                console.debug('page '+key);
                console.debug(value);
            });
                
            console.debug(allPagesThreads);

            return allPagesThreads.map(thread => {
                return new ThreadTreeItem(thread);
            }).concat(new ThreadTreeItem('nextPage',forum.fid,element));
            
        }
        

        //return ['Item 1', 'Item 2', 'Item 3'].map(label => ({ label }));
    }

    /**
     * 
     * @param {xdapi.Forum} forum
     * @param {*} page
     * 
     */
    async nextPage(forum,page){

        const xdapi = require('./xdnmb/XDApi');

        page = (page instanceof Number) ? page + 1:this.pages[forum.fid].size+1;
        console.debug('nextPage: '+page);
        let threads = await xdapi.getForum(forum, page);
        this.pages[forum.fid].set(page,threads);
        this.refresh();
    }

}

class ForumGroupTreeItem extends vscode.TreeItem {
    constructor(forumGroup, collapsibleState) {
        const { gid, name } = forumGroup;
        super(name, collapsibleState);
        this.gid = gid;
    }
}

class ForumTreeItem extends vscode.TreeItem {
    constructor(forum, collapsibleState) {
        const { fid, name } = forum;
        super(name, collapsibleState);
        this.fid = fid;
        //this.page=1;
        this.forum=forum;
    }

    

    
}

const FUNCTIONAL_THREAD_TYPE = {
    "nextPage": "下一页",
    "loading": "加载中...",
}


class ThreadTreeItem extends vscode.TreeItem {
    constructor(thread, fid, parent) {
        fid = fid || thread.fid;
        if (FUNCTIONAL_THREAD_TYPE[thread]) {
            super(FUNCTIONAL_THREAD_TYPE[thread], vscode.TreeItemCollapsibleState.None);
            this.functional=true;
            this.functionalType=thread;
            this.fid=fid;
            this.parent=parent;
            return;
        }
        const { tid } = thread;
        const content = thread.summary(50);
        super(content, vscode.TreeItemCollapsibleState.None);
        this.tid = tid;
        this.fid = fid;
        this.thread = thread;
        
    }
}



//const globals = require('./Globals');
//const treeView = globals.treeView; 


module.exports = {
    ForumListDataProvider,
    FUNCTIONAL_THREAD_TYPE
}