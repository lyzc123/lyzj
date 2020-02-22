import MemMgr, { SceneTag } from "./MemMgr";


const { ccclass, property } = cc._decorator;

/**
 * 该类 挂载在 游戏场景的根节点上 用于侦听destroy销毁资源
 *
 * @export
 * @class MemMgr_Release
 * @extends {cc.Component}
 */
@ccclass
export default class MemMgr_Release extends cc.Component {

    @property
    gameTag: SceneTag = SceneTag.null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    onDestroy() {
        cc.log('释放游戏   ' + this.gameTag + "---------------------");
        MemMgr.ReleaseLoadedRes(this.gameTag);
    }
    // update (dt) {}
}
