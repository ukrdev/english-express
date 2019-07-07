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

function getNotes() {
  return global.db.get('notes');
}

function exists(req, res, next) {
  const { id } = req.params;

  let exists = getNotes().find({ id }).value();

  if (!exists) {
    throw new Error('Not exist');
  }

  if (Object.entries(res.locals.old).length === 0) {
    res.locals.old = Object.assign({}, exists);
  }

  res.locals.model = exists;

  next();
}

function validation(req, res, next) {
  let { title, content } = req.body;

  let errors = {};

  req.session.old = req.body;

  if (!title) {
    errors.title = 'Required field';
  }

  if (!content) {
    errors.content = 'Required field';
  }

  if (Object.values(errors).length > 0) {
    req.session.errors = errors;
    res.redirect(req.originalUrl);
    return;
  }

  next();
}

router.get('/', (req, res) => {
  const notes = getNotes().value();

  res.render('notes/index', {
    notes,
  })
});


// Create
router.get('/create', (req, res) => {
  res.render('notes/create');
});
router.post('/create', [validation], (req, res) => {
  const { title, content } = req.body;
  const id = shortid.generate();

  const notes = getNotes();

  notes
    .unshift({ id, title, content })
    .write()
    .then(() => res.redirect('.'));
});


// Update
router.get('/edit/:id', exists, (req, res) => {
  res.render('notes/edit');
});
router.patch('/edit/:id', [exists, validation], (req, res) => {
  const { title, content } = req.body
  const { id } = req.params;

  const notes = getNotes();

  notes
    .find({ id })
    .assign({ title, content })
    .write()
    .then(() => res.redirect('..'));
});


// Delete
router.delete('/delete/:id', exists, (req, res, next) => {
  const { id } = req.params;

  const notes = getNotes();

  notes
    .remove({ id })
    .write()
    .then(() => res.redirect('..'));
});

module.exports = router;
