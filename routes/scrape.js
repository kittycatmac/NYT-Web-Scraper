//Dependencies
const express = require('express'),
      cheerio = require('cheerio'),
      axios = require("axios");
      router = express.Router(),
      db = require('../models');

//route to scrape new articles
router.get("/newArticles", function(req, res) {
  db.Article
  .find({})
  .then((savedArticles) => {
    console.log('SavedArticles: ', savedArticles);
    //creating an array of saved article headlines
    let savedHeadlines = savedArticles.map(article => article.headline);
    axios.get('https://www.nytimes.com/section/us')
        .then(function (response) {
          var $ = cheerio.load(response.data);
          let newArticleArr = [];
          //iterating over returned articles, and creating a newArticle object from the data
          //console.log($('#collection-us'));
          $('#collection-us article').each((i, element) => {
            let newArticle = new db.Article({
              storyUrl: $(element).find('a').attr('href'),
              headline: $(element).find('h2').text().trim(),
              summary : $(element).find('p').text().trim(),
              imgUrl  : $(element).find('img').attr('src'),
              byLine  : $(element).find('figcaption').text().trim()
            });
            console.log(newArticle);
            //checking to make sure newArticle contains a storyUrl
            if (newArticle.storyUrl) {
              //checking if new article matches any saved article, if not add it to array
              //of new articles
              if (!savedHeadlines.includes(newArticle.headline)) {
                newArticleArr.push(newArticle);
              }
            }
          });//end of each function

          //adding all new articles to database
          db.Article
            .create(newArticleArr)
            .then(result => {
              //console.log("RESULT: ", result);
              res.json({count: newArticleArr.length})
            })//returning count of new articles to front end
            .catch(err => {});
        })
        .catch(err => console.log(err)); //end of axios method
    })
    .catch(err => console.log(err)); //end of db.Article.find()
});// end of get request to /scrape

module.exports = router;