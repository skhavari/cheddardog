import pos from 'get-cursor-position';
import readline from 'readline';

if (process.stdout.isTTY) {
    // hide cursor
    process.stdout.write('\u001b[?25l');
    // show cursor
    process.on('beforeExit', () => process.stdout.write('\u001b[?25h'));
    process.on('SIGINT', () => process.stdout.write('\u001b[?25h'));
}

const isNewLine = (x: string) => x === '\n';
const numLines = (str: string): number =>
    str.split('').filter(isNewLine).length;

export default class Log {
    static lastNumLines = 0;
    static log(msg: string) {
        if (process.stdout.isTTY) {
            Log.lastNumLines = numLines(msg);
        }
        process.stdout.write(`${msg}`);
    }

    static line(msg: string, replace: boolean = false) {
        if (replace === true && process.stdout.isTTY) {
            let row = pos.sync().row;
            for (var i = 0; i <= Log.lastNumLines + 1; i++) {
                readline.cursorTo(process.stdout, 0, row - i);
                readline.clearLine(process.stdout, 0);
            }
        }
        Log.log(`${msg}\n`);
    }

    static title(title: string) {
        Log.line(`  ${title}:`);
    }

    static start(msg: string) {
        Log.line(`      ⏳ ${msg}`);
    }

    static done(msg: string) {
        Log.line(`      ✔ ${msg}`, true);
    }
}
