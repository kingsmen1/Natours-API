const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

//!Middleware
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! Please upload only images', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
//config for uploading just a single field of an array of images
// upload.array('images', 5);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1) Cover Image.
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //2:3 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
});

//! Handlers. / Controllers.
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  //aggregate takes a list of stages & each stage is an object.
  const stats = await Tour.aggregate([
    {
      $match: {
        //match is used to select or filter docs.
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        //It allows us to group object's using accumulators-
        //-And an accumulator is for ex, calculating an average-
        //-So if we have five tours, each of them has a rating,-
        //-we can then calculate the average rating using group
        //ex-loop iterates for easy.length etc.
        _id: { $toUpper: '$difficulty' }, //grouping docs as per different fields
        //sum adds 1 for each aggrigation/loop.& counts the toursLength.
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRaging: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      //NOTE: we can only sort but upper variables of aggregation piperline ex:minPrice.
      $sort: {
        avgPrice: 1, //1 is used to sort it in ascending.
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMontlyPlan = catchAsync(async (req, res, next) => {
  // console.log(req.params.year);

  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      //unwind deconstruct an array field from the info documents
      // and then output one document for each element of the array
      $unwind: '$startDates',
    },
    {
      //getting tours of year 2021.
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      //calculating tours in a specific month.
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        //by push we storing the name of tour which passes through the pipeline.
        tours: { $push: '$name' },
      },
      // $group: {
      //   _id: { $month: '$startDates' },
      //   numTourStarts: { $sum: 1 },
      //   tours: { $push: '$name' },
      // },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      //project removes the given variable.if given 0 ;
      $project: {
        _id: 0,
      },
    },
    {
      //sorting from descending.
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'Success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  //radius is basically the distance that we want to have as the radius,
  //but converted to a special unit called "radians". And in order to get the "radians",
  //we need to divide our distance by the radius of the earth.
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  // console.log(distance, lat, lng, unit);
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: tours,
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distances', //Its the name for the variable.
        distanceMultiplier: multiplier, // By default it gives distance in meters.
      },
    },
    {
      $project: {
        distances: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    results: distances.length,
    data: distances,
  });
});

exports.getBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ tour: req.params.id });
  if (bookings.length === 0)
    return next(new AppError('No bookings with this tour', 204));
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});
