var https =require("https");
var mongodb = require("mongodb");
var fs=require("fs");
var db = null;
var connection = null;
function connect(){
	return new Promise((resolve,reject)=>{
		mongodb.MongoClient.connect("mongodb://psale:test@localhost:27017/psn",function(err, handler){
        		if(err){
                		reject(err);
        		}else{
				connection = handler;
                		db=handler.db("psn");
				resolve();
        		}

		});
	});
}

function getTotalGames(){
	return  new Promise((resolve , reject)=>{
		var req = https.get("https://store.playstation.com/valkyrie-api/ch/HK/19/container/STORE-MSF86012-GAMESALL",(res)=>{
        		var data = "";
        		var games = {};
        		res.on("data", (d)=>{
                		console.log("loading...");
                		data+=d.toString();
        		});

        		res.on("end", ()=>{
                		console.log("loaded.");
                		games = JSON.parse(data);
				resolve(parseInt(games.data.attributes["total-results"]));
			});
		});
		req.on("error",(e)=>{
			reject("failed to get count.");
		});
		req.end();

	});
}

function syncAllGames(total){
	return new Promise((resolve, reject)=>{
		var req = https.get("https://store.playstation.com/valkyrie-api/ch/HK/19/container/STORE-MSF86012-GAMESALL?size="+total,(res)=>{
        		var data = "";
        		var games = {};
        		res.on("data", (d)=>{
                		console.log("loading...");
                		data+=d.toString();
        		});

        		res.on("end", ()=>{
                		console.log("loaded.");
                		games = JSON.parse(data);
				db.collection("games").drop().then(()=>{save(games,resolve);}).catch(()=>{save(games,resolve);});
			});
		});
		req.end();
	});
}
function save(games,callback){
                                        db.collection("games").insertMany(games.included).then((r)=>{
                                                console.log("synced");
                                                console.log(r.insertedCount);
						callback();
                                        });
                                
}

connect().then(getTotalGames).then(syncAllGames).then(()=>{
	connection.close();
	var d= new Date();
	fs.writeFileSync("js/sync.txt", d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes());
	process.exit();
});
