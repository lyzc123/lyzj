/*
* 网络消息接口;
*/
interface Message extends Dto {
    getMsgType(): number;  // 消息id
    getMsgDesc(): string;  // 描述
}