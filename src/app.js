const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const methodOverride = require('method-override');

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
    exams: [],
    exam_tickets: [],
    tags: [],
    tickets: [],
    users: []
  }).write();
})


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    maxAge: 60 * 60 * 24 * 365 * 1000
  },
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))
app.use(methodOverride(function (req, body) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    let { _method } = req.body;
    delete req.body._method;
    return _method;
  }
}));

app.use((req, res, next) => {
  res.locals.isGuest = !req.session.user;
  next();
})

app.get('/', (req, res) => {
  let exams = global.db.get('exams')
    .filter({ user_id: req.session.user })
    .value();
  let tags = global.db.get('tags')
    .value();

  res.render('index', {
    tags: tags,
    exams: exams
  });
});

app.use('/tickets', require('./routes/tickets.js'));
app.use('/exam', require('./routes/exam.js'));
app.use('/register', require('./routes/register.js'));
app.use('/login', require('./routes/login.js'));
app.get('/logout', (req, res) => {
  req.session.regenerate(function(err) {
    res.redirect('/login');
  })
})

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});

