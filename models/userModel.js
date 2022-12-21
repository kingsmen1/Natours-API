const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    reqruired: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    requried: [true, 'please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid Email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //^ NOTE: "{ select : false }"means the field will not be queried from the database at all.
    //^ Thus, you cannot have access to it inside the method unless you specifically override that setting.
    //^ ex: User.findById(req.user.id).select('+password');
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //^NOTE: Custom validators only work on CREATE &  SAVE!!.
      validator: function (value) {
        return value === this.password;
      },
      message: `Pawword's does not match`,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  //we only runs this function if the password is upddated.
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12.
  this.password = await bcrypt.hash(this.password, 12);

  //Delete passwordConfirm field.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//*Setting the passwordChangedAt property for resetPassword controller.
userSchema.pre('save', function (next) {
  //"isModified" checks if the field has changed since the last save operation.
  //"isNew" cheks if the documents is being saved for first time.
  if (!this.isModified('password') || this.inNew) return next();
  // &subtracting date by 1 sec so the jwt createdAt time should be in future.
  // & because login wont work as the password is changed after jwt is issued.
  this.passwordChangedAt = Date.now();
  next();
});

//*Instance methods will be available on all User docs.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //compare will give true if the password is matched.
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTtimeStamp) {
  if (this.passwordChangedAt) {
    //get time will convert the date from '2022-09-26T00:00:00.000Z' to '1664150400000' milliseconds
    //and then dividing by 1000 to convert it to seconds.
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTtimeStamp);
    //if jwttimeStamp is lower than changedTimeStamp it means passsword changed.
    return JWTtimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswrodResetToken = function () {
  //'32' is length of String , 'hex' is format for String.
  //Creating a random String .
  const resetToken = crypto.randomBytes(32).toString('hex');
  //encypting it to store it in server.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //Creating a Expiry time for password.
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
