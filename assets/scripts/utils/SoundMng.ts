/**
 * @description 声音管理类
 * @author yangping
 */

import Service from '../libs/Service';

export default class SoundMng extends Service {

    musicOpen: boolean = true;
    soundOpen: boolean = true;

    audioCache: { [key: string]: cc.AudioClip } = {};
    audioDirFile: { [key: string]: string[] } = {};

    curBgUrl: string = '';

    isForGround: boolean = true;

    constructor() {
        super();
        let musicValue = cc.sys.localStorage.getItem('musicOpen');
        if (musicValue) {
            if (musicValue === 'false') {
                this.musicOpen = false;
            }
        }

        let soundValue = cc.sys.localStorage.getItem('soundOpen');
        if (soundValue) {
            if (soundValue === 'false') {
                this.soundOpen = false;
            }
        }
    }

    /*
    * 加载音乐资源
    * urlArr 音乐资源路径数组
    * cb 加载完成数量回调
    */
    loadAudioClip(urlArr: string[], cb?: (completeCnt) => void) {
        let loadCnt = 0;
        urlArr.forEach(element => {
            cc.loader.loadRes(element, cc.AudioClip, (error, resource) => {
                this.cacheAudioClip(element, error, resource);
                loadCnt++;
                if (cb) {
                    cb(loadCnt);
                }
            });
        });
    }

    /*
    * 释放音乐资源
    * urlArr 音乐资源路径数组
    */
    unLoadAudioClip(urlArr: string[]) {
        urlArr.forEach(element => {
            if (this.audioCache[element]) {
                this.audioCache[element] = null;

                cc.loader.releaseRes(element, cc.AudioClip);
            } else {
                cc.log(`unLoadAudio error : not find ${element} clip`);
            }
        });
    }

    /*
    * 通过文件夹加载音乐资源
    * dir 音乐资源文件夹
    * cb 加载完成回调
    */
    loadAudioClipDir(dir: string, cb?: () => void) {
        cc.loader.loadResDir(dir, cc.AudioClip, (error: Error, resource: any[], urls: string[]) => {
            resource.forEach((element, key) => {
                this.cacheAudioClip(urls[key], null, element);
            });
            this.audioDirFile[dir] = urls;
            if (cb) {
                cb();
            }

        });
    }

    /*
    * 通过文件夹释放音乐资源
    * dir 音乐资源文件夹
    */
    unLoadAudioClipDir(dir) {
        if (this.audioDirFile[dir]) {
            this.audioDirFile[dir].forEach((element) => {
                this.audioCache[element] = null;
            });
            this.audioDirFile[dir] = null;

            cc.loader.releaseResDir(dir, cc.AudioClip);
        }
    }


    /*
    * 播放背景音乐
    * musicUrl 音效文件路径
    * loop 是否循环 默认循环播放
    */
    playBackGroundMusic(musicUrl: string, loop: boolean = true) {

        if (this.curBgUrl !== musicUrl) {
            this.curBgUrl = musicUrl;
            if (this.audioCache[musicUrl]) {
                if (this.musicOpen) {
                    cc.audioEngine.playMusic(this.audioCache[musicUrl], loop);
                }

            } else {
                cc.log('playBackGroundMusic error : audio source not load, url=', musicUrl);

                cc.loader.loadRes(musicUrl, cc.AudioClip, (error, resource) => {
                    if (this.cacheAudioClip(musicUrl, error, resource)) {
                        if (this.musicOpen) {
                            cc.audioEngine.playMusic(this.audioCache[musicUrl], loop);
                        }
                    }
                });
            }
        }
    }

    /*
    * 暂停背景音乐
    */
    pauseBackGroundMusic() {
        cc.audioEngine.pauseMusic();
    }

    resumeBackGroundMusic() {
        if (this.curBgUrl.length > 0) {
            if (this.musicOpen) {
                if (this.audioCache[this.curBgUrl]) {
                    cc.audioEngine.playMusic(this.audioCache[this.curBgUrl], true);
                }
            }
        }
    }

    /*
    * 播放音效
    * soundUrl 音效文件路径
    */
    playSoundEffect(soundUrl: string) {
        if (this.soundOpen && this.isForGround) {
            if (this.audioCache[soundUrl]) {
                cc.audioEngine.playEffect(this.audioCache[soundUrl], false);
            } else {
                cc.error('playSoundEffect error : audio source not load url=', soundUrl);
            }
        }
    }

    playSoundEffectList(soundUrl: string[], audioIndex: number = 0) {

        if (this.soundOpen && this.isForGround) {
            if (this.audioCache[soundUrl[audioIndex]]) {
               let audioId = cc.audioEngine.playEffect(this.audioCache[soundUrl[audioIndex]], false);
               cc.audioEngine.setFinishCallback(audioId,()=>{  
                    audioIndex++;   
                    if (audioIndex < soundUrl.length) {
                        this.playSoundEffectList(soundUrl, audioIndex);
                    }
               });
            } else {
                cc.error('playSoundEffect error : audio source not load url=', soundUrl);
            }
        }
    }


    /*
    * 点击音乐开关
    */
    onToggleMusic() {
        this.musicOpen = !this.musicOpen;
        if (!this.musicOpen) {
            this.pauseBackGroundMusic();
        } else {
            this.resumeBackGroundMusic();
        }
        cc.sys.localStorage.setItem('musicOpen', this.musicOpen.toString());
    }

    /*
    * 点击音效开关
    */
    onToggleSound() {
        this.soundOpen = !this.soundOpen;
        cc.sys.localStorage.setItem('soundOpen', this.soundOpen.toString());
    }

    /*
    * 点击音乐是否打开
    */
    getMusicOpen() {
        return this.musicOpen;
    }

    /*
    * 点击音效是否打开
    */
    getSoundOpen() {
        return this.soundOpen;
    }

    //切换到后台
    enterBackGround() {
        cc.audioEngine.pauseAllEffects();
        if (this.musicOpen) {
            cc.audioEngine.pauseMusic();
        }
        this.isForGround = false;
    }

    //切换到前台
    enterForGround() {
        cc.audioEngine.resumeAllEffects();
        if (this.musicOpen) {
            cc.audioEngine.resumeMusic();
        } else {
            cc.audioEngine.pauseMusic();
        }
        this.isForGround = true;
    }

    private cacheAudioClip(url, error, resource) {
        if (error) {
            cc.error(`loadAudio error : ${error}`);
            return false;
        } else {
            if (!this.audioCache[url]) {
                this.audioCache[url] = resource;
            } else {
                cc.log(`loadAudio error : ${url} already load`);
            }

            return true;
        }
    }
}