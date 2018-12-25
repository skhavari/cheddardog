# cheddardog

Download transactions from you financial institutions, save them in a json file

### Supports

-   Bank of America (CA)
-   American Express

### Download Transactions

-   Set BOFA_USER and BOFA_PW
-   Set AMEX_USER and AMEX_PW
-   `npm install`
-   `npm run build`
-   `npm start`

Tip: [Use 1password cli](https://support.1password.com/command-line/#appendix-session-management) or [set env vars without saving to history](https://www.google.com/search?rlz=1C5CHFA_enUS806US806&ei=LiMhXJXKIa7L0PEPnIyQiAM&q=run+command+without+saving+to+history+bash+zsh&oq=run+command+without+saving+to+history+bash+zsh&gs_l=psy-ab.3..35i39.4591.4949..5221...0.0..0.90.418.5......0....1..gws-wiz.......0i71j35i304i39.TG68M-kDrp4)

### Send Report

-   Set SENDGRID_API_KEY
-   Set SEND_TO and SEND_FROM
-   npm run send

To make this easy to run I have this in my `.zshrc` file

```
cheddardog() {
    eval $(op signin)
    export AMEX_USER='amex_username'
    export AMEX_PW=`op get item amex_account_name | jq -r .details.fields[3].value`
    export BOFA_USER='bofa_username'
    export BOFA_PW=`op get item bofa_account_name | jq -r .details.fields[2].value`
    export SENDGRID_API_KEY=`op get item sendgrid_account_name | jq -r .details.fields[0].value`
    export SEND_TO='recipient1@somewhere.com recipient2@somewhere.com'
    export SEND_FROM='sender@somewhere.com'
}
```

### Known issues

-   Only works on Mac OS (download dir is hardcoded, not tested on other platforms)

### Donate

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XUWGTGEM9TDPG&source=url)
