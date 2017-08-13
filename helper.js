var request = require("request");
var sleep = require("system-sleep");

module.exports = {
	checkTime: checkTime,
	trimDecimals: trimDecimals,
	updateValues: updateValues,
	resolveColor: resolveColor,

	// Only exported because we call it directly in tests.js
	prepareDailyReport: prepareDailyReport
}

var colorArray = {
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

// Global Functions

function checkTime() {
	var current = new Date();
	var currentHour = parseInt(current.getHours());
	var currentDate = parseInt(current.getDate());

	if (currentHour == localStorage.getItem("dailyReportRunTime") 
			&& currentDate != localStorage.getItem("dailyReportLastRun")
			&& localStorage.getItem("dailyReport")
		) {
		localStorage.setItem("dailyReportLastRun",currentDate);
		updateValues();
		prepareDailyReport();
	}
}

function getEpoch() {
	return Math.floor((new Date).getTime()/1000);
}

// I don't even the indents in this function.
function resolveColor (color) {
    if (typeof color === 'string') {
      if (color === 'RANDOM') return Math.floor(Math.random() * (0xFFFFFF + 1));
      color = colorArray[color] || parseInt(color.replace('#', ''), 16);
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

function trimDecimals(input,trimNum) {
	return parseFloat(input).toFixed(trimNum);
}

function updateValues() {
	urlArray = {
		"miner":"https://zcash.flypool.org/api/miner_new/" + config.zecWallet,
		"wallet":"https://api.zcha.in/v2/mainnet/accounts/" + config.zecWallet,
		"network-info":"https://api.zcha.in/v2/mainnet/network",
		"zec-cad":"https://api.cryptonator.com/api/full/zec-cad",
		"zec-usd":"https://api.cryptonator.com/api/full/zec-usd",
		"zec-btc":"https://api.cryptonator.com/api/full/zec-btc",
	}

	// Only update values if last update was done more than four minutes ago
	if ((getEpoch() - dataArray["lastUpdate"]) > 240) {
		for (var key in urlArray) {
			getJSON(urlArray[key],key);
		}
		dataArray["lastUpdate"] = getEpoch();
	}
}

function valuesAreUpdated() {
	var checkArray = ["miner","wallet","network-info","zec-cad","zec-usd","zec-btc"];
	var boolean = true;

	for (var i = 0; i < checkArray.length; i++) {
		boolean = boolean && dataArray[checkArray[i]]["completed"];
	}

	return boolean;
}

// Local Functions

function getJSON(url,key) {
	dataArray[key] = {};
	dataArray[key]["completed"] = false;
	request({url: url, json: true}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			dataArray[key] = body;
			dataArray[key]["completed"] = true;
		} else {
			console.log("Error on url '" + url + "'; " + error);
			dataArray["error"] = true;
		}
	})
}


// Functions regarding Daily Reports

function prepareDailyReport(testing) {
	if (dataArray["error"]) {
		console.log("An error has occured and a daily report couldn't be produced.");

		// Reset in case that the issue corrects itself.
		dataArray["error"] = false;
		return null
	}

	if (valuesAreUpdated()) {
		finalizeDailyReport();
	} else {
		setTimeout(prepareDailyReport,250)
	}
}

function finalizeDailyReport() {
	console.log("Sending Daily Report...");

	var zecpermin = (dataArray["miner"]["btcPerMin"] / dataArray["zec-btc"]["ticker"]["price"]);
	var zecperhour = (zecpermin * 60);
	var zecperweek = ((zecperhour * 24) * 7);
	var zecpermonth = (zecperweek * 4);
	var zecperyear = (zecpermonth * 12);

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

	if (!dataArray["testing"]) {
		var icon_url = bot.user.avatarURL;
	}

	var resp = {embed: {
		color: 3447003,
		title: "Report for:",
		description: "" + config.zecWallet,
		fields: [{
			"name": "Estimated income per year",
			"value": ":flag_ca: $" + trimDecimals((zecperyear*dataArray["zec-cad"]["ticker"]["price"]),2) + " \n:flag_us: $" + trimDecimals((zecperyear*dataArray["zec-usd"]["ticker"]["price"]),2) + "\n:dollar: " + trimDecimals((zecperyear*dataArray["zec-btc"]["ticker"]["price"]),6) + " BTC"
		},
		{
			"name": "Wallet Balance",
			"value": ":dollar: " + trimDecimals(dataArray["wallet"]["balance"],4) + " ZEC" + " - " + (dataArray["wallet"]["recvCount"]+dataArray["wallet"]["sentCount"]) + " Total Transactions\n" + ":flag_ca: $" + trimDecimals((parseInt(dataArray["wallet"]["balance"])*dataArray["zec-cad"]["ticker"]["price"]),2) + "\n:flag_us: $" + trimDecimals((parseInt(dataArray["wallet"]["balance"])*dataArray["zec-usd"]["ticker"]["price"]),2)
		},
		{
			"name": "Hashrates",
			"value": "Average: " + trimDecimals(dataArray["miner"]["avgHashrate"],1) + " H/s\n" //Current: " + dataArray["miner"]["hashrate"]
		},
		{
			"name": "Balances",
			"value": "Unpaid Balance: " + (dataArray["miner"]["unpaid"]/1e8)
		},
		{
			"name": "ZEC to CAD",
			"value": ":flag_ca: $" + trimDecimals(dataArray["zec-cad"]["ticker"]["price"],2) + "\n:" + arrow1 + ": $" + (Math.round(dataArray["zec-cad"]["ticker"]["change"] * 100) / 100)
		},
		{
			"name": "ZEC to USD",
			"value": ":flag_us: $" + trimDecimals(dataArray["zec-usd"]["ticker"]["price"],2) + "\n:" + arrow2 + ": $" + (Math.round(dataArray["zec-usd"]["ticker"]["change"] * 100) / 100)
		}],
		timestamp: new Date(),
		footer: {
			icon_url: icon_url,
			text: "Daily Report"
		}
	}};

	if (dataArray["testing"]) {
		console.log(JSON.stringify(resp));
	} else {
		var channel = bot.guilds.find("id",config.reportChannelServerID).channels.find("id",config.reportChannelID);
		channel.send(resp);
	}
}