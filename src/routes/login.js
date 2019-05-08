const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
  res.locals.errors = {}
  res.locals.old = req.body;
  next();
});

function render(req, res) {
  res.render('login');
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
    .find({ email: email, password: password })
    .value();

  if (typeof exists === 'undefined') {
    errors.email = 'User does not exist';
    return next();
  }

  req.session.user = exists.id

  res.redirect('/');
}, render);

module.exports = router;
