/*
* MsgFactory,消息工厂
*/
export default class MsgFactory {

    // 消息类型
    private static MSG_TYPES = {};

    /**
     * 注册消息class
     */
    public static registerMsgType(id: number, type: Function) {
        MsgFactory.MSG_TYPES[id] = type;
    }

    /**
     * 构造消息实例
     */
    public static new(id: number): any {
        return new MsgFactory.MSG_TYPES[id]();
    }
}