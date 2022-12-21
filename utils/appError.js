class AppError extends Error {
  constructor(message, statusCode) {
    //~super call the parent class constructor passing message prameter.
    //~It sets the message property to our Incomming message.
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor); //'this' is current object.
  }
}

module.exports = AppError;
