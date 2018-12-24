import log from './logger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    for (var i = 0; i < 100; i++) {
        log.start(`${i} - STARTING`);
        await sleep(100);
        log.done(`${i} - ENDING`);
        await sleep(100);
    }
})();
