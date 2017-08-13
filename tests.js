var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

// Not an automated test. Should be run by a human to inspect if the values seem right

global.config = {
	"zecWallet":"t1Xwy36MQndXEbiz7NEDKsDKyZhGGjcKC8Q"
}
global.dataArray = {
	"error":false,
	"lastUpdate":0,
	"testing":true
}

var helper = require("./helper.js");

helper.updateValues();
helper.prepareDailyReport();