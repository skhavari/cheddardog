import pos from 'get-cursor-position';
import readline from 'readline';

const getCursorPos = () => pos.sync();
const hideCursor = () => process.stdout.write('\u001b[?25l');
const showCursor = () => process.stdout.write('\u001b[?25h');

hideCursor();
process.on('beforeExit', showCursor);
process.on('SIGINT', showCursor);

const isNewLine = (x: string) => x === '\n';
const numLines = (str: string): number =>
    str.split('').filter(isNewLine).length;

export default class Log {
    static lastNumLines = 0;
    static log(msg: string) {
        Log.lastNumLines = numLines(msg);
        process.stdout.write(`${msg}`);
    }

    static line(msg: string, replace: boolean = false) {
        if (replace === true) {
            let row = getCursorPos().row;
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
        Log.line(`     ⏳ ${msg}`);
    }

    static done(msg: string) {
        Log.line(`      ✔ ${msg}`, true);
    }
}
