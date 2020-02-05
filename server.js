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

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" })
);