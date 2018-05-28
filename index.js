var express = require("express");
var swig = require("swig");
var http = require("http");
var mongodb = require("mongodb");
var app = express();
var server =  http.Server(app);
var db = null;
var connection=null;
function connect(){
	return new Promise((resolve,reject)=>{
		mongodb.MongoClient.connect("mongodb://psale:test@localhost:27017/psn",function(err, handler){
        		if(err){
                		console.log(err);
        		}else{
				connection = handler;
                		db=handler.db("psn");
				resolve();
        		}

		});
	});
}
app.use("/css", express.static("css"));
app.use("/js", express.static("js"));
app.use("/img", express.static("img"));
app.use("/doc", express.static("doc"));
app.engine("html", swig.renderFile);
app.set("view engine", "html");
app.set("views", __dirname+"/views");
app.set("view cache", false);
swig.setDefaults({cache:false});
app.get("/",(req,res)=>{
	res.status(302);
	res.setHeader("Location","/low/desc/1/9");
	res.end();
});
app.get("/:type/:order/:page/:pageSize",(req,res)=>{
	res.render("index", {page:req.params.page, pageSize:req.params.pageSize,order:req.params.order, isHQ:req.params.type == "high"?1:0});
});


app.get("/:order/:page/:pageSize", (req,res)=>{

	var xx =db.collection("games").aggregate([
		{"$unwind":"$attributes.skus"},
		{"$match":{
				"$or":[
					{"attributes.skus.prices.non-plus-user.discount-percentage":{"$gt":0}},
					{"attributes.skus.multibuy.discount":{"$gt":0}}
				]
			}
		},
		{"$project":{
				"attributes":1,
				"id":1,
				"discount":{
					"$let":{
						"vars":{
							"mdiscount":{"$ifNull":["$attributes.skus.multibuy.discount",0]}
						},
						"in":{"$add":["$$mdiscount","$attributes.skus.prices.non-plus-user.discount-percentage"]}
					}
				}
			}
		},
		//{"$sort":{"attributes.skus.prices.non-plus-user.discount-percentage":req.params.order=="asc"?1:-1}},
		{"$sort":{"discount":req.params.order=="asc"?1:-1}},
		{"$skip":parseInt(req.params.pageSize)*(parseInt(req.params.page)-1)},
		{"$limit":parseInt(req.params.pageSize)}
		
	]).toArray((err,docs)=>{
		res.json(docs);
		res.end();
	});

});


connect().then(()=>{
	app.listen(parseInt(process.argv[2]));
});
//app.listen(11112);
