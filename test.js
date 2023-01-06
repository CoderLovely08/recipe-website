const pg = require('pg');



const client = new pg.Client("postgres://wmrtdiic:HupTLf3Hy1WMhDQ2j1-nI6SvwsGXYcY5@tiny.db.elephantsql.com/wmrtdiic")

client.connect();

let userObject = {

    recipeTitle: "test",
    author: "test",
    userEmail: "test",
    recipeType: "test",
    Recipe: "test",
    imageLink: "data.link"
}
let searchQuery = "paneer"
client.query(`Select * from RecipeInfo `,function (err, result) {
    if (err) console.log(err);
    else console.log(result);
})