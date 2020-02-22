import TcpClient from '../network/net/TcpClient';
import Application from '../game/Application';
// import PlayerService from '../services/PlayerService';
import EventDispatcher from '../services/EventDispatcher';
import NetErrorHandle from '../../scripts/utils/NetErrorHandle';

export default class NetDispatcher {

    public static ERROR_CODE = {
        connect_sucess: 0,
        connect_faild: -1,
        disconnect: -2,
        reconnect: -3,
    };

    static eventTarget: cc.EventTarget = new cc.EventTarget();

    static connectCb;


    static onNetOpen() {
        if (NetDispatcher.connectCb) { //登录时成功
            NetDispatcher.connectCb(NetDispatcher.ERROR_CODE.connect_sucess);
            NetDispatcher.connectCb = null;
        }
    }

    static onNetError() {
        if (NetDispatcher.connectCb) { //登录时失败
            NetDispatcher.connectCb(NetDispatcher.ERROR_CODE.connect_faild);
            NetDispatcher.connectCb = null;
            EventDispatcher.emitError(NetDispatcher.ERROR_CODE.connect_faild);
        } else { //断线
            EventDispatcher.emitError(NetDispatcher.ERROR_CODE.disconnect);
        }
    }

    static connect(callback?) {
        NetDispatcher.connectCb = callback;
        TcpClient.getInstance().connect(Application.GateAddr, NetDispatcher.onNetOpen, NetDispatcher.onNetError);
    }

    /**
     * 发送数据
     * @param msg 
     */
    static send(msg) {
        if (msg.isProtoBuf) {
            TcpClient.getInstance().sendpb(msg);
        }
        else {
            TcpClient.getInstance().send(msg);
        }
    }

    /**
     * 
     * @param msg 要发送的数据(msg必须是自定义的消息结构体，或PB生成的结构体)
     * @param listenMsgType 消息回复的类型
     * @param callback 收到消息时的回调函数
     * @param target 
     */
    static request<T>(msg, listenMsgType: { prototype: T }, callback: (data: T) => void, target);
    /**
     * 
     * @param msg 要发送的数据
     * @param listenMsgType 消息回复的类型
     * @param callback 收到消息时的回调函数
     * @param errorcallback 消息带有错误码时的回调函数，需要对应的错误处理逻辑
     * @param target 
     */
    //eslint-disable-next-line
    static request<T>(msg, listenMsgType: { prototype: T }, callback: (data: T) => void, errorcallback: (data: T) => void, target);
    /**
     * 
     * @param msg 要发送的数据
     * @param listenMsgType 消息回复的类型
     * @param callback 收到消息时的回调函数
     * @param errorcallback 消息带有错误码时的回调函数，需要对应的错误处理逻辑
     * @param iswait 是否在发送消息后显示 转圈等待提示界面，收到回复/超时关闭
     * @param target 
     */
    //eslint-disable-next-line
    static request<T>(msg, listenMsgType: { prototype: T }, callback: (data: T) => void, errorcallback: (data: T) => void, iswait: boolean, target);
    //eslint-disable-next-line
    static request(arg1, arg2, arg3, arg4, arg5?, arg6?) {
        let msg = arg1;
        let listenMsgType = arg2;
        let callback = arg3;
        let errorcallback = null;
        let iswait = true;
        let target = null;

        if (arguments.length === 4) {
            target = arg4;
        }

        if (arguments.length === 5) {
            errorcallback = arg4;
            target = arg5;
        }

        if (arguments.length === 6) {
            errorcallback = arg4;
            iswait = arg5;
            target = arg6;
        }

        this.send(msg);

        if (iswait) {
            EventDispatcher.emit(EventDispatcher.EVENT_NET_BUSY_STAR);
        }

        let time = new Date().getTime();
        NetDispatcher.once(listenMsgType,
            function (msg_data) {
                let elapsed = new Date().getTime() - time;
                if (elapsed > 200) {
                    cc.warn(`发送[msgid=${msg.getMsgType()}],服务器响应时间：${elapsed}ms`);
                }

                if (iswait) {
                    EventDispatcher.emit(EventDispatcher.EVENT_NET_BUSY_CLOSE);
                }

                if (msg_data.code) {
                    if (errorcallback) {
                        errorcallback.apply(target, arguments);
                    }
                    return;
                }

                if (callback) {
                    callback.apply(target, arguments);
                }
            }, target);
    }

    //主动断开
    static close() {
        TcpClient.getInstance().close();
        NetDispatcher.logout();
    }

    //客户端登出
    static logout() {
        cc.director.loadScene('Login');
    }

    static heartDisconnect() {
        TcpClient.getInstance().close();
        NetDispatcher.onNetError();
    }

    static onmessage<T>(msg: { prototype: T }, cb: (data: T) => void, target) {
        let msgType = msg.prototype['getMsgType']();
        return this.eventTarget.on(msgType.toString(), cb, target);
    }

    static offmessage<T>(msg: { prototype: T }, cb: (data: T) => void, target) {
        let msgType = msg.prototype['getMsgType']();
        this.eventTarget.off(msgType.toString(), cb, target);
    }

    /**
     * 监听消息一次
     * @param msg 
     * @param cb 
     * @param target 
     */
    static once<T>(msg: { prototype: T }, cb, target) {
        let msgType = msg.prototype['getMsgType']();
        //once注册使用
        this.eventTarget.once(`once_${msgType}`, cb, target);
    }

    static targetOff(target) {
        this.eventTarget.targetOff(target);
    }

    static post(msg) {
        this.emit(msg);
    }

    private static emit(msg) {
        let msgid = msg.getMsgType();

        if (msg.code) {
            

            //底层处理了错误码，也会触发错误码事件
            NetErrorHandle.getInstance<NetErrorHandle>().handleError(msg.code, (result: boolean) => {
                if (result) {
                    EventDispatcher.emitError(msg.code);
                    return; //底层错误码处理完成
                }
                else {
                    //配置flag=3时或hanleError return false，必须有外部处理逻辑
                    let key = `error_${msg.code}`;
                    if (EventDispatcher.hasEventListener(key)) {
                        EventDispatcher.emitError(msg.code);
                    }
                    else {
                        cc.error(`错误码：${msg.code} 无处理逻辑！！！`);
                    }
                }
            });
        } else {
            //正常消息回调
            this.eventTarget.emit(msgid.toString(), msg);
        }

        //once注册，都需要回调
        this.eventTarget.emit(`once_${msgid}`, msg);
    }
}