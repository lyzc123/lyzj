const { ccclass, property } = cc._decorator;

@ccclass
export default class MemMgr extends cc.Component {

    private static resMap = {};

    /**
     * 所有资源 都调用该方法加载 方便管理
     *
     * @static
     * @param {SceneTag} tag 游戏标签 枚举值
     * @param {string} path 资源路径
     * @param {type} type 加载的资源类型
     * @param {Function} callbackCpl 加载完成的回调函数
     * @memberof MemMgr
     */
    public static LoadRes(tag: SceneTag, path: string, type: typeof cc.Asset, callbackCpl: (err: Error, res: any) => any) {
        // cc.log('通过MemMgr加载的资源路径  ' + path)
        cc.loader.loadRes(path, type, (err, res) => {
            callbackCpl(err, res);
            this.PushResIntoMap(tag, path, res, type);
        })
    }

    //暂无用处
    public static PreloadScene ( sceneName: string, prograssCb: ( completedCount: Number, totalCount: Number, item: any ) => any, cplCb: ( err: Error ) => any ) {
        let tag = this.SceneNameToSceneTag( sceneName );
        cc.director.preloadScene( sceneName, ( cplCount: Number, totalCount: Number, item: any ) => {
            this.PushResIntoMap( tag, null, item, null );
            prograssCb( cplCount, totalCount, item );
        }, cplCb )
    }


    /**
     * 列出对应游戏 已加载的资源
     *
     * @static
     * @param {SceneTag} tag 需要打印的游戏
     * @memberof MemMgr
     */
    public static ListRes(tag: SceneTag) {
        for (let item of this.resMap[tag]) {
            cc.log(item.path, item.res);
        }
    }

    /**
     *释放 指定的 使用loadRes加载的 对应 游戏资源
     *
     * @static
     * @param {SceneTag} tag 需要释放的游戏
     * @memberof MemMgr
     */
    public static ReleaseLoadedRes(tag: SceneTag) {
        //每次都释放 公用资源
        let commonRes = this.resMap[SceneTag.Common]
        if (commonRes) {
            for (let item of commonRes) {
                let deps = cc.loader.getDependsRecursively(item.res)
                cc.loader.release(deps);
                item.res = null;
                item.type = null;
                item = null;
            }
            commonRes.length = 0;
        }

        //释放目标资源
        if (!this.resMap[tag]) return;

        for (let i = 0; i < this.resMap[tag].length; i++) {
            let item = this.resMap[tag][i];
            //这部分资源 引用了 大厅的资源 不能释放， 具体引用的哪些没有找到，需要深入查看。
            let donotRelease: string[] = new Array();
            donotRelease.push('module-fish/otherRes/fishDialogBundle');
            donotRelease.push('module-fish/otherRes/fishChangeCoinBg');
            donotRelease.push('module-fish/otherRes/fishSetBg');
            donotRelease.push('module-fish/otherRes/fishPict');
            donotRelease.push('module-fish/otherRes/SystemGift');
            let skipItem = false;
            for (let i of donotRelease) {
                if (i == item.path) {
                    skipItem = true;
                    continue;
                }
            }
            if (skipItem) continue;
            let deps = cc.loader.getDependsRecursively(item.res)
            cc.loader.release(deps);
            item.res = null;
            item.type = null;
            item = null;
        }
        this.resMap[tag].length = 0;
    }

    /**
     * 将需要释放的资源记录下来 方便随时释放
     *
     * @private
     * @static
     * @param {SceneTag} tag
     * @param {string} path
     * @param {*} res
     * @memberof MemMgr
     */
    private static PushResIntoMap(tag: SceneTag, path: string, res: any, type: typeof cc.Asset) {
        if (this.resMap[tag]) {
            this.resMap[tag].push({ path: path, res: res, type: type });
        }
        else {
            this.resMap[tag] = new Array();
            this.resMap[tag].push({ path: path, res: res, type: type });
        }
    }

    /**
     * 把场景字符串转换为 枚举值
     *
     * @static
     * @param {string} sceneName 场景字符串
     * @returns {Number}
     * @memberof MemMgr
     */
    public static SceneNameToSceneTag(sceneName: string): SceneTag {
        switch (sceneName) {
            case 'hall':
                return SceneTag.Hall;
            case 'game':
                return SceneTag.Game;
            case 'login':
                return SceneTag.Login;
            default:
                return SceneTag.null;
        }
    }
    // update (dt) {}
}


/**
 * 场景枚举,对应游戏中场景文件名字
 * common 是公用资源枚举
 * @export
 * @enum {number}
 */
export enum SceneTag {
    Hall = 'hall',
    Login = 'login',
    Game = 'game',
    Common = 'common',
    null = 'null',
}
