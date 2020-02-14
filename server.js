var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");

var express = require("express");
var app = express();

const request = require("request");
const cheerio = require("cheerio");
const axios = require("axios");

const Comment = require("./models/Comment");
const Article = require("./models/Article");


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

app.get("/scrape", function (req, res) {
    axios.get("https://www.animenewsnetwork.com/").then(function (response) {

        var $ = cheerio.load(response.data);
        var titleArray = [];
        $(".wrap").each(function (i, element) {
            var result = {};
            result.title = $(this)
                .children("div")
                .children("h3")
                .children("a")
                .text();
            result.link = $(this)
                .children("div")
                .children("h3")
                .children("a")
                .attr("href");
            console.log(result)
            if (result.title !== "" && result.link !== "") {
                if (titleArray.indexOf(result.title) == -1) {
                    titleArray.push(result.title);

                    Article.count({ title: result.title }, function (err, test) {
                        if (test === 0) {
                            var entry = new Article(result);

                            entry.save(function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(doc);
                                }
                            })
                        }
                    })
                } else {
                    console.log("Article already exists...");
                }
            }



        });


        res.redirect("/articles");


    });
});

app.get("/articles", function (req, res) {
    Article.find().sort({ _id: -1 }).exec(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            var artcl = { article: doc };
            res.render("index", artcl);
        }
    });
});


app.get("/articles-json", function (req, res) {
    Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);

        }
    });
});



app.get("/clearAll", function (req, res) {
    Article.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("removed all articles");
        }
    });

    res.redirect("/articles-json");
});

app.get("/readArticle/:id", function (req, res) {
    var article = req.params.id;
    var hobj = {
        article: [],
        body: []
    };

    Article.findOne({ _id: articleID })
        .populate("comment")
        .exec(function (err, doc) {
            if (err) {
                console.log("Error: " + err);
            } else {
                hobj.article = doc;
                var link = doc.link;
                request(link, function (error, response, html) {
                    var $ = cheerio.load(html);

                    $(".l-col__main").each(function (i, element) {
                        hobj.body = $(this)
                            .children(".c-entry-content")
                            .children("p")
                            .text();

                        res.render("article", hobj);
                        return false;
                    });
                });
            }
        });
});

app.post("/comment/:id", function (req, res) {
    var user = req.body.name;
    var content = req.body.comment;
    var articleID = req.params.id;

    var commendOb = {
        name: user,
        body: content
    };

    var newComments = new Comment(commendOb);

    newComments.save(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log(doc._id);
            console.log(articleID);

            Article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { comment: doc._id } },
                { new: true }
            ).exec(function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/readArticle/" + articleID);
                }
            });
        }
    });
});

module.exports = app;

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