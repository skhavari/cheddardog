import { logTitle, logStart, logDone, logLine } from './logger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    for (var i = 0; i < 100; i++) {
        logStart(`${i} - STARTING`);
        await sleep(100);
        logDone(`${i} - ENDING`);
        await sleep(100);
    }
})();
