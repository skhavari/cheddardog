import ora from 'ora';

class SpinningLogger {
    private spinner: ora.Ora;
    constructor(msg: string) {
        this.spinner = ora(msg).start();
    }

    fail(msg: string) {
        this.spinner.fail(msg);
    }

    succeed(msg: string) {
        this.spinner.succeed(msg);
    }
}

export default class Log {
    private static spinner: SpinningLogger;
    static log(msg: string) {
        console.log(msg);
    }

    static line(msg: string, replace: boolean = false) {
        Log.log(msg);
    }

    static title(title: string) {
        Log.line(`${title}:`);
    }

    static start(msg: string) {
        this.spinner = new SpinningLogger(msg);
    }
    static fail(msg: string) {
        this.spinner.fail(msg);
    }

    static succeed(msg: string) {
        this.spinner.succeed(msg);
    }
}
