

const { ccclass, property } = cc._decorator;

@ccclass
export default class Counter extends cc.Component {


    /**
     * 延迟执行函数 执行 1次 完毕后自动销毁
     *
     * @static
     * @param {() => any} delayCallback  延迟后执行的回调函数
     * @param {number} delay  延迟多久执行 毫秒单位
     * @param {*} target  需要执行的函数的实例 (默认 调用方 传入this)      
     * @memberof Counter
     */
    public static DelayExcuteOnce(delayCallback: () => any, delay: number, target: any) {
        let cb = () => {
            delayCallback()
            cc.director.getScheduler().unschedule(cb, target);
            cc.log('counter-------------------延迟执行')
        }

        cc.director.getScheduler().schedule(cb, target, 0.01, 0, delay / 1000)
    }
}
