const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const auth = require('../middleware/auth.js');

router.use(auth);

// Common middleware
router.use((req, res, next) => {
  res.locals.errors = req.session.errors || {};
  delete req.session.errors;

  res.locals.old = req.session.old || {};
  delete req.session.old;

  next();
});

// Middlewares
function render(req, res) {
  res.render('qa/form');
}

function validation(req, res, next) {
  let { question, answer } = req.body;
  let errors = {};
  req.session.old = req.body;

  if (!question) {
    errors.question = 'Required field';
  }

  if (!answer) {
    errors.answer = 'Required field';
  }

  if (Object.values(errors).length > 0) {
    req.session.errors = errors;
    res.redirect(req.originalUrl);
    return;
  }
  next();
}

function exists(req, res, next) {
  let exists = global.db.get('qa')
    .find({ id: req.params.id })
    .value();

  if (!exists) {
    throw new Error('Not exist');
  }

  res.locals.model = exists;

  if (Object.entries(res.locals.old).length === 0) {
    res.locals.old = exists;
  }

  next();
}

// Index
router.get('/', (req, res) => {
  let items = global.db.get('qa').value();
  res.render('qa/index', {
    items: items
  });
});

// Create
router.get('/create', render);
router.post('/create', validation, (req, res) => {
  let { question, answer } = req.body;

  global.db.get('qa')
    .unshift({
      id: shortid.generate(),
      question: question,
      answer: answer
    })
    .write()
    .then(() => {
      res.redirect('.')
    })
});

// Update
router.get('/update/:id', exists, render);
router.patch('/update/:id', [exists, validation], (req, res, next) => {
  let { question, answer } = req.body

  global.db.get('qa')
    .find({ id: req.params.id })
    .assign({
      question: question,
      answer: answer
    })
    .write()
    .then(() => {
      res.redirect('..')
    })
});

// Delete
router.delete('/:id', exists, (req, res, next) => {
  global.db.get('qa')
    .remove({ id: req.params.id })
    .write()
    .then(() => {
      res.redirect('.');
    });
});

module.exports = router;
