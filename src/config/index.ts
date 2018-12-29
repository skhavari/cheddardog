import fs from 'fs';

const configFilename = 'config.json';

class SendConfig {
    constructor(public from: string, public to: string[] | string) {}
}

class RefreshConfig {
    constructor(public accounts: string[]) {}
}

class Config {
    constructor(public refresh: RefreshConfig, public send: SendConfig) {}
}

let configJson = fs.readFileSync(configFilename).toString();
let configObj = JSON.parse(configJson);

export default new Config(
    configObj.refresh as RefreshConfig,
    configObj.send as SendConfig
);
