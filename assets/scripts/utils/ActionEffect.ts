/**
 * @description 面板打开 关闭 缩放动画 控制管理
 * @author yangping
 */

export default class ActionEffect {

    /*
    * 面板打开动画 缓动缩放
    * node 运行动画的节点
    */
    public static panelOpenAction(node: cc.Node) {
        node.scale = 0.01;
        let ac = cc.scaleTo(0.4, 1.0);
        let ac1 = ac.easing(cc.easeBackOut());
        node.runAction(ac1);
    }

    /*
    * 面板关闭动画 缓动缩放
    * node 运行动画的节点
    * cb 动画播放完成的回调
    */
    public static panelCloseAction(node: cc.Node, cb?: Function, target?) {
        node.scale = 1.0;
        let ac = cc.scaleTo(0.3, 0.0);
        let ac1 = ac.easing(cc.easeBackIn());
        let ac2 = cc.sequence(ac1, cc.callFunc(() => {
            if (cb) {
                if (target) {
                    cb.apply(target);
                } else {
                    cb();
                }

            }
        }));
        node.runAction(ac2);
    }
}