global.config = require("./config.json");

var colors = require("colors");
var helper = require("./helper.js");
var isOnline = require('is-online');

var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');


	// Check if localStorage 'initialized' is a falsy value
if (!!localStorage.getItem("initialized") == false) {
	console.log("Could not find localStorage; generated with default values.");
	localStorage.setItem("initialized",true);
	localStorage.setItem("dailyReports",false);
	localStorage.setItem("dailyReportsRunTime",7);
	localStorage.setItem("dailyReportsLastRun",0);
}

var AuthDetails = require("./auth.json");
if (!!AuthDetails.token == false) {
	console.log("Could not find authentication token, check auth.json and run again.");
	process.exit();
}
//localStorage.setItem("AuthDetails.token", AuthDetails.token);

global.dataArray = {"lastUpdate":0,"error":false}
helper.updateValues();

setInterval(function(){helper.checkTime()},30000);

// Until I rewrite bot.js to support async calls, we'll just update these values every five minutes
setInterval(function(){helper.updateValues()},300000);

// Past here is bot specific stuff.

try {
	var Discord = require("Discord.js");
	global.bot = new Discord.Client();
} catch (e) {
	console.log("Please follow the instructions in README.md and ensure it completes with no errors!");
	process.exit();
}

bot.on('ready', () => {
	bot.user.setGame("Use !help");
	// Todo: fix the serving n channels because I broke it.
	console.log(colors.green("Ready to begin!")); //" Serving in " + bot.channels.length + " Channels | " + bot.guilds.length + " Servers"));
});

bot.on('reconnecting', () => {
	console.log(colors.red.underline.bgWhite("Error: Lost Connection with Discord! Reconnecting..."));
});

bot.on('message', msg => {
	if (msg.guild == null) {
		msg.author.send("This bot isn't configured to allow commands via direct message.");
		return;
	}

	if (msg.isMentioned(bot.user) || msg.channel.type === "dm") {
		var tome = true;
	} else {
		var tome = false;
	}
	if (msg.author.id != bot.user.id && (msg.content[0] === '!' || tome === true)) {
		console.log("Received Message from " + msg.author.username + ": " + msg.content);
		var fullmess = msg.content;

		var mess = msg.content.substring(1,8);
		if (mess.indexOf("reports") > -1) {
			var dailyReportsEnabled = localStorage.getItem("dailyReports");
			localStorage.setItem("dailyReports",!dailyReportsEnabled);

			if (dailyReportsEnabled) {
				console.log("Reports Disabled");
				var resp = {embed: {
					color: 3447003,
					title: "Daily Reports:",
					description: "These are the reports that are posted at " + localStorage.getItem("dailyReportsRunTime") + ":00 (Bot time)",
					fields: [{
							"name": "Status",
							"value": ":x: Daily reports have been turned off"
						}
					],
					timestamp: new Date(),
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Daily Reports"
					}
				}};
				msg.channel.send(resp);
					return;
			} else {
				console.log("Reports Enabled");
				var resp = {embed: {
					color: 3447003,
					title: "Daily Reports:",
					description: "These are the reports that are posted at " + localStorage.getItem("dailyReportsRunTime") + ":00 (Bot time)",
					fields: [{
							"name": "Status",
							"value": ":white_check_mark: Daily reports have been turned on"
						}
					],
					timestamp: new Date(),
					footer: {
						icon_url: bot.user.avatarURL,
						text: "Daily Reports"
					}
				}};
					msg.channel.send(resp);
					return;
			}
		}
		var mess = msg.content.substring(1,5);
		if (mess.indexOf("help") > -1) {
			msg.author.send({embed: {
				color: 3447003,
				author: {
					name: bot.user.username,
					icon_url: bot.user.avatarURL
				},
				title: "Commands",
				description: "Here's a list of commands - Remember, Mitzey#5500 is here to help.",
				fields: [
					{
						name: "!zec",
						value: "Displays current statistics of ZEC"
					},
					{
						name: "!reports",
						value: "Toggles daily reports"
					},
					{
						name: "!zecmine",
						value: "Shows all kinds of statistics found for the miner / wallet"
					},
					{
						name: "!zecminers",
						value: "Lists all the miners found on the address alongside their current hash rates and shares"
					},
					{
						name: "!zecprofit",
						value: "Estimates your current profits from /min to /hour to /year"
					},
					{
					name: "!zecaccount",
					value: "shows you your current account balance"
					}
				],
				timestamp: new Date(),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "With much processing"
				}
			}});
		}
		var mess = msg.content.substring(1,10);
		if (mess.indexOf("zecprofit") > -1) {
			var zecpermin = (dataArray["miner"]["btcPerMin"] / dataArray["zec-btc"]["ticker"]["price"]);
			var zecperhour = (zecpermin * 60);
			var zecperweek = ((zecperhour * 24) * 7);
			var zecpermonth = (zecperweek * 4);
			var zecperyear = (zecpermonth * 12);
			var resp = {embed: {
				color: 3447003,
				title: "Zcash profit report for:",
				description: "" + config.zecWallet + "\nKeep in mind this does not factor in costs or difficulty!.",
				fields: [{
						"name": "Yearly",
						"value": ":flag_ca: $" + helper.trimDecimals(zecperyear*dataArray["zec-cad"]["ticker"]["price"],2) + " \n:flag_us: $" + helper.trimDecimals(zecperyear*dataArray["zec-usd"]["ticker"]["price"],2) + "\n:dollar: " + helper.trimDecimals(zecperyear*dataArray["zec-btc"]["ticker"]["price"],6) + " BTC"
					},
					{
						"name": "Monthly",
						"value": ":flag_ca: $" + helper.trimDecimals(zecpermonth*dataArray["zec-cad"]["ticker"]["price"],2) + " \n:flag_us: $" + helper.trimDecimals(zecpermonth*dataArray["zec-usd"]["ticker"]["price"],2) + "\n:dollar: " + helper.trimDecimals(zecpermonth*dataArray["zec-btc"]["ticker"]["price"],6) + " BTC"
					},
					{
						"name": "Weekly",
						"value": ":flag_ca: $" + helper.trimDecimals(zecperweek*dataArray["zec-cad"]["ticker"]["price"],2) + " \n:flag_us: $" + helper.trimDecimals(zecperweek*dataArray["zec-usd"]["ticker"]["price"],2) + "\n:dollar: " + helper.trimDecimals(zecperweek*dataArray["zec-btc"]["ticker"]["price"],6) + " BTC"
					},
					{
						"name": "Hourly",
						"value": ":flag_ca: $" + helper.trimDecimals(zecperhour*dataArray["zec-cad"]["ticker"]["price"],2) + " \n:flag_us: $" + helper.trimDecimals(zecperhour*dataArray["zec-usd"]["ticker"]["price"],2) + "\n:dollar: " + helper.trimDecimals(zecperhour*dataArray["zec-btc"]["ticker"]["price"],6) + " BTC"
					}
				],
				timestamp: new Date(),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "ZEC Mine report"
				}
			}};
			msg.channel.send(resp);
			return;
		}
/*
		// Todo: rewrite this function so it works with our new global
		var mess = msg.content.substring(1,10);
		if (mess.indexOf("zecminers") > -1) {
			var miners = [];
			for (n in global.zecworkers) {
				var input = global.zecworkers[n].workerLastSubmitTime;
				current = new Date;
				current = ((current.valueOf() / 1000) - 86400);
				var test = input - current;
				if (test <= 0) {
					//don't watch
				} else {
					miners.push({"name": global.zecworkers[n].worker ,"value":"Hashrate: " + global.zecworkers[n].hashrate + "\nShares: " + global.zecworkers[n].validShares + "/" + global.zecworkers[n].invalidShares + "(" + ((global.zecworkers[n].validShares / (global.zecworkers[n].validShares + global.zecworkers[n].invalidShares))*100,0) + "%)"});
				}
			}
			var resp = {embed: {
				color: 3447003,
				title: "Zcash miners on:",
				description: "" + config.zecWallet,
				fields: miners,
				timestamp: new Date(),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "ZEC Mine report"
				}
			}};
			msg.channel.send(resp);
			return;
		}
*/
		var mess = msg.content.substring(1,8);
		if (mess.indexOf("zecmine") > -1) {
			var resp = {embed: {
				color: 3447003,
				title: "Zcash mining report for:",
				description: "" + config.zecWallet,
				fields: [{
						"name": "Hashrates",
						"value": "Average: " + dataArray["miner"]["avgHashrate"] + " H/s\nCurrent: " + dataArray["miner"]["hashRate"]
					},
					{
						"name": "Balances",
						"value": "Unpaid Balance: " + (dataArray["miner"]["unpaid"]/1e8)
					}
				],
				timestamp: new Date(),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "ZEC Mine report"
				}
			}};
			msg.channel.send(resp);
			return;
		}
		var mess = msg.content.substring(1,11);
		if (mess.indexOf("zecaccount") > -1) {
			var resp = {embed: {
				color: 3447003,
				title: "Zcash account report for:",
				description: String(config.zecWallet),
				fields: [{
						"name": "Current balance",
						"value": String(helper.trimDecimals(dataArray["wallet"]["balance"],8)) + " ZEC"
					},
					{
						"name": "No. of transactions",
						"value": String(dataArray["wallet"]["recvCount"]+dataArray["wallet"]["sentCount"])
					},
					{
						"name": "Account balance conversions",
						"value": ":flag_ca: $" + helper.trimDecimals(parseInt(dataArray["wallet"]["balance"])*dataArray["zec-cad"]["ticker"]["price"],2) + "\n:flag_us: $" + helper.trimDecimals(parseInt(dataArray["wallet"]["balance"])*dataArray["zec-usd"]["ticker"]["price"],2) + "\n:dollar: " +  (parseInt(dataArray["wallet"]["balance"])*dataArray["zec-btc"]["ticker"]["price"]) + " BTC"
					}
				],
				timestamp: new Date(),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "ZEC account"
				}
			}};
			msg.channel.send(resp);
			return;
		}
		var mess = msg.content.substring(1,4);
		if (mess.indexOf("zec") > -1) {
			if (dataArray["zec-cad"]["ticker"]["change"] < 0) {
				var arrow1 = "arrow_down_small"
			} else {
				var arrow1 = "arrow_up_small"
			}
			if (dataArray["zec-usd"]["ticker"]["change"] < 0) {
				var arrow2 = "arrow_down_small"
			} else {
				var arrow2 = "arrow_up_small"
			}
			if (dataArray["zec-btc"]["ticker"]["change"] < 0) {
				var arrow3 = "arrow_down_small"
			} else {
				var arrow3 = "arrow_up_small"
			}
			var resp = {embed: {
				color: 3447003,
				title: "Zcash Difficulty:",
				description: " " + dataArray["network-info"]["difficulty"],
				fields: [{
						"name": "ZEC to CAD",
						"value": ":flag_ca: $" + helper.trimDecimals(dataArray["zec-cad"]["ticker"]["price"],2) + "\n:" + arrow1 + ": $" + (Math.round(dataArray["zec-cad"]["ticker"]["change"] * 100) / 100)
					},
					{
						"name": "ZEC to USD",
						"value": ":flag_us: $" + helper.trimDecimals(dataArray["zec-usd"]["ticker"]["price"],2) + "\n:" + arrow2 + ": $" + (Math.round(dataArray["zec-usd"]["ticker"]["change"] * 100) / 100)
					},
					{
						"name": "ZEC to BTC",
						"value": ":dollar: " + dataArray["zec-btc"]["ticker"]["price"] + "BTC\n:" + arrow3 + ": " + dataArray["zec-btc"]["ticker"]["change"] + " BTC"
					}
				],
				timestamp: new Date(),
				footer: {
					icon_url: bot.user.avatarURL,
					text: "ZEC report"
				}
			}};
			msg.channel.send(resp);
			return;
		}
	}
});

bot.on("disconnected", function() {
	console.log("Lost Connection with Discord! Reconnecting...");
	return;
});

bot.on("error", function(err) {
	console.log(colors.red.underline.bgWhite("CRITICAL ERROR: " + err));
	return;
});

global.wait = setInterval(function() {
	getonline();
}, 5000);



function getonline() {
	isOnline().then(online => {
		if (online === true) {
			console.log(colors.blue("Connecting..."));
			bot.login(AuthDetails.token);
			clearInterval(global.wait);
		} else {
			console.log(colors.red.underline.bgWhite("ERROR: Connection lost!"))
		}
	});
}

getonline();

// "Legacy" code

/*
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
	var test = d.toString().trim();
	try {
		eval(test);
	} catch (e) {
		console.log("Failed user input: " + e);
	}
});

// These functions aren't even used!

function listusers () {
	for (guild of bot.guilds) {
		console.log("For the server: " + guild[1].name);
		for (member of guild[1].members) {
			console.log(member[1].user.username + " - " + member[1].user.bot + " - " + member[1].user.id);
		}
	}
}

function listservers () {
	for (guild of bot.guilds) {
		var test = 0;
		for (channel of guild[1].channels) {
			var thing = channel.map(function(a) {
				return a.type;
			});
			if (thing.indexOf('text') > 0) {
				test = test + 1;
			}
		}
		console.log(guild[1].name + " - " + guild[1].id + " - " + test + " Channels");
	}
}
*/