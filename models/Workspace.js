var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkspaceSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

var Workspace = mongoose.model('Workspace', WorkspaceSchema);

module.exports = Workspace;