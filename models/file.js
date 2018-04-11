var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var File = new Schema({
  path: {
    type: String
  },
  filename: {
    type: String
  },
  highlighted: {
    type: [String],
    default: []
  }
})
module.exports = mongoose.model('file', File);
