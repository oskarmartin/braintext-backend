var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');


var User = new Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    firstname:{
        type: String,
        required: true
    },
    lastname:{
        type: String,
        required: true
    },
    username: {
        type: String,
        lowercase: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    lastFile: {
        type:String,
        default: ""
    },
    userFiles: [{
        originalName: String,
        databaseName: String
    }],
    archiveFiles: [{
        originalName: String,
        databaseName: String
    }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
})
User.pre('save', function(next){
    var user = this;

    if(!user.isModified('password')) return next();
    bcrypt.genSalt(256, function(err, salt){
        if(err) return next(err);
        bcrypt.hash(user.password, salt, null, function(err, hash){
            if(err) return next(err);
            user.password = hash;
            next();
        })


    })
})
User.methods.comparePasswords = function(candidatePassword, cb){
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
        console.log("isMatch boolean -> ", isMatch);
        if(err) return cb(err);
        else{
            cb(null, isMatch);
        }

    })
}


module.exports = mongoose.model('user', User);
