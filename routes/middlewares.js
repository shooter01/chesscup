// route middleware to make sure a user is logged in
 function isLoggedIn(req, res, next) {
    //console.log(req.session);
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}


module.exports.isLoggedIn = isLoggedIn;
