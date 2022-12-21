const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

function generateJWT(id) {
  return new Promise((resolve, reject) => {
    // signing jwt requires key , secret , payload(data)
    jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
}

const createSendToken = catchAsync(async (user, statusCode, res) => {
  const token = await generateJWT(user._id);
  const cookieOptions = {
    expires: new Date( // 90 * hrs * mins * sec* milliseconds = 90days
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //cookies will be only send to an encrypted connection.
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  //Adding cookie to response.
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // console.log('login middleware');
  const { email, password } = req.body;

  //1) check if email and password exists.
  if (!email || !password) {
    //creating error and passing it to globalErrorHandler.
    return next(new AppError('Please Provide email and password.', 400));
  }

  //2) check if user eixsts and password is correct.
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect password or email.', 401));
  }

  //3) If everything is ok send token to user.
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  // console.log('logout middleware');
  res.cookie('jwt', 'loggout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //*1) Getting token & check if its there.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //spliting header with space and removing bearer from it.
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(`token ${token}`);
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get accesss', 401) //401 statnds for unauthorized .
    );
  }
  //*2) Verification of token .
  //bottom promissify comment is a full code.
  /*const verify = promisify(jwt.verify);
  verify(token, process.env.JWT_SECRET).then().catch()*/
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //*3) Check if user Still exists.
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The User belonging to the token no longer exists', 401)
    );
  }
  //*4) Check if user changed password after token was issued.
  //'iat' is issued at date of JWT.
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;

  //if all ok it Grant access to protected route.
  next();
});

exports.isLogedIn = async (req, res, next) => {
  //*1) Getting token & check if its there.

  let token;
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;

      // console.log(`token ${token}`);
      if (!token) {
        return next();
      }
      //*2) Verification of token .
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      //*3) Check if user Still exists.
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // console.log(freshUser.name);
      //*4) Check if user changed password after token was issued.
      //'iat' is issued at date of JWT.
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //There is a logged in user.
      //^res.locals.variableName : Passing data to templates.
      res.locals.user = freshUser;
      //if all ok it Grant access to protected route.
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      //403: Forbidden.
      return next(
        new AppError('You dont have permission to perfrom this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //*1) Get user based on Posted email.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('No user found with this email', 404) //404: Not Found.
    );
  }
  //*2) Generate the random reset token.
  const resetToken = user.createPasswrodResetToken();
  await user.save({ validateModifiedOnly: true });

  //*3) Send it to user's email.

  try {
    //protocol means https , http etc. & host means hostname.
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordRest();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //*1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // console.log(`user ${user}`);

  //*2) If token is not expired & there is user , set new password
  if (!user) return next(new AppError('Token is invalid or expired', 400));
  // console.log(user);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //*3) Update changePassword field for the user.
  // we created a pre hook for that.
  //*4) Log the user in and send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //*1) Get user from collection.
  //we getting user from protect middleware as it cheks if the user has jwt & its verified & then
  //query that user with help of decoded jwt's id and manually ads user to req.
  const user = await User.findById(req.user.id).select('+password');

  //*2) Check if posted password is correct.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }
  //*3) If so , update the password.
  user.password = req.body.password;
  user.passwordConfirm = req.body.confirmPassword;
  await user.save();

  //*4) Log in user send jwt.
  createSendToken(user, 200, res);
});
