/*
* EventDispatcher, 本地事件分发器
*/
export default class EventDispatcher {

    private static eventTarget: cc.EventTarget = new cc.EventTarget();

    //tcp
    public static ON_SOCKET_OPEN = 'ON_SOCKET_OPEN';//网络连接建立
    public static ON_SOCKET_CLOSE = 'ON_SOCKET_CLOSE';//网络连接断开
    public static ON_SOCKET_SEND_FAIL = 'ON_SOCKET_SEND_FAIL';//网络发送数据失败（原因网络已断开）

    public static EVENT_NET_BUSY_STAR = 'EVENT_NET_BUSY_STAR';//网络正忙显示
    public static EVENT_NET_BUSY_CLOSE = 'EVENT_NET_BUSY_CLOSE';//网络正忙关闭
    /**
     * 监听消息
     * @param msg 
     * @param cb 
     * @param target 
     */
    static on(msg: string, cb, target) {
        if (!msg) {
            cc.error('msg is null');
            return;
        }
        this.eventTarget.on(msg, cb, target);
    }

    /**
     * 监听错误码
     * @param code 错误码 
     * @param cb 
     * @param target 
     */
    static onError(code: number, cb: (code: number) => void, target) {
        return this.eventTarget.on(`error_${code}`, cb, target);
    }

    static offError(code: number, cb: (code: number) => void, target) {
        return this.eventTarget.off(`error_${code}`, cb, target);
    }

    /**
     * 触发错误码
     * @param code 
     */
    static emitError(code: number) {
        this.eventTarget.emit(`error_${code}`, code);
    }

    /**
     * 监听消息一次
     * @param msg 
     * @param cb 
     * @param target 
     */
    static once(msg: string, cb, target) {
        if (!msg) {
            cc.error('msg is null');
            return;
        }
        this.eventTarget.once(msg, cb, target);
    }

    static emit(...args) {
        this.eventTarget.emit.apply(this.eventTarget, args);
    }

    static off(msg, cb, target) {
        this.eventTarget.off(msg, cb, target);
    }

    static targetOff(target) {
        this.eventTarget.targetOff(target);
    }

    static hasEventListener(type: string): boolean {
        return this.eventTarget.hasEventListener(type);
    }
}