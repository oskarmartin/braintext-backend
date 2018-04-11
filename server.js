var app = require('./app.js');
var path = require('path');

var port = 8000;
app.listen(port, function(){
    console.log('app is working on port ', port);
    console.log(path.join(__dirname, '/routes/tmp'));
})
