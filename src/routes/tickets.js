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

  res.locals.previous_tags = req.session.previous_tags || false;

  next();
});

// Middlewares
function render(req, res) {
  res.render('tickets/form');
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
  let exists = global.db.get('tickets')
    .find({ id: req.params.id })
    .value();

  if (!exists) {
    throw new Error('Not exist');
  }

  res.locals.model = exists;

  if (Object.entries(res.locals.old).length === 0) {
    res.locals.old = Object.assign({}, exists);
    res.locals.old.tags = global.db.get('tags')
      .filter(tag => {
        return exists.tags.indexOf(tag.id) !== -1;
      })
      .map(tag => tag.name)
      .value()
      .join(', ');
  }

  next();
}

// Index
router.get('/', (req, res) => {
  let items = global.db.get('tickets').value();
  let tags = global.db.get('tags').value();
  res.render('tickets/index', {
    tags: tags,
    items: items
  });
});

// Search
router.get('/search', (req, res) => {
  let tickets = global.db.get('tickets')
    .filter(ticket => {
      return ticket.question.toLowerCase().indexOf(req.query.q.toLowerCase()) !== -1;
    })
    .take(5)
    .value();
  let tags = global.db.get('tags').value();
    res.json(tickets.map(ticket => {
      ticket.tagLabels = ticket.tags.map(tag => {
        return tags.find(t => {
          return t.id === tag;
        }).name;
      })
      return ticket;
    }));
})

function inputTags(req, res, next) {
  let { tags } = req.body;
  let dbTags = global.db.get('tags').value();

  res.locals.tags = tags.split(',')
    .map(t => t.trim())
    .filter(t => !!t)
    .map(inputTag => {
      let dbTag = dbTags.find(dbTag => {
        return dbTag.name.toLocaleLowerCase() === inputTag.toLowerCase();
      });

      if (typeof dbTag !== 'undefined') {
        return dbTag.id;
      }

      let id = shortid.generate();
      global.db.get('tags')
        .unshift({
          id: id,
          name: inputTag
        })
        .write()
        .then(() => {});

      return id;
    });

  next();
}

// Create
router.get('/create', render);
router.post('/create', [validation, inputTags], (req, res) => {
  let { question, answer, save_previous_tags, tags } = req.body;

  if (save_previous_tags) {
    req.session.previous_tags = tags;
  } else if ('previous_tags' in req.session) {
    delete req.session.previous_tags;
  }

  global.db.get('tickets')
    .unshift({
      id: shortid.generate(),
      question: question,
      answer: answer,
      tags: res.locals.tags
    })
    .write()
    .then(() => {
      res.redirect('.')
    })
});

// Update
router.get('/update/:id', exists, render);
router.patch('/update/:id', [exists, validation, inputTags], (req, res, next) => {
  let { question, answer } = req.body

  global.db.get('tickets')
    .find({ id: req.params.id })
    .assign({
      question: question,
      answer: answer,
      tags: res.locals.tags
    })
    .write()
    .then(() => {
      res.redirect('..')
    })
});

// Delete
router.delete('/:id', exists, (req, res, next) => {
  global.db.get('tickets')
    .remove({ id: req.params.id })
    .write()
    .then(() => {
      res.redirect('.');
    });
});

module.exports = router;
