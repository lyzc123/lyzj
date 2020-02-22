class Singleton {
    protected static instance = null;
    public name: string = null;

    public static getInstance<T extends Singleton>(): T {
        if (!this.instance) {
            let ClassType: any = this;
            this.instance = new ClassType();
        }
        return this.instance;
    }

    public static Destory() {
        this.instance = null;
    }
}

export default class Service extends Singleton {
    public name: string = '';

    public onRegister() {
        cc.log('onRegister 请在子类实现');
    }

    public onRemove() {
        cc.log('onRemove 请在子类实现');
    }
}
