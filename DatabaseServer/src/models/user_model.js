/* eslint-disable consistent-return */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  // email: { type: String, unique: true, lowercase: true },
  username: { type: String, unique: true, lowercase: true},
  password: { type: String },
  name: { type: String },

}, {
  toObject: { virtuals: true },
  toJSON: {
    virtuals: true,
    transform(doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
  timestamps: true,
});

UserSchema.pre('save', function beforeUserSave(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  // TODO
  // eslint-disable-next-line global-require
  const bcrypt = require('bcryptjs');
  bcrypt.genSalt(10, function (err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword, callback) {
  const user = this;
  // eslint-disable-next-line global-require
  const bcrypt = require('bcryptjs');
  bcrypt.compare(candidatePassword, user.password, function (error, result) {
    if (error) return callback(error);
    return callback(null, result);
  });
};

// create UserModel class from schema
const UserModel = mongoose.model('User', UserSchema);


export default UserModel;
