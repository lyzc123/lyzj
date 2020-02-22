import EventDispatcher from '../../services/EventDispatcher';
import NetDispatcher from '../../services/NetDispatcher';
import Byte from './Byte';
import MsgFactory from './MsgFactory';

/** 网络消息编码类型 */
enum MsgType {
    none = 0,       //无
    custom = 1,     //自定义编码格式，龙哥那套工具
    protobuf = 2    //protobuf编码格式
}

/**
 * TcpClient，WebSocket 客户端封装,单例
 */
export default class TcpClient {
    static instance = new TcpClient();

    /** 最后一次发送数据的时间戳 */
    public static LastSendTime: number = 0;

    errorCb: Function;
    openCb: Function;

    isServerKick: boolean = false;//是否是服务器踢下线


    private ws: WebSocket;  // TcpClient实例
    private sendCount: number;  // 发送消息数量

    private isOpen: boolean = false;

    public static getInstance(): TcpClient {
        return TcpClient.instance;
    }

    public connect(host, ocb?, ecb?): void {
        let url = `${host}/`;
        if (host.indexOf('ws://') == -1 && host.indexOf('wss://') === -1) {
            url = `ws://${url}`;
            cc.error('redirect:', url);
        }

        cc.log('开始连接服务器：', url);

        if (this.ws != null) {
            if (this.ws.readyState === WebSocket.CONNECTING) {
                cc.warn('服务器正在连接,请等待...');
                return;
            } else if (this.ws.readyState === WebSocket.OPEN) {
                if (this.ws.url === url) {
                    cc.warn('服务器已经连接,请勿重复连接');
                    ocb();
                    return;
                }
                else {
                    cc.warn('服务器链接地址变更', this.ws.url, url);
                    this.close();
                }
            }
        }

        try {
            this.ws = new WebSocket(url);
            this.ws.binaryType = 'arraybuffer';

            this.sendCount = 0;

            this.ws.onopen = this.onSocketOpen.bind(this);
            this.ws.onclose = this.onSocketClose.bind(this);
            this.ws.onmessage = this.onMessageReveived.bind(this);
            this.ws.onerror = this.onSocketError.bind(this);

            this.openCb = ocb;
            this.errorCb = ecb;

            // cc.log(url, this.ws.readyState);
        } catch (e) {
            ecb();
        }
    }

    isNetConnecting() {
        if (this.ws != null) {
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                return true;
            }
        }
        return false;
    }

    close() {
        if (!this.ws) {
            return;
        }
        if (this.ws != null) {
            this.isOpen = false;
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * 发送消息，二进制协议
     * 请求协议：校验码 + 消息类型id ＋ 消息内容
     */
    public send(msg: Message): void {
        if (!this.ws || this.ws.readyState === WebSocket.CONNECTING) {
            cc.warn('网络正在连接，不能发送消息:', msg);
            return;
        }
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            cc.warn('网络连接关闭，不能发送消息:', msg);
            if (!this.isServerKick) {
                EventDispatcher.emit(EventDispatcher.ON_SOCKET_SEND_FAIL);
            } else {
                this.onServerKick();
            }
            return;
        }

        let byte: Byte = new Byte(null);
        byte.endian = Byte.BIG_ENDIAN;
        let token = (~this.sendCount & (1 << 9)) | (this.sendCount & ~(1 << 9));
        byte.writeByte(MsgType.custom);   //消息编码类型
        byte.writeInt32(token);             // 写入校验码
        byte.writeInt32(msg.getMsgType());  // 写入消息类型id
        msg.writeBytes(byte);
        this.ws.send(byte.buffer);
        TcpClient.LastSendTime = new Date().getTime();

        this.sendCount++;
        if (CC_DEBUG) {
            //心跳包不打印
            if (msg.getMsgType() !== 1) {
                //TODO 屏蔽消息日志
                cc.log(new Date().toLocaleTimeString(), msg.getMsgType(), '发送消息:', msg);
            }
        }
    }

    public sendpb(msg): void {
        if (!this.ws || this.ws.readyState === WebSocket.CONNECTING) {
            cc.warn('网络正在连接，不能发送消息:', msg);
            return;
        }
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            cc.warn('网络连接关闭，不能发送消息:', msg);
            if (!this.isServerKick) {
                EventDispatcher.emit(EventDispatcher.ON_SOCKET_SEND_FAIL);
            } else {
                this.onServerKick();
            }
            return;
        }

        let msgid: number = msg.getMsgType();
        let data: Uint8Array = this.getPotobufType(msgid).encode(msg).finish();

        let byte: Byte = new Byte(null);
        byte.endian = Byte.BIG_ENDIAN;
        let token = (~this.sendCount & (1 << 9)) | (this.sendCount & ~(1 << 9));
        byte.writeByte(MsgType.protobuf);   // 消息编码类型
        byte.writeInt32(token);             // 写入校验码
        byte.writeInt32(msgid);             // 写入消息类型id
        byte.writeArrayBuffer(data, 0, data.length);
        this.ws.send(byte.buffer);
        TcpClient.LastSendTime = new Date().getTime();

        if (CC_DEBUG) {
            //心跳包不打印
            if (msg.getMsgType() !== 1) {
                //TODO 屏蔽 消息日志
                cc.log(new Date().toLocaleTimeString(), msg.getMsgType(), '发送PB:', msg);
            }
        }

        this.sendCount++;
    }

    private onSocketOpen(): void {
        // cc.log('连接服务器[%s]成功', this.ws);

        if (this.openCb) {
            this.openCb();
        }

        this.isServerKick = false;
        this.isOpen = true;
        EventDispatcher.emit(EventDispatcher.ON_SOCKET_OPEN);
    }

    private onSocketClose(ws: CloseEvent, ev: CloseEvent): void {

        if (this.isServerKick) {
            this.onServerKick();
            return;
        }

        if (this.ws && this.ws !== ws.target) {
            return;
        }
        // cc.log('网络连接关闭');

        if (this.isOpen) {
            //服务端踢下线
            this.isOpen = false;
            this.ws = null;
            //网络错误断开
            if (this.errorCb) {
                this.errorCb();
            }
            cc.log('网络错误');
        }
        EventDispatcher.emit(EventDispatcher.ON_SOCKET_CLOSE);
    }

    /**
     * 收到消息，二进制协议
     * 响应协议：消息类型id ＋ 消息内容
     */
    private onMessageReveived(msgEvent: any): void {
        let inByte = new Byte(msgEvent.data);
        inByte.endian = Byte.BIG_ENDIAN;
        let msgType = inByte.getByte();
        let msgId = inByte.getInt32();
        //cc.log('onMessageReveived msg id = ', msgId, inByte.length); 
        try {
            if (msgType === MsgType.custom) {
                let msg: Message = MsgFactory.new(msgId);
                msg.readBytes(inByte);
                if (CC_DEBUG) {
                    //心跳包不打印
                    if (msg.getMsgType() !== 2) {
                        //TODO 屏蔽消息日志
                        cc.log(new Date().toLocaleTimeString(), msgId, '接受消息:', msg);
                    }
                }
                NetDispatcher.post(msg);
            }
            else if (msgType === MsgType.protobuf) {
                let buffer = inByte.getUint8Array(5, inByte.length);
                let msg = this.getPotobufType(msgId).decode(buffer);
                if (CC_DEBUG) {
                    if (msg.getMsgType() !== 2) {
                        //TODO 屏蔽消息日志
                        cc.log(new Date().toLocaleTimeString(), msgId, '接受PB:', msg);
                    }
                }
                NetDispatcher.post(msg);
            }
            else {
                cc.error('消息协议的类型还未实现！！！');
            }
        }
        catch (error) {
            cc.error(`msg id=${msgId} length=${inByte.length} error=${error} data=${inByte.buffer}`);
        }
    }

    private onSocketError(ws: WebSocket, ev: Event): void {
        if (!this.isServerKick) {
            this.close();
            if (this.errorCb) {
                this.errorCb();
            }
            cc.log('网络连接发生错误');
        } else {
            this.onServerKick();
        }
    }

    private onServerKick() {
        //NetDispatcher.logout();
        cc.log('服务端踢下线');
        if (this.ws) {
            this.close();
        } else {
            this.isOpen = false;
            this.ws = null;
        }
        this.isServerKick = false;
        EventDispatcher.emit(EventDispatcher.ON_SOCKET_CLOSE);
    }

    /**
     * 通过msgid获取逻辑处理类
     * @param msgid 
     */
    private getPotobufType(msgid: number) {
        let w: any = window;
        if (!w.MessageMap) {
            cc.error('window MessageMap is null');
            return;
        }

        let c = w.MessageMap[msgid];
        if (!c) {
            cc.error('class is null, msgid=', msgid);
            return;
        }

        return c;
    }
}
