var path = require('path');
var router = require('express').Router();
var mongoose = require('mongoose');
var serverConfig = require('../config.js');
var multiparty = require('connect-multiparty')();
var fs = require('fs');
var Gridfs = require('gridfs-stream');
var pdfJsLib = require('pdfjs-dist');
var PDFDocument = require('pdfkit');
var stream = require('./stream');
var AWS = require('aws-sdk');
var busBoy = require('busboy');
var serverConfig = require('../config.js');

const BUCKET_NAME = serverConfig.BUCKET_NAME;
const IAM_USER_ID = serverConfig.IAM_USER_ID;
const IAM_USER_KEY = serverConfig.IAM_USER_KEY;

var jwt = require('jsonwebtoken');


var User = require('../models/user');
var File = require('../models/file');

/*router.use(function(req, res, next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token){
        token = token.headers.Authorization[0].split(' ')[1];
        jwt.verify(token, serverConfig.secret, function(err, decoded){
            if(err){
                return res.status(403).json({
                    message: "Failed to authenticate the token!"
                });
            }else{
                req.decoded = decoded;
                next();
            }
        })

    } else{
        res.status(403).send({
            success: false,
            msg: "no token was provided"
        })
    }
})*/

/*var conn = mongoose.createConnection('localhost', 'braintext', 27017);
var gf = Gridfs(conn.db, mongoose.mongo);*/

router.get('/test', function(req, res){
    User.findOne({
        _id: "5a4f8f6be05b397c87112fcb"
    }, function(err, user){
        if(err) res.json(err);
        var filepath = __dirname+"/tmp/Oskar-Martin-UUS1516822351706.pdf";
        res.json(filepath);
    })
})
router.post('/download', function(req, res){
    console.log("downloadi initiated");
    console.log(req.body.fileName);
    var filePath = "/tmp/"+req.body.fileName;
    res.download(__dirname + filePath);

})
/*router.post('/addhighlighted', function(req, res){

    var conn = mongoose.createConnection('localhost', 'braintext', 27017);
    var gf = Gridfs(conn.db, mongoose.mongo);
    var highlightedSentences;
    console.log(req.body.number);
    conn.once('open', function(){
        gf.findOne({filename: req.body.filename}, function(err, file){
            if(err) console.log("err -> ", err);
            console.log(file.metadata.highlighted);

            highlightedSentences = file.metadata.highlighted;

            var newHigh = highlightedSentences.concat(req.body.number);
            var unique = newHigh.filter(function(elem, index, self){
                return index === self.indexOf(elem);
            })

            gf.files.update({
                filename: req.body.filename
            },
            {$set: {'metadata.highlighted': unique}}, function(){
                res.status(200).json({
                    msg: "highlighted sentences are added to the file"
                })
            });
        })


    })
})*/
router.post('/byid', function(req, res){
    User.findOne({
        _id:req.body.id
    }, function(err, user){
        if(err) res.status(500).json(err);
        res.status(200).json(user);
    })
})
router.post('/getlastfile', function(req, res){
    User.findOne({
        _id: req.body.userId
    }, function(err, user){
        if(err) res.status(500).json(err);
        res.status(200).json(user.lastFile);

    })
})
router.post('/addlastfile', function(req, res){
    User.update({
        _id: req.body.userId
    },
    {
        $set: {lastFile: req.body.lastFile}
    }, function(err){
        if(err) res.status(500).json(err);
        res.status(200).json({
            msg: "succesfully updated lastfile",
            fileName: req.body.lastFile
        })
    })
})
router.post('/updateuser', function(req, res){
    User.findByIdAndUpdate(req.body.id,
        {$set: {
            email: req.body.email,
        }}, {new: true}, function(err, user){
            if(err) res.status(500).json(err);
            res.status(200).json(user);
        })
})
router.get('/getusers', function(req, res){
    User.find(function(err, users){
        if(err) res.status(500).json(err);
        res.status(200).json(users);
    })
})



router.post('/getupload', function(req, res){
    console.log("get upload request -> ", req.body.filename);
    File.findOne({
      filename: req.body.filename
    }, function(err, file){
      if(err) res.status(500).json({err: err});
      res.status(200).json({
        path: req.body.filename
      })
    })
})

router.post('/deletefile', function(req, res){
    deleteFileFromUser(req.body.fileId, req.body.userId, req.body.filename).then(function(data){
        res.status(200).json(data);
    }, function(err){
        res.status(500).json({
            err: "there went something wrong deleting file from the user"
        })
    });
})
router.post('/getalluserfiles', function(req, res){
    User.findOne({
        _id: req.body.userId
    }, function(err, user){
        if(err) res.status(500).json(err);
        res.status(200).json(user.userFiles);
    })
})
router.post('/getuserarchives', function(req, res){
    User.findOne({
        _id: req.body.userId
    }, function(err, user){
        if(err) res.status(500).json(err);
        res.status(200).json(user.archiveFiles.slice(0,4));
    })
})
router.post('/getalluserarchives', function(req, res){
    User.findOne({
        _id: req.body.userId
    }, function(err, user){
        if(err) res.status(500).json(err);
        res.status(200).json(user.archiveFiles);
    })
})
router.post('/getuserfiles', function(req, res){

    User.findOne({
        _id: req.body.userId
    }, function(err, user){
        if(err) res.status(500).json(err);
        console.log(user.userFiles.reverse());
        res.status(200).json(user.userFiles.slice(0,4));

    })
})
var getName = function(id){
    console.log("this is the id -> ", id);
    var conn = mongoose.createConnection('127.0.0.1', 'braintext', 27017);
    var gf = Gridfs(conn.db, mongoose.mongo);

    gf.files.find({
        _id: id
    }).toArray(function(err, files){
        console.log("tulen siia sisse ! ");
    })

}

router.post('/savearchive', function(req, res){

    var doc = new PDFDocument();
    var filename = req.body.filename;
    var content = req.body.content;
    var newFileName = req.body.filename.split('.')[0] + Date.now() + ".pdf";
    var path = __dirname + "/tmp/"+ newFileName ;
    var wstream = fs.createWriteStream(path);

    console.log("this is saveArchive filename -> ", req.body.filename);


    doc.pipe(wstream);
    doc.y = 300;
    doc.text(content, 100, 100);
    doc.end();

    var conn = mongoose.createConnection('127.0.0.1', 'braintext', 27017);
    var gf = Gridfs(conn.db, mongoose.mongo);

    conn.once('open', function(){
        console.log("connection open! ");
        console.log("this is newfilename -> ", path)
        var source = fs.createReadStream(__dirname + "/tmp/"+ newFileName);
        var target = gf.createWriteStream({
            filename: newFileName,
            contentType: req.body.filename.split('.')[1],
            metadata: {
                highlighted: [],
                originalName: req.body.filename
            }
        })
        source.pipe(target);
        target.on('close', function(file){
            addArchiveToUser(newFileName,filename, req.body.userId);
            res.status(200).json(file);
            conn.close(function(){
                console.log("connection is closed now");
            })
        })
    })


})
router.post('/uploadaws', function(req, res){
  var element1 = req.body.element1;
  var bb = new busBoy({headers: req.headers})

  bb.on('finish', function(){
    var file = req.files.file;
    var splitArray = req.files.file.name.split('.')
    var dateNow = Date.now();
    var filename = serverConfig.bucket + splitArray[0] + dateNow +'.'+ splitArray[1];
    var filenameForAWS = splitArray[0] + dateNow +'.'+ splitArray[1];
    var originalName = req.files.file.name
    console.log(file);
    uploadToS3(file, filenameForAWS).then(function(data){
      console.log(data);
      addFileToUser(filename,originalName, req.query.userId);
      res.status(200).json({
        url: data
      })
    }, function(err){
      res.status(400).json({
        err: err
      })
    })
  })
  req.pipe(bb);
})

function addFileToUser(newfilename, originalfilename, userId){

    var userfiles = {originalName: originalfilename, databaseName: newfilename};

    console.log(userfiles);

    User.findOne({_id: userId},function(err, user){
        if(err) return false;
        console.log(user);
        user.userFiles.push(userfiles);
        user.save();
        return true;
    })
}
function addArchiveToUser(archivefilename, originalname, userId){
    var archivefiles = {originalName: originalname, databaseName: archivefilename};
    User.findOne({_id: userId}, function(err, user){
        if(err) return false;
        user.archiveFiles.push(archivefiles);
        user.save();
        return true;
    })
}

var deleteFileFromUser = function(fileId, userId, file){
    return new Promise(
        function(resolve, reject){
            User.findOne({
                _id: userId
            }, function(err, user){
                if(err) reject(err);
                var files = user.userFiles;
                var index = files.indexOf(fileId);
                files.splice(index, 1);
                user.userFiles = files;
                user.save(function(err, updatedUser){
                    if(err) reject(err);
                    //resolve(updatedUser);

                    gf.remove({
                        filename: file
                    }, function(err){
                        if(err) reject(err);
                        resolve(updatedUser);
                    })
                })
            })
        }
    )
}
var uploadToS3 = function(file, filename) {
  return new Promise(
    function(resolve, reject){
      var s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_ID,
        secretAccessKey: IAM_USER_KEY,
        Bucket: BUCKET_NAME
      });
      s3bucket.createBucket(function () {
        console.log("bucket loodi!");
        var params = {
          Bucket: BUCKET_NAME,
          Key: filename,
          Body: file.data,
          ACL: 'public-read'
        };
        s3bucket.upload(params, function(err, data){
          console.log("upload käivitus");
          if(err){
            console.log(err);
            reject(err);
          }
          console.log("upload good!")
          console.log(data);
          console.log(data.Location);
          resolve(data.Location);
        })
      })
    }
  )
}
var getConnDb = function () {
        var connDb;
        mongoose.connection.then(function (conn) {
            connDb = conn.db;
        });
        while (connDb === undefined) {
            deasync.runLoopOnce();
        }
        return connDb;
};
module.exports = router;
