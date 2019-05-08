const express = require('express');
const router = express.Router();
const shortid = require('shortid');

router.use((req, res, next) => {
  res.locals.errors = {}
  res.locals.old = req.body
  next();
});

function render(req, res) {
  res.render('register');
}

router.get('/', render);

router.post('/', (req, res, next) => {
  let { errors } = res.locals;
  let { email, password } = req.body;

  // validation
  if (!email) {
    errors.email = 'Required field';
  }

  if (!password) {
    errors.password = 'Required field';
  }

  if (Object.values(errors).length > 0) {
    return next();
  }

  let exists = global.db.get('users')
    .find({ email: email })
    .value()
  if (typeof exists !== 'undefined') {
    res.locals.errors.email = 'Has already exists';
    return next();
  }

  // create user
  let id = shortid.generate();
  global.db
    .get('users')
    .push({
      id: id,
      email: email,
      password: password
    })
    .write()
    .then(() => {
      req.session.user = id;
      res.redirect('/');
    })

}, render)

module.exports = router;
