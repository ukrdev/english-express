module.exports = function (req, res, next) {
  if (res.locals.isGuest) {
    return res.redirect('/login');
  }
  next();
};
