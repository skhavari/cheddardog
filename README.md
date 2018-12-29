# cheddardog

> a poor mans Mint, Personal Capital or other, in the making

-   Download transactions from your financial institutions
-   Save them in a json file
-   Generate an html spending summary report
-   Email the spending summary
-   Why?
    -   Financial insights without spraying your data to third parties.
    -   Enable 2 Factor auth on your financial accounts and they still work
    -   Local db of balances & transactions to whatever you want

![sample report](https://user-images.githubusercontent.com/4343866/50465377-cb542f80-094b-11e9-9821-20239ad9cc56.png)

### Supports

-   Bank of America (CA)
-   American Express
-   Charles Schwab
-   Vanguard
-   2 Factor Auth: works, but you'll have to babysit the run and enter the 2nd factor manually

### Download Ledger from Financial Institutions

> credemtials come from env vars, config is in `config.json`

-   update `config.json` with which accounts you want refreshed.
-   Set `BOFA_USER` and `BOFA_PW` env variable and/or
-   Set `AMEX_USER` and `AMEX_PW` env variable and/or
-   Set `SCHWAB_USER` and `SCHWAB_PW` env variable and/or
-   Set `VANGUARD_USER` and `VANGUARD_PW` env variable
-   `npm install`
-   `npm run build`
-   `npm run refresh` to generate `./out/txndb.json`

Tip: [Use 1password cli](https://support.1password.com/command-line/#appendix-session-management) or [set env vars without saving to history](https://www.google.com/search?rlz=1C5CHFA_enUS806US806&ei=LiMhXJXKIa7L0PEPnIyQiAM&q=run+command+without+saving+to+history+bash+zsh&oq=run+command+without+saving+to+history+bash+zsh&gs_l=psy-ab.3..35i39.4591.4949..5221...0.0..0.90.418.5......0....1..gws-wiz.......0i71j35i304i39.TG68M-kDrp4)

To simplify repetitive execution, consider something like this in a `.zshrc` file

```
cheddardog() {
    eval $(op signin)

    echo 'Configuring AMEX...'
    TEMP=`op get item amex | jq -r "(.details.fields[1].value, .details.fields[2].value)"`
    export AMEX_USER=`echo $TEMP | head -1`
    export AMEX_PW=`echo $TEMP | tail -1`

    // .... more accounts credentials

    export SENDGRID_API_KEY=`op get item sendgrid_account_name | jq -r .details.fields[0].value`
}
```

### Send Report

-   Set `SENDGRID_API_KEY` env variable
-   update `config.json` with the email sender (`from`) and receipients (`to`)
-   `npm run send` to generate `./out/index.html` and have it emailed to SEND_TO

### Known issues

-   Only works on Mac OS (download dir is hardcoded, not tested on other platforms)

### Basic design

![design](https://user-images.githubusercontent.com/4343866/50530005-6e24bf00-0aae-11e9-88de-43332dd7da21.png)

### Donate

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XUWGTGEM9TDPG&source=url)
