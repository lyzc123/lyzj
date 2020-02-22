
/*
* 游戏配置信息;
*/
export default class Application {
    // host地址不由服务器下发的原因：
    // 1、并不是每次登陆都会请求web服务器  

    private static isdebug = false;
    //TODO 服务器地址
    private static _login_addr: string = 'http://';     //登录服务器地址
    private static _gate_addr: string = 'ws://';           //网关服务器地址
    /** 服务器地址 */
    public static get GateAddr(): string {
        if (Application.isdebug) {
            let debug_addr = cc.sys.localStorage.getItem('_gate_addr');
            if (debug_addr) {
                Application._gate_addr = debug_addr;
            }
        }
        return Application._gate_addr;
    }

    public static set GateAddr(addr: string) {
        if (Application.isdebug) {
            cc.sys.localStorage.setItem('_gate_addr', addr);
            Application._gate_addr = addr;
        }
        else {
            cc.error('不能动态设置链接的服务器地址');
        }
    }

    public static get LoginAddr(): string {
        if (Application.isdebug) {
            let debug_addr = cc.sys.localStorage.getItem('login_addr');
            if (debug_addr) {
                Application._login_addr = debug_addr;
            }
        }
        return `${Application._login_addr}`;
    }

    public static set LoginAddr(addr: string) {
        if (Application.isdebug) {
            cc.sys.localStorage.setItem('login_addr', addr);
            Application._login_addr = addr;
        }
        else {
            cc.error('不能动态设置链接的服务器地址');
        }
    }
}