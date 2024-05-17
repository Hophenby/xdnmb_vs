//import { fsync } from 'fs';

const moment = require('moment');

//const axios = require('axios');
//const axiosCookieJarSupport = require('axios-cookiejar-support').wrapper;
//const tough = require('tough-cookie');

//axiosCookieJarSupport(axios);

//const puppeteer = require('puppeteer');

const xdmodels = require('./XDModels');
const cheerio = require('cheerio');

const JSON_API_ENDPOINT = 'https://api.nmb.best/api/'
//const HTML_API_ENDPOINT = 'https://www.nmbxd.com/home/forum/'
const IMAGE_CDN = 'https://image.nmb.best/'



const session = require('./Globals').session;

function _stripHTML(text){
    let $=cheerio.load(text.replace(/^\s+|\s+$/m, '\n'));
    $('br').replaceWith('\n');
    return $.text();
}

/**
 * 
 * @param {string} text 
 * @returns {moment.Moment}
 */
function _parseThreadTime(text){
    //2024-05-13(一)10:45:05
    const weekdays = ['日','一','二','三','四','五','六'];
    weekdays.forEach((weekday, index) => {
        text = text.replace(weekday, index.toString());
    } );
    return moment(text, 'YYYY-MM-DD(ddd)HH:mm:ss');
    

}

/**
 * 
 * @returns {Promise<Array<xdmodels.ForumGroup>>}
 */
async function getForumList() {
    //const xdmodels = require('./XDModels');
    let groups = [];
    let result = await session.get(JSON_API_ENDPOINT + 'getForumList')
    result.data.forEach(groupRaw => {
        let forums = [];
        groupRaw.forums.forEach(forumRaw => {
            if(forumRaw.id >= 0){
                ['showName','msg'].forEach(key => {
                    if(!forumRaw[key]){
                        forumRaw[key] = '';
                    }
                });
                ['sort','thread_count'].forEach(key => {
                    if(!forumRaw[key]){
                        forumRaw[key] = 0;
                    }
                });
                let forum = new xdmodels.Forum(
                    forumRaw.id, 
                    forumRaw.sort, 
                    _stripHTML(forumRaw.showName!=='' ? forumRaw.showName : forumRaw.name), 
                    _stripHTML(forumRaw.msg), 
                    forumRaw.thread_count);
                forums.push(forum);
            }
        });
        forums.sort((a, b) => a.sort - b.sort);
        let group = new xdmodels.ForumGroup(
            groupRaw.id, 
            groupRaw.sort, 
            groupRaw.name, 
            forums);
        groups.push(group);
    });
    return groups;
}

/**
 * 
 * @returns {Promise<Array<xdmodels.Timeline>>}
 
 */
async function getTimelineList() {
    //const xdmodels = require('./XDModels');
    let timelines = [];
    let result = await session.get(JSON_API_ENDPOINT + 'getTimelineList')
    result.data.forEach(timelineRaw => {
        let timeline = new xdmodels.Timeline(
            timelineRaw.id, 
            _stripHTML(timelineRaw.display_name || timelineRaw.name), 
            _stripHTML(timelineRaw.notice), 
            timelineRaw.max_page);
        timelines.push(timeline);
    });
    return timelines;
}

/**
 * 
 * @param {xdmodels.Forum|xdmodels.Timeline} forum
 * @param {Number} page 
 * @returns {Promise<Array<xdmodels.Thread>>}
 */
async function getForum(forum, page=1) {
    const c = forum instanceof xdmodels.Forum ? 'showf' : 'timeline';
    const response = await session.get(JSON_API_ENDPOINT + c + `?id=${forum.fid}&page=${page}`);
    let threads = [];
    if (response.data.success === false) {
        console.error(response.data.error);
        require('vscode').window.showErrorMessage('获取列表失败: '+`${response.data.error}`)
        return [];
    }
    response.data.forEach(threadRaw => {
        let thread = new xdmodels.Thread(
            threadRaw.id, //tid
            threadRaw.img === '' ? null : IMAGE_CDN + 'image/' + threadRaw.img + threadRaw.ext, //img
            threadRaw.img === '' ? null : IMAGE_CDN + 'thumb/' + threadRaw.img + threadRaw.ext, //thumb
            _parseThreadTime(threadRaw.now), //now
            threadRaw.user_hash, //userhash
            threadRaw.name, //name
            threadRaw.title, //title
            _stripHTML(threadRaw.content), //content
            threadRaw.admin !== 0, //admin
            false, //isPo
            null, //forum
            threadRaw.sage !== 0, //sage
            threadRaw.ReplyCount, //replyCount
            null);
        threads.push(thread);
    });
    return threads;
}

async function getThread(thread,page=1,poOnly=false){
    let tid = thread.tid;
    if (thread instanceof Number) {
        tid = thread;
    }
    let response = await session.get(JSON_API_ENDPOINT + `${poOnly?'po':'thread'}?id=${tid}&page=${page}`);
    if (thread instanceof Number) {
        const threadRaw = response.data;
        thread = new xdmodels.Thread(
            threadRaw.id, //tid
            threadRaw.img === '' ? null : IMAGE_CDN + 'image/' + threadRaw.img + threadRaw.ext, //img
            threadRaw.img === '' ? null : IMAGE_CDN + 'thumb/' + threadRaw.img + threadRaw.ext, //thumb
            _parseThreadTime(threadRaw.now), //now
            threadRaw.user_hash, //userhash
            threadRaw.name, //name
            threadRaw.title, //title
            _stripHTML(threadRaw.content), //content
            threadRaw.admin !== 0, //admin
            false, //isPo
            null, //forum
            threadRaw.sage !== 0, //sage
            threadRaw.ReplyCount, //replyCount
            null);
    }
    thread.replyCount = response.data.ReplyCount;
    let replies = [];
        if (response.data.Replies !==null && response.data.Replies !== undefined && response.data.Replies.length>0 && response.data.Replies[0]){
            response.data.Replies.forEach(replyRaw => {
                let reply = new xdmodels.Reply(
                    replyRaw.id, //tid
                    replyRaw.img === '' ? null : IMAGE_CDN + 'image/' + replyRaw.img + replyRaw.ext, //img
                    replyRaw.img === '' ? null : IMAGE_CDN + 'thumb/' + replyRaw.img + replyRaw.ext, //thumb
                    _parseThreadTime(replyRaw.now), //now
                    replyRaw.user_hash, //userhash
                    replyRaw.name, //name
                    replyRaw.title, //title
                    _stripHTML(replyRaw.content), //content
                    replyRaw.admin !== 0, //admin
                    replyRaw.user_hash===thread.userHash //isPo
                    );
                replies.push(reply);
            }
        );
    }
    thread.replies = replies;
    return thread;
}

module.exports = {
    getForumList,
    getTimelineList,
    getForum,
    getThread
};