const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const authMiddleware = require('../middleware/auth.js');

const STATUS_PASSING = 1;
const STATUS_DONE = 2;


router.use(authMiddleware);

router.use((req, res, next) => {
  res.locals.errors = req.session.errors || {};
  delete req.session.errors;
  next();
})

router.post('/start', (req, res, next) => {
  const { db } = global;

  let exists = db.get('exams')
    .find({
      user_id: req.session.user,
      status: STATUS_PASSING
    })
    .value();

  if (exists) {
    res.redirect('.');
    return;
  }

  next();
}, (req, res) => {
  const { db } = global;
  let { tags } = req.body;

  tags = Array.isArray(tags)
    ? tags
    : (!!tags ? [tags] : []);

  let id = shortid.generate();
  db.get('exams')
    .unshift({
      id: id,
      user_id: req.session.user,
      status: STATUS_PASSING,
      tags: tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      score: {
        total: '?',
        correct: '?'
      }
    })
    .write()
    .then(() => {

      let tickets = db.get('tickets').value()
        .filter(ticket => {
          if (!tags.length) {
            return true;
          }
          for (let i = 0; i < ticket.tags.length; i++) {
            if (tags.indexOf(ticket.tags[i]) !== -1) {
              return true;
            }
          }
          return false;
        })
        .sort(() => Math.random() - 0.5)
        .map(ticket => {
          return {
            id: shortid.generate(),
            exam_id: id,
            ticket_id: ticket.id,
            question: ticket.question,
            correct_answer: ticket.answer,
            user_answer: null,
            is_correct: null,
          };
        });

      db.get('exam_tickets')
        .push(...tickets)
        .write()
        .then(() => {
          res.redirect('.');
        });
    });
});

function exam (req, res, next) {
  const { db } = global;

  let exam = db.get('exams')
    .find({
      user_id: req.session.user,
      status: STATUS_PASSING
    })
    .value();

  if (!exam) {
    res.redirect('/');
    return;
  }

  res.locals.exam = exam;

  next();
}

function ticket (req, res, next) {
  const { db } = global;
  let { exam } = res.locals;

  let ticket = db.get('exam_tickets')
    .find({
      exam_id: exam.id,
      is_correct: null
    })
    .value();

  if (!ticket) {
    db.get('exams')
      .find({ id: exam.id })
      .assign({
        status: STATUS_DONE,
        updated_at: new Date().toISOString(),
        score: {
          total: db.get('exam_tickets')
            .filter({ exam_id: exam.id })
            .size(),
          correct: db.get('exam_tickets')
            .filter({ exam_id: exam.id, is_correct: true })
            .size()
        }
      })
      .write()
      .then(() => {
        res.redirect('/')
      })
    return;
  }

  res.locals.ticket = ticket;

  next();
}

router.get('/', [exam, ticket], (req, res) => {
  res.render('exam/ticket');
})

router.post('/answer', [exam, ticket], (req, res, next) => {
  let { answer } = req.body;

  if (!answer) {
    req.session.errors = {
      answer: 'Required field'
    };
    res.redirect('.');
    return;
  }

  next();
}, (req, res) => {
  const { db } = global;
  let { exam, ticket } = res.locals;
  let { answer } = req.body;

  let isCorrect = answer.toLowerCase() === ticket.correct_answer.toLowerCase();

  db.get('exam_tickets')
    .find({
      id: ticket.id
    })
    .assign({
      user_answer: answer,
      is_correct: isCorrect
    })
    .write()
    .then(() => {
      res.redirect('.');
    });
})

router.get('/:id', (req, res, next) => {
  const { db } = global;

  let exam = db.get('exams')
    .find({ id: req.params.id })
    .value();

    if (!exam) {
      throw new Error('Exam not found');
    }

    next();
}, (req, res) => {
  const { db } = global;

  const tickets = db.get('exam_tickets')
    .filter({
      exam_id: req.params.id
    })
    .value();

  res.render('exam/view', {
    tickets: tickets
  });
})

module.exports = router;
