const { ccclass } = cc._decorator;

@ccclass
export default class UserMgr {
    static instance: UserMgr = new UserMgr();
    token: string = '';
}
