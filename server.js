var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");

var express = require("express");
var app = express();

app.use(logger("dev"));
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

///handlebars setup///
app.get('/', function (req, res) {
    res.render('index', {});
});
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: 'main' }));
app.set("view engine", "handlebars");


///mongoose connections///
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/Scrape";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

mongoose.connect("mongodb://localhost/Scrape");
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected to Mongoose!")
})

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Listening on PORT " + port);
});