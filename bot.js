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

try {
	var Discord = require("Discord.js");
} catch (e) {
	console.log("Please run npm install and ensure it passes with no errors!");
	process.exit();
}

var colors = require('colors');

if (typeof localStorage === "undefined" || localStorage === null) {
	var LocalStorage = require('node-localstorage').LocalStorage;
	localStorage = new LocalStorage('./scratch');
}
function getjson (url,call) {
	http = require("https");
	 http.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function(){
        var res = JSON.parse(body);
        call(res);
    });
}).on('error', function(e){
});
}
var target = 235.2;
target = Math.round(target * 100) / 100;
if (target.toString().indexOf(".") == -1) {
	console.log("$"+target+".00");
} else {
	test2 = target.toString().substring(target.toString().indexOf(".")+1,target.length);
	if (test2.length == 1) {
		
	}	
}

getjson("https://api.cryptonator.com/api/full/zec-cad",function (res) {
		global.zeccadnow = parseInt(res.ticker.price);
		global.zeccaddif = parseInt(res.ticker.change);
		global.zeccadoriginal = global.zeccadnow + (global.zeccaddif * -1);
		global.zeccadpers = (global.zeccaddif/global.zeccadoriginal)*100;
	});
	
setInterval(function () {
	getjson("https://api.cryptonator.com/api/full/zec-cad",function (res) {
		global.zeccadnow = parseInt(res.ticker.price);
		global.zeccaddif = parseInt(res.ticker.change);
		global.zeccadoriginal = global.zeccadnow + (global.zeccaddif * -1);
		global.zeccadpers = (global.zeccaddif/global.zeccadoriginal)*100;
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

function startsaver () {
	global.saveint1 = setInterval(function () {
		fs.writeFile('./miners.json', JSON.stringify(global.miners) , 'utf-8');
	},700);
}

function read () {
	fs.readFile('./miners.json', 'utf8', (err, data) => {
  		if (err) return;
  		global.miners = JSON.parse(data);
	});
}

global.miners = {};

bot.on('ready', () => {
	var test = 0;
	read();
	setTimeout(function () {
		startsaver();
	}, 1700);
	for (channel of bot.channels) {
		var thing = channel.map(function(a) {
			return a.type;
		});
		if (thing.indexOf('text') > 0) {
			test = test + 1;
		}
		//bot.EvaluatedPermissions
	}
	var test2 = 0;
	for (guild of bot.guilds) {
		test2 = test2 + 1;
		//bot.EvaluatedPermissions
	}
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
    description: "Here's a list of commands - Remember, Mitzey#5500 is always here to help.",
    fields: [{
        name: "!zec",
        value: "Displays current statistics of ZEC"
      },
      {
        name: "!avg",
        value: "Lists the current avg hash rate"
      },
      {
        name: "!cur",
        value: "Lists the current hash rate"
      },
      {
        name: "!miners",
        value: "Lists all the miners found on the address alongside their current and average hash rates and shares (including those that are no longer in service)"
      },
      {
        name: "!shares",
        value: "shows the status of shares and stuff"
      },
      {
        name: "!profit",
        value: "Estimates your current profits from /min to /hour to /year"
      },
      {
        name: "!balances",
        value: "Current unpaid balance"
      },
      {
        name: "!account",
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
		var mess = msg.content.substring(1,5);
		if (mess.indexOf("help") > -1) {
			msg.author.send(helpline);
		}
		var mess = msg.content.substring(1,4);
		if (global.zeccaddif < 0) {
        		var arrow = "arrow_down_small"
        	} else {
        		var arrow = "arrow_up_small"
        	}
		var resp = {embed: {
    color: 3447003,
    title: "Z-Cash Values as of now",
    description: "Here's a report on ZEC as of " + new Date(),
    fields: [{
        "name": "ZEC to CAD",
        "value": ":flag_ca: $" + global.zeccadnow + "\n:" + arrow + ": $" + (Math.round(global.zeccaddif * 100) / 100) + " (" + (Math.round(global.zeccadpers * 100) / 100) + "%)"
      },
      {
        "name": "ZEC to USD",
        "value": ":flag_us: $" + global.zeccadnow + "\n:" + arrow + ": $" + global.zeccaddif + " (" + global.zeccadpers + "%)"
      },
      {
        "name": "ZEC to BTC",
        "value": ":dollar: $491.39\n:arrow_down_small: $-1.53 (-0.197%)"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: bot.user.avatarURL,
      text: "With much processing"
    }
  }
};
		if (mess.indexOf("zec") > -1) {
			msg.channel.send(resp);
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
