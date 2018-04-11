var User = require('../models/user.js');
var express = require('express');
var router = express.Router();
var passport = require('passport');

var fs = require('fs');
var pdfJsLib = require('pdfjs-dist');
var pdf = '/Users/Oskar/Desktop/Projektid/braintext-react/server/routes/test.pdf';

router.post('/login', function(req, res, next){
    console.log("this is the req body -> ", req.body);
    passport.authenticate('local', function(err, user, info){
        if(err){
            return res.status(500).json({
                err: "something went wrong in the server side, while comparing your passwords"
            })
        }
        req.logIn(user, function(err){
            if(err){
                console.log(err);
                return res.status(401).json({
                    err: "User details provided were wrong!"
                })
            }
            console.log("this is the login");
            console.log(user);
            return res.status(200).json({
                msg: "login was successful",
                token: user.token,
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname
            })
        })
    })(req, res, next);
})

router.post('/register', function(req, res){
    console.log("register here!");
    console.log(req.body.username);
    console.log(req.body.password);
    console.log(req.body.email);
    console.log(req.body.firstname);
    console.log(req.body.lastname);
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;

    if(!username){
        return res.status(500).json({
            err: "username was not provided"
        })
    }
    if(!password){
        return res.status(500).json({
            err: "password was not provided"
        })
    }
    if(!email){
        return res.status(500).json({
            err: "email was not provided"
        })
    }
    User.findOne({email:email}, function(err, existingUser){
        if(err) return res.status(500).json({err: err});
        if(existingUser){
            return res.status(500).json({
                err: "user with this email already in DB"
            })
        }


        var user = new User ({
            username: username,
            email: email,
            password: password,
            firstname: firstname,
            lastname: lastname
        });
        console.log("this is user -> ", user);
        user.save(function(err, user){
            if(err) return res.status(500).json({err:err});
            res.status(200).json({
                msg: "user was registered",
                user: user
            })
        })
    })
})

module.exports = router;
