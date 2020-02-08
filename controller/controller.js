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
    request("https://www.msnbc.com/", function (error, response, html) {
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

module.exports = router;
