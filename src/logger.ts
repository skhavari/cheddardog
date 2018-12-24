import pos from 'get-cursor-position';
import readline from 'readline';

const numLines = (str: string): number => {
    let count = 0;
    for (var i = 0; i < str.length; i++) {
        count = str.charAt(i) === '\n' ? count + 1 : count;
    }
    return count;
};

const getCursorPos = () => {
    return pos.sync();
};

const hideCursor = () => process.stdout.write('\u001b[?25l');
const showCursor = () => process.stdout.write('\u001b[?25h');

hideCursor();
process.on('beforeExit', showCursor);
process.on('SIGINT', showCursor);

let lastNumLines = 0;

export const log = (msg: string) => {
    lastNumLines = numLines(msg);
    process.stdout.write(`${msg}`);
};

export const logLine = (msg: string, replace: boolean = false) => {
    if (replace === true) {
        let row = getCursorPos().row;
        for (var i = 0; i <= lastNumLines + 1; i++) {
            readline.cursorTo(process.stdout, 0, row - i);
            readline.clearLine(process.stdout, 0);
        }
    }
    return log(`${msg}\n`);
};

export const logTitle = (title: string) => {
    logLine(`  ${title}:`);
};

export const logStart = (msg: string) => {
    logLine(`     ⏳ ${msg}`);
};

export const logDone = (msg: string) => {
    logLine(`      ✔ ${msg}`, true);
};
