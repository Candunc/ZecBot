var stdin = process.openStdin();
stdin.addListener("data", function(d) {
	// note:  d is an object, and when converted to a string it will
	// end with a linefeed.  so we (rather crudely) account for that  
	// with toString() and then trim() 
	var test = d.toString().trim();
	try {
		eval(test);
	} catch (e) {
		console.log("Failed user input: " + e);
	}
});

global.zecwal = "t1Xwy36MQndXEbiz7NEDKsDKyZhGGjcKC8Q";
global.reportchannelserverid = "325318498987540480";
global.reportchannelid = "325318498987540480";
global.already = false;

try {
	var Discord = require("Discord.js");
} catch (e) {
	console.log("Please run npm install and ensure it passes with no errors!");
	process.exit();
}

function checktime () {
	var channel = bot.guilds.find("id",global.reportchannelserverid).channels.find("id",global.reportchannelid);
	var current = new Date();
	var current = current.getHours();
	if (parseInt(current) == 8 && global.already == true) {
		global.already = false;
		console.log("Resetting Daily Report...");
	}
	if (parseInt(current) == 7 && global.already == false && global.reports == "true") {
		console.log("Sending Daily Report...");
		global.already = true;
		var zecpermin = (global.zecbtcPerMin / global.zecbtcnow);
		var zecperhour = (zecpermin * 60);
		var zecperweek = ((zecperhour * 24) * 7);
		var zecpermonth = (zecperweek * 4);
		var zecperyear = (zecpermonth * 12);
		if (global.zeccaddif < 0) {
        	var arrow1 = "arrow_down_small"
        } else {
        	var arrow1 = "arrow_up_small"
       	}
		if (global.zecusddif < 0) {
        	var arrow2 = "arrow_down_small"
        } else {
       		var arrow2 = "arrow_up_small"
        }
		var resp = {embed: {
			color: 3447003,
			title: "Report for:",
			description: "" + global.zecwal,
			fields: [{
				"name": "Estimated income per year",
				"value": ":flag_ca: $" + (zecperyear*global.zeccadnow).toFixed(2) + " \n:flag_us: $" + (zecperyear*global.zecusdnow).toFixed(2) + "\n:dollar: " + (zecperyear*global.zecbtcnow).toFixed(6) + " BTC"
			},
			{
				"name": "Wallet Balance",
				"value": ":dollar: " + global.zecbal + " ZEC" + " - " + global.zectran + " Total Transactions\n" + ":flag_ca: $" + (parseInt(global.zecbal)*global.zeccadnow).toFixed(2) + "\n:flag_us: $" + (parseInt(global.zecbal)*global.zecusdnow).toFixed(2)
			},
			{
				"name": "Hashrates",
				"value": "Average: " + global.zecmavg + " H/s\nCurrent: " + global.zecmcur
			},
			{
				"name": "Balances",
				"value": "Unpaid Balance: " + global.zecmunpaid
			},
			{
				"name": "ZEC to CAD",
				"value": ":flag_ca: $" + global.zeccadnow.toFixed(2) + "\n:" + arrow1 + ": $" + (Math.round(global.zeccaddif * 100) / 100) + " (" + (Math.round(global.zeccadpers * 100) / 100) + "%)"
			},
			{
				"name": "ZEC to USD",
				"value": ":flag_us: $" + global.zecusdnow.toFixed(2) + "\n:" + arrow2 + ": $" + (Math.round(global.zecusddif * 100) / 100) + " (" + (Math.round(global.zecusdpers * 100) / 100) + "%)"
			}],
			timestamp: new Date(),
			footer: {
				icon_url: bot.user.avatarURL,
				text: "Daily Report"
			}
		}};
		channel.send(resp);
		return;
	}
}

if (typeof localStorage === "undefined" || localStorage === null) {
	var LocalStorage = require('node-localstorage').LocalStorage;
	localStorage = new LocalStorage('./scratch');
}

setInterval(function(){
	if (global.reports == "true") {
		checktime();
	}
},5000);

var test = localStorage.getItem("reports");
if (!test) {
	console.log("Reports value not set! Setting to default: False");
	localStorage.setItem("reports","false");
	global.reports = localStorage.getItem("reports");
} else {
	global.reports = localStorage.getItem("reports");
}

var colors = require('colors');

function getjson (url,call) {
	http = require("https");
	 http.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
		try {
			var res = JSON.parse(body);
		} catch (e) {
			console.log(e);
		}
        call(res);
    });
}).on('error', function(e){
});
}

getjson("https://zcash.flypool.org/api/miner_new/" + global.zecwal,function (res) {
	global.zecmavg = parseFloat(res.avgHashrate).toFixed(1);
	global.zecmcur = res.hashRate;
	global.zecmunpaid = (parseFloat(res.unpaid)/ 100000000) + " ZEC";
	global.zecworkers = res.workers;
	global.zecbtcPerMin = res.btcPerMin;
});

getjson("https://insight.mercerweiss.com/api/addr/" + global.zecwal + "/?noTxList=1",function (res) {
	global.zecbal = res.balance;
	global.zectran = res.txApperances;
});

getjson("https://insight.mercerweiss.com/api/status?q=getInfo",function (res) {
	global.zecdiff = res.info.difficulty;
});

getjson("https://api.cryptonator.com/api/full/zec-cad",function (res) {
		global.zeccadnow = parseFloat(res.ticker.price);
		global.zeccaddif = parseFloat(res.ticker.change);
		global.zeccadoriginal = global.zeccadnow + (global.zeccaddif * -1);
		global.zeccadpers = (global.zeccaddif/global.zeccadoriginal)*100;
});

getjson("https://api.cryptonator.com/api/full/zec-usd",function (res) {
		global.zecusdnow = parseFloat(res.ticker.price);
		global.zecusddif = parseFloat(res.ticker.change);
		global.zecusdoriginal = global.zecusdnow + (global.zecusddif * -1);
		global.zecusdpers = (global.zecusddif/global.zecusdoriginal)*100;
});

getjson("https://api.cryptonator.com/api/full/zec-btc",function (res) {
		global.zecbtcnow = parseFloat(res.ticker.price);
		global.zecbtcdif = parseFloat(res.ticker.change);
		global.zecbtcoriginal = global.zecbtcnow + (global.zecbtcdif * -1);
		global.zecbtcpers = (global.zecbtcdif/global.zecbtcoriginal)*100;
});
	
setInterval(function () {
	getjson("https://zcash.flypool.org/api/miner_new/" + global.zecwal,function (res) {
	global.zecmavg = parseFloat(res.avgHashrate).toFixed(1);
	global.zecmcur = res.hashRate;
	global.zecmunpaid = (parseFloat(res.unpaid)/ 100000000) + " ZEC";
	global.zecworkers = res.workers;
	global.zecbtcPerMin = res.btcPerMin;
});

getjson("https://insight.mercerweiss.com/api/addr/" + global.zecwal + "/?noTxList=1",function (res) {
	global.zecbal = res.balance;
	global.zectran = res.txApperances;
});

getjson("https://insight.mercerweiss.com/api/status?q=getInfo",function (res) {
	global.zecdiff = res.info.difficulty;
});

getjson("https://api.cryptonator.com/api/full/zec-cad",function (res) {
		global.zeccadnow = parseFloat(res.ticker.price);
		global.zeccaddif = parseFloat(res.ticker.change);
		global.zeccadoriginal = global.zeccadnow + (global.zeccaddif * -1);
		global.zeccadpers = (global.zeccaddif/global.zeccadoriginal)*100;
});

getjson("https://api.cryptonator.com/api/full/zec-usd",function (res) {
		global.zecusdnow = parseFloat(res.ticker.price);
		global.zecusddif = parseFloat(res.ticker.change);
		global.zecusdoriginal = global.zecusdnow + (global.zecusddif * -1);
		global.zecusdpers = (global.zecusddif/global.zecusdoriginal)*100;
});

getjson("https://api.cryptonator.com/api/full/zec-btc",function (res) {
		global.zecbtcnow = parseFloat(res.ticker.price);
		global.zecbtcdif = parseFloat(res.ticker.change);
		global.zecbtcoriginal = global.zecbtcnow + (global.zecbtcdif * -1);
		global.zecbtcpers = (global.zecbtcdif/global.zecbtcoriginal)*100;
});
},10000);

try {
	if (typeof localStorage === "undefined" || localStorage === null) {
		var LocalStorage = require('node-localstorage').LocalStorage;
		localStorage = new LocalStorage('./scratch');
	}
	var AuthDetails = require("./auth.json");
	localStorage.setItem("AuthDetails.token", AuthDetails.token);
} catch (e) {
	console.log("Please check the auth.json.");
	process.exit();
}

const bot = new Discord.Client();

fs = require("fs");


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


global.miners = {};

bot.on('ready', () => {
	var test = 0;
	for (channel of bot.channels) {
		var thing = channel.map(function(a) {
			return a.type;
		});
		if (thing.indexOf('text') > 0) {
			test = test + 1;
		}
	}
	var test2 = 0;
	for (guild of bot.guilds) {
		test2 = test2 + 1;
	}
	bot.user.setGame("Use !help");
	console.log(colors.green("Ready to begin! Serving in " + test + " Channels | " + test2 + " Servers"));
});

bot.on('reconnecting', () => {
	if (global.alreadydidstuff === false) {
		console.log(colors.red.underline.bgWhite("Error: Lost Connection with Discord! Reconnecting..."));
		global.alreadydidstuff = true;
	}
});

bot.on('message', msg => {
	var testing = msg.isMentioned(bot.user);
	if (testing === true || msg.channel.type === "dm") {
		var tome = true;
	} else {
		var tome = false;
	}
	if (msg.author.id != bot.user.id && (msg.content[0] === '!' || tome === true)) {
		console.log("Received Message from " + msg.author.username + ": " + msg.content);
		var fullmess = msg.content;
		if (msg.guild == null) {
			msg.author.send("Please communicate via the server. Not DM");
			return;
		}
		var helpline = {embed: {
    color: 3447003,
    author: {
      name: bot.user.username,
      icon_url: bot.user.avatarURL
    },
    title: "Commands",
    description: "Here's a list of commands - Remember, Mitzey#5500 is here to help.",
    fields: [{
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
  }
};
		var mess = msg.content.substring(1,8);
		if (mess.indexOf("reports") > -1) {
			if (global.reports == "true") {
				global.reports = "false";
				localStorage.setItem("reports","false");
				console.log("Reports Disabled");
				var resp = {embed: {
				color: 3447003,
				title: "Daily Reports:",
				description: "These are the reports that are posted at 7AM (Bot time)",
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
			}
			if (global.reports == "false") {
				global.reports = "true";
				localStorage.setItem("reports","true");
				console.log("Reports Enabled");
				var resp = {embed: {
				color: 3447003,
				title: "Daily Reports:",
				description: "These are the reports that are posted at 7AM (Bot time)",
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
			msg.author.send(helpline);
		}
		var mess = msg.content.substring(1,10);
		if (mess.indexOf("zecprofit") > -1) {
			var zecpermin = (global.zecbtcPerMin / global.zecbtcnow);
			var zecperhour = (zecpermin * 60);
			var zecperweek = ((zecperhour * 24) * 7);
			var zecpermonth = (zecperweek * 4);
			var zecperyear = (zecpermonth * 12);
			var resp = {embed: {
				color: 3447003,
				title: "Z-Cash profit report for:",
				description: "" + global.zecwal + "\nKeep in mind this does not factor in costs or difficulty!.",
				fields: [{
						"name": "Yearly",
						"value": ":flag_ca: $" + (zecperyear*global.zeccadnow).toFixed(2) + " \n:flag_us: $" + (zecperyear*global.zecusdnow).toFixed(2) + "\n:dollar: " + (zecperyear*global.zecbtcnow).toFixed(6) + " BTC"
					},
					{
						"name": "Monthly",
						"value": ":flag_ca: $" + (zecpermonth*global.zeccadnow).toFixed(2) + " \n:flag_us: $" + (zecpermonth*global.zecusdnow).toFixed(2) + "\n:dollar: " + (zecpermonth*global.zecbtcnow).toFixed(6) + " BTC"
					},
					{
						"name": "Weekly",
						"value": ":flag_ca: $" + (zecperweek*global.zeccadnow).toFixed(2) + " \n:flag_us: $" + (zecperweek*global.zecusdnow).toFixed(2) + "\n:dollar: " + (zecperweek*global.zecbtcnow).toFixed(6) + " BTC"
					},
					{
						"name": "Hourly",
						"value": ":flag_ca: $" + (zecperhour*global.zeccadnow).toFixed(2) + " \n:flag_us: $" + (zecperhour*global.zecusdnow).toFixed(2) + "\n:dollar: " + (zecperhour*global.zecbtcnow).toFixed(6) + " BTC"
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
					miners.push({"name": global.zecworkers[n].worker ,"value":"Hashrate: " + global.zecworkers[n].hashrate + "\nShares: " + global.zecworkers[n].validShares + "/" + global.zecworkers[n].invalidShares + "(" + ((global.zecworkers[n].validShares / (global.zecworkers[n].validShares + global.zecworkers[n].invalidShares))*100).toFixed(0) + "%)"});
				}
			}
			var resp = {embed: {
				color: 3447003,
				title: "Z-Cash miners on:",
				description: "" + global.zecwal,
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
		var mess = msg.content.substring(1,8);
		if (mess.indexOf("zecmine") > -1) {
			var resp = {embed: {
				color: 3447003,
				title: "Z-Cash mining report for:",
				description: "" + global.zecwal,
				fields: [{
						"name": "Hashrates",
						"value": "Average: " + global.zecmavg + " H/s\nCurrent: " + global.zecmcur
					},
					{
						"name": "Balances",
						"value": "Unpaid Balance: " + global.zecmunpaid
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
				title: "Z-Cash account report for:",
				description: "" + global.zecwal,
				fields: [{
						"name": "Current balance",
						"value": global.zecbal + " ZEC"
					},
					{
						"name": "No. of transactions",
						"value": global.zectran
					},
					{
						"name": "Account balance conversions",
						"value": ":flag_ca: $" + (parseInt(global.zecbal)*global.zeccadnow).toFixed(2) + "\n:flag_us: $" + (parseInt(global.zecbal)*global.zecusdnow).toFixed(2) + "\n:dollar: " +  (parseInt(global.zecbal)*global.zecbtcnow) + " BTC"
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
			if (global.zeccaddif < 0) {
        		var arrow1 = "arrow_down_small"
        	} else {
        		var arrow1 = "arrow_up_small"
        	}
			if (global.zecusddif < 0) {
        		var arrow2 = "arrow_down_small"
        	} else {
        		var arrow2 = "arrow_up_small"
        	}
			if (global.zecbtcdif < 0) {
        		var arrow3 = "arrow_down_small"
        	} else {
        		var arrow3 = "arrow_up_small"
        	}
			var resp = {embed: {
				color: 3447003,
				title: "Z-Cash Difficulty:",
				description: " " + global.zecdiff,
				fields: [{
						"name": "ZEC to CAD",
						"value": ":flag_ca: $" + global.zeccadnow.toFixed(2) + "\n:" + arrow1 + ": $" + (Math.round(global.zeccaddif * 100) / 100) + " (" + (Math.round(global.zeccadpers * 100) / 100) + "%)"
					},
					{
						"name": "ZEC to USD",
						"value": ":flag_us: $" + global.zecusdnow.toFixed(2) + "\n:" + arrow2 + ": $" + (Math.round(global.zecusddif * 100) / 100) + " (" + (Math.round(global.zecusdpers * 100) / 100) + "%)"
					},
					{
						"name": "ZEC to BTC",
						"value": ":dollar: " + global.zecbtcnow + "BTC\n:" + arrow3 + ": " + global.zecbtcdif + "BTC (" + (Math.round(global.zecbtcpers * 100) / 100) + "%)"
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

var Colors = {
  DEFAULT: 0x000000,
  AQUA: 0x1ABC9C,
  GREEN: 0x2ECC71,
  BLUE: 0x3498DB,
  PURPLE: 0x9B59B6,
  GOLD: 0xF1C40F,
  ORANGE: 0xE67E22,
  RED: 0xE74C3C,
  GREY: 0x95A5A6,
  NAVY: 0x34495E,
  DARK_AQUA: 0x11806A,
  DARK_GREEN: 0x1F8B4C,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368A,
  DARK_GOLD: 0xC27C0E,
  DARK_ORANGE: 0xA84300,
  DARK_RED: 0x992D22,
  DARK_GREY: 0x979C9F,
  DARKER_GREY: 0x7F8C8D,
  LIGHT_GREY: 0xBCC0C0,
  DARK_NAVY: 0x2C3E50,
  BLURPLE: 0x7289DA,
  GREYPLE: 0x99AAB5,
  DARK_BUT_NOT_BLACK: 0x2C2F33,
  NOT_QUITE_BLACK: 0x23272A,
}

function resolveColor (color) {
    if (typeof color === 'string') {
      if (color === 'RANDOM') return Math.floor(Math.random() * (0xFFFFFF + 1));
      color = Colors[color] || parseInt(color.replace('#', ''), 16);
    } else if (color instanceof Array) {
      color = (color[0] << 16) + (color[1] << 8) + color[2];
    }

    if (color < 0 || color > 0xFFFFFF) {
      throw new RangeError('Color must be within the range 0 - 16777215 (0xFFFFFF).');
    } else if (color && isNaN(color)) {
      throw new TypeError('Unable to convert color to a number.');
    }

    return color;
  }

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

const isOnline = require('is-online');

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
