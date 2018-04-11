var User = require('../models/user');

var passport = require('passport');
var passportLocalStrategy = require('passport-local');
var jwt = require('jsonwebtoken');
var serverConfig = require('../config.js');

var localOptions = {
    usernameField: 'username'
}

var sessionUserData = function(userObject, token){
    return{
        id: userObject._id,
        username: userObject.username,
        token: token,
        firstname: userObject.firstname,
        lastname: userObject.lastname
    }
}
var modifyUserDataForToken = function(userObject){
    return{
        id: userObject._id,
        username: userObject.username,
        role: userObject.role
    }
}

exports.authStrategy = new passportLocalStrategy(localOptions, function(username, password, done){
    User.findOne({username:username}, function(err, user){
        if(err) return done(err, false);
        if(!user){
            return done(null, false, {error:"user doesnt excist"});
        }
        user.comparePasswords(password, function(err, isMatch){
            if(err) return done(err);
            if(!isMatch){
                return done(null, false, { error: 'Your login details are wrong!'});
            }
            var sessionToken = jwt.sign({data: modifyUserDataForToken(user)}, serverConfig.secret, {
                expiresIn: 10080
            })
            return done(null, sessionUserData(user, sessionToken));
        })

    })
})

exports.authSerializer = function(user, done){
    done(null, user.id)
}
exports.authDeserializer = function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    })
}
