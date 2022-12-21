const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

//*multer configuration.
//Setting image Storage to Disk.
/*const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
}); */

//^Image should always be stored as a buffer before image processing like resizing.
const multerStorage = multer.memoryStorage(); //it stores image to memory / buffer.

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! Please upload only images', 400), false);
  }
};

//upload is to define some settings ex specifying destination for storing images
//then we use upload to create a middleware to upload the file .
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
//upload.single used for only single file 'photo' is the
//name of the field which is going to hold the file
exports.uploadUserPhoto = upload.single('photo');

//Resizing Image.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //reading the file from buffer.
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

//^NOTE:"...args" known as rest parameters for taking and array of parameters at once.
const filterObj = (obj, ...allowedFields) => {
  //Object.keys() This will return an array of keys name & then we user forEach for looping them.
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Users route handlers.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) create error if user post password data.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update . Please use /updateMyPassword',
        400
      )
    );
  }

  //2) Filtered out unwanted fields that are not allowed to be updated.
  const filterBody = filterObj(req.body, 'name', 'email');
  //if req has file It adds file to filterBody Object.
  if (req.file) filterBody.photo = req.file.filename;

  //3) update user doccument.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  //204 is for deleted.
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  //500 is for internal server error.
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please user /singnup instead.',
  });
};
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

//Do not update password with this handler.
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.params.id });

  if (bookings.length === 0)
    return next(new AppError('No Bookings found', 204));

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});
