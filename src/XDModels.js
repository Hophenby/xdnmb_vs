



class Forum {
    /**
     * 
     * @param {Number} fid 
     * @param {Number} sort 
     * @param {string} name 
     * @param {string} notice 
     * @param {Number} threadCount 
     */
    constructor(fid, sort, name, notice, threadCount) {
        this.fid = fid;
        this.sort = sort;
        this.name = name;
        this.notice = notice;
        this.threadCount = threadCount;
    }


}

class Timeline {
    /**
     * 
     * @param {Number} fid 
     * @param {string} name 
     * @param {string} notice 
     * @param {Number} maxPage 
     */
    constructor(fid, name, notice, maxPage) {
        this.fid = fid;
        this.name = name;
        this.notice = notice;
        this.maxPage = maxPage;
    }
}

class Feed {
    constructor() {
        this.name = '订阅的串';
    }

    /**
     * 
     * @returns {string}
     */
    notice() {
        const vscode = require('vscode');
        const feedIdConfig = vscode.workspace.getConfiguration('xdnmb_vs').get('feedId');
        return `订阅过的串。\n当前使用的订阅ID： ${feedIdConfig}`;
    }
}

class ForumGroup {
    /**
     * @param {Number} gid
     * @param {Number} sort 
     * @param {string} name 
     * @param {Array<Forum|Timeline>} forums 
     */
    constructor(gid, sort, name, forums) {
        this.gid = gid;
        this.sort = sort;
        this.name = name;
        this.forums = forums;
    }
}

class Reply {
    /**
     * 
     * @param {Number} tid 
     * @param {string} img 
     * @param {string} imgThumb 
     * @param {*} now 
     * @param {string} userHash 
     * @param {string} name 
     * @param {string} title
     * @param {string} content 
     * @param {Boolean} admin 
     * @param {Boolean} isPo 
     */
    constructor(tid, img, imgThumb, now, userHash, name, title, content, admin, isPo) {
        this.tid = tid;
        this.img = img;
        this.imgThumb = imgThumb;
        this.now = now;
        this.userHash = userHash;
        this.name = name;
        this.title = title;
        this.content = content;
        this.admin = admin;
        this.isPo = isPo;

    }

    /**
     *  https://nmbxd.com/t/57491643
     * 
     *   根据网页版，以下格式都属于引用：
     * 
     *      >50000001
     *      >>50000001
     *      >>No.50000001
     * 
     *   发串的时候会去除每一行开头的空格
     * 
     *   以>或＞开头的行按照4chan的规则也使用绿字
     * 
     *   即使不在开头，以下使用全角符号的类似引用的格式也使用绿字但是又没有引用的弹窗，这里不当成引用来处理：
     * 
     *      ＞50000001
     *      ＞＞50000001
     *      ＞No.50000001
     *      ＞＞No.50000001
     * 
     * @returns {Array<Number>}
     */
    references() {
        try{return this.content.match(/(?:>{1,2}|>>No\.)(\d+)/g).map((ref) => Number(ref.match(/\d+/)[0]));}
        catch(e){return [];}
        
    }

    contentWithoutReference() {
        return this.content.replace(/(?:>{1,2}|>>No\.)(\d+)/g, '');
    }

    /**
     * 
     * @param {Number} length 
     * @returns {string}
     */
    summary(length = 50) {
        return this.contentWithoutReference().slice(0, length);
    }

    imagePreviewAvailable() {
        return this.img!==null && this.img.length > 0;
    }

    async markdown() {
        //const vscode = require('vscode');
        //let cn_formatted_now = this.now.
        let md_content = `# 　\n\n<span style="color: blue;">\`${this.now.toString().replace(/GMT\+\d{4}(?: \(CST\))?/,"")
                                                                    }\`\t\`${this.userHash}${
                                                                        this.isPo ? " (PO)" : ""
                                                                    }\`\t [No.${this.tid}](https://nmbxd.com/t/${this.tid})</span>\n\n`;
        if (this.title!=="无标题") {
            md_content += `标题： ${this.title}\n\n`;
        }
        if (this.name!=="无名氏") {
            md_content += `名字： ${this.name}\n\n`;
        }
        let content = this.content
        this.references().forEach(ref => {
            let rawRef = content.match(/(?:>{1,2}|>>No\.)(\d+)/)[0];
            content = content.replace(rawRef, `[${rawRef}](https://nmbxd.com/t/${ref})`);
        });
        md_content += content;
        md_content += `\n\n`;
        if (this.imagePreviewAvailable()) {
            md_content += `![image](${this.imgThumb})\n\n`;
            //await vscode.commands.executeCommand('xdnmb_vs.downloadImage', this.imgThumb).then((imgPath) => {md_content += `![image](${imgPath})\n\n`;});
        }
        
        return md_content;
    }
}

class Thread extends Reply {
    /**
     * 
     * @param {Number} tid 
     * @param {string} img 
     * @param {string} imgThumb 
     * @param {*} now 
     * @param {string} userHash 
     * @param {string} name 
     * @param {string} title
     * @param {string} content 
     * @param {Boolean} admin 
     * @param {Boolean} isPo 
     * @param {Forum} forum
     * @param {Number} replyCount 
     * @param {Boolean} sage 
     * @param {Array<Reply>} replies 
     */
    constructor(tid, img, imgThumb, now, userHash, name, title, content, admin, isPo, forum, sage, replyCount, replies) {
        super(tid, img, imgThumb, now, userHash, name, title, content, admin, isPo);
        this.forum = forum;
        this.sage = sage;
        this.replyCount = replyCount;
        this.replies = replies;
    }

    /**
     * 
     * @returns {Number}
     */
    maxPage() {
        return this.replyCount ? Math.ceil(this.replyCount / 19) : 1;
    }

    async markdown() {
        /*
         return super.markdown().then((md_content) => {
            let replies_md = '';
            this.replies.forEach(reply => {
                reply.markdown().then((reply_md) => {
                    replies_md += reply_md;
                });
            });
            return md_content + replies_md;
        });
         */
        return super.markdown().then((md_content) => {
            md_content = (this.sage ? "本串已被SEGA":"")+ md_content;
            md_content = `回复数：${this.replyCount}\n\n`+ md_content;
            return md_content;

        });
    }
}

module.exports = {
    Forum,
    ForumGroup,
    Timeline,
    Feed,
    Reply,
    Thread
}