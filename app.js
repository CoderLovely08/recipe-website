//jshint esversion:6
// Import the required packages and modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const imgur = require('imgur-uploader');
// const fs = require("fs")
const fileupload = require("express-fileupload");
const loadsh = require("lodash")
const session = require('express-session');

// Import the dotenv module to load environment variables from a .env file
require("dotenv").config();

// Import the async module to use asynchronous functions
var async = require('async');

// Import the bcrypt module to use password hashing functions
const bcrypt = require('bcrypt');

// Set the number of salt rounds to use when hashing passwords
const saltRounds = 10;

// Create an app instance of the express web framework
const app = express();

// Connect to the database
const pg = require('pg');



const client = new pg.Client("postgres://wmrtdiic:HupTLf3Hy1WMhDQ2j1-nI6SvwsGXYcY5@tiny.db.elephantsql.com/wmrtdiic")

client.connect();
console.log("Connected to the database");

app.set('view engine', 'ejs'); // Set the view engine to be EJS

app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser to parse form data
var urlencodedparser = bodyParser.urlencoded({ extended: false }) // Create a urlencoded parser
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(fileupload()); // Use the fileupload middleware to handle file uploads

// Use the express-session middleware to manage user sessions
app.use(session({
    secret: "my-secret-key", // Use a secret key to encrypt the session data
    resave: false, // Don't resave the session if it hasn't changed
    saveUninitialized: true, // Save a new, uninitialized session
    expires: new Date(Date.now() + (60 * 60 * 1000)) // Set the session to expire after 1 hour
}));

app.get("/", function (req, res) {
    client.query(
        "select * from RecipeInfo",
        function (err, result) {
            // Check for errors
            if (err) {
                // If there was an error, send a server error response
                res.status(500).send('Error querying database: ' + err);
            } else {
                if (result.rows.length != 0) {

                    // Otherwise, render the home page with the data received from the database
                    let recipeDetails = result.rows
                    let totalRecipe = result.rowCount
                    res.render('home', { recipeDetails, totalRecipe });
                } else {
                    res.render('error')
                }
            }
        }
    );
})

app.route("/addRecipe")
    .get((req, res) => {
        res.render('addRecipe')
    })
    .post((req, res) => {
        if (!req.files) {
            return res.status(400).send("No files Found!");
        }
        let uploadImage = req.files.uploadImage;

        imgur(uploadImage.data).then(data => {
            // Read the post title and plant information from the request body
            let userObject = {

                recipeTitle: req.body.recipeTitle.trim(),
                username: req.body.UserName.trim(),
                userEmail: req.body.userEmail.trim(),
                recipeType: req.body.recipeType,
                Recipe: req.body.Recipe.trim(),
                imageLink: data.link
            }

            if (userObject.Recipe.length < 50) {
                res.send("Enter valid inputs!")
            } else {

                const insertQuery = "Insert into RecipeInfo(recipe_title , recipe_author , recipe_type , recipe_information , recipe_image_reference, recipe_posted_on,recipe_author_email) values($1,$2,$3,$4,$5,NOW(),$6)";

                // Use the client to execute the query with the provided parameters
                client.query(insertQuery, [userObject.recipeTitle, userObject.username, userObject.recipeType, userObject.Recipe, userObject.imageLink, userObject.userEmail], function (err, queryResult) {
                    if (err) {
                        console.log("Error" + err);
                        res.send("something went wrong!")
                    }
                    else {
                        console.log("Data insertion successfull!");
                        // res.send("success")
                        res.render('thankyou')
                    }
                })
            }

        });

        console.log("i got the data");
    })


app.get("/posts/:postId", function (req, res) {

    // Get the logged-in user's detail

    // Get the post ID from the route parameters
    let postId = req.params.postId;
    postId = postId.split("-")[0];

    // Query the database to get the details of the post with the specified ID
    client.query(
        "select * from RecipeInfo where recipe_id = $1",
        [postId],
        function (err, result) {
            // Check for errors
            if (err) {
                // If there was an error, send a server error response
                console.log(err);
                res.status(404).render('error');
            } else {
                // Otherwise, render the posts page with the data received from the database
                if (result.rows.length != 0) {
                    let postResult = result.rows[0];
                    // console.log(result);
                    let shareIntroText = "Found this amazing recipe on The Food Studio Check this out now "
                    shareIntroText = shareIntroText.replace(/\s/g, "%20")
                    let shareDataLink = "http://greenyard.onrender.com/posts/"
                    let shareData = "whatsapp://send?text=" + shareIntroText + shareDataLink + result.rows[0].post_id
                    res.render("posts", { postResult, shareData });
                } else {
                    res.status(404).render('error');
                }
            }
        }
    );

});

app.post("/searchRecipe", (req, res) => {
    let searchQuery = req.body.searchQuery;
    client.query(`Select * from RecipeInfo where lower(recipe_title) like lower('%${searchQuery}%')`, function (err, result) {
        if (err) console.log(err);
        else {
            let recipeDetails = result.rows
            let totalRecipe = result.rowCount
            if (!totalRecipe) totalRecipe = "no"
            res.render('home', { recipeDetails, totalRecipe });
        }
    })
})

app.get("/recipeTypes/:gettype", function (req, res) {
    let recipeType = req.params.gettype.toLowerCase();
    if (recipeType === "all") { res.redirect('/') }
    else {
        let searchQuery = `Select * from RecipeInfo where lower(recipe_type) like lower('%${recipeType}%')`
        client.query(searchQuery, function (err, result) {
            if (err) console.log(err);
            else {
                let recipeDetails = result.rows
                let totalRecipe = result.rowCount
                if (!totalRecipe) totalRecipe = "no"
                res.render('home', { recipeDetails, totalRecipe });
            }
        })
    }
})

app.use((req, res, next) => {
    res.redirect('/')
});

app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});
