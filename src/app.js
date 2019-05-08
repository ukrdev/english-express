const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// Database instance
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const adapter = new FileAsync(
  path.join(__dirname, '../db/data.json')
);
const db = low(adapter);

db.then(database => {
  global.db = database

  database.defaults({
    users: []
  }).write();
})


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use((req, res, next) => {
  res.locals.isGuest = !req.session.user;
  next();
})

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/register', require('./routes/register.js'));
app.use('/login', require('./routes/login.js'));

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});

