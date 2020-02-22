/**
 * @description 网络错误处理类
 * @author yangping
 */

import Service from '../libs/Service';

/*
* flag 
* 1 为通用提示
* 2 为带按钮提示
* 3 不弹窗，传给下面处理
*/
export default class NetErrorHandle extends Service {

    tipsData: { [key: number]: { text: string; flag: number } } = null;

    // constructor() {
    //     super();
    // }

    loadConfig(callback) {
        cc.loader.loadRes('module-hall/json/net_error_text', cc.JsonAsset, (err, jsonasset) => {
            if (err) {
                cc.error(err);
                return;
            }
            cc.log('module-hall/json/net_error_text load.json success!');
            if (jsonasset.isValid && jsonasset.json) {
                jsonasset.json.forEach(data => {
                    let key = data.code;
                    let value = data.text;
                    let flag = data.flag;
                    if (!value || value.length === 0) {
                        cc.error(`NetErrorHandle code:${key} text is null or length is 0`);
                    }
                    if (!flag) {
                        cc.error(`NetErrorHandle code:${key} flag is null`);
                    }
                    if (!this.tipsData) {
                        this.tipsData = {};
                    }
                    this.tipsData[key] = { text: value, flag: flag };
                });
            }

            cc.loader.releaseRes('module-hall/json/net_error_text');

            if (callback) {
                callback();
            }
        });
    }

    getErrorDes(code: number) {
        let config = this.tipsData[code];
        if (config) {
            return config.text;
        }
        cc.error(`errorDes: ${code} not exsit!`);
    }

    handleError(code: number, cb: (result: boolean) => void) {
        if (!this.tipsData) {
            this.loadConfig(() => {
                NetErrorHandle.getInstance<NetErrorHandle>().handleError(code, cb);
            });
            return;
        }

        let config = this.tipsData[code];

        if (!config) {
            cc.warn(`错误码 ：${code}`);
            cb(false);
        }
        else if (config.flag === 1) {
            cc.warn(`${code} ${config.text}`);
            cb(true);
        }
        else if (config.flag === 2) {
            cc.warn(`${code} ${config.text}`);
            cb(true);
        }
        else if (config.flag === 3) {
            cc.warn(`${code} ${config.text}`);
            cb(false);
        }
        else {
            cb(false);
        }
    }
}