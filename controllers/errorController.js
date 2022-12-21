const AppError = require('../utils/appError');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const handleJsonWebTokenError = () =>
  new AppError('Invalid Token Please log in again.', 401);

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Please correct the following errors: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: ${value}. Use another value.`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  //400 bad request
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  //Api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED WEBSITE
  console.error('Error 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    //Operational , trusted error: send message to client.
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //Programming or other unknown error:don't leak error details.
    //1) Log erro.
    console.error('Error 💥', err);
    //2) send generic message.
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
  //RENDERED WEBSITE .
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //Programming or other unknown error:don't leak error details.
  //1) Log erro.
  console.error('Error 💥', err);
  //2) send generic message.
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //~It will assing request erro statusCode if present or
  //~assign 500(Internal Server Error)
  err.status = err.status || 'fail';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error); //ex:for wrong id
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); //ex:for same name as it must be unique.
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error); //data field validation's erros set in model.
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
