const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

// Database instance
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const adapter = new FileAsync(
  path.join(__dirname, '../db/data.json')
);
const db = low(adapter);

db.then(database => {
  database.defaults({
  }).write();
})


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});

