const express = require("express");
const router = express.Router();
const path = require("path");

const request = require("request");
const cheerio = require("cheerio");

const Comment = require("../models/Comment.js");
const Article = require("../models/Article.js");

router.get("/", function (req, res) {
    res.redirect("/articles");
});

router.get("/scrape", function (req, res) {
    request("https://www.animenewsnetwork.com/", function (error, response, html) {
        var $ = cheerio.load(html);
        var titleArray = [];

        $(".c-entry-box--compact__title").each(function (i, element) {

            var result = {};

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
            Attr("href");

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


        res.redirect("/");


    });
});

router.get("/articles", function (req, res) {
    Article.find().sort({ _id: -1 }).exec(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            var artcls = { article: doc };
            res.render("index", artcls);
        }
    });
});

router.get("/articles-json", function (req, res) {
    Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

router.get("/clearAll", function (req, res) {
    Article.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("removed all articles");
        }
    });

    res.redirect("/articles-json");
});

router.get("/readArticle/:id", function (req, res) {
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

router.post("/comment/:id", function (req, res) {
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

module.exports = router;
