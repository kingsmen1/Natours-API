const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      //^NOTE: REQUIRED IS ONLY REQUIRED FOR INPUT NOT FOR STORING IT IN DB.
      required: [true, 'A tour must have a name'],
      unique: true, // this tells the value should be unique,
      trim: true,
      maxlength: [40, 'A Tour must have less or euqals to 40 characters'],
      minlength: [10, 'A Tour must be atleast 10 characters'],
      //^ NOTES:isAplha's comming from package validator which being used for checking is only alphabets.
      // validate: [validator.isAlpha, 'A name contain only alpahabets'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //enum only works on Strings.
      enum: {
        values: ['difficult', 'easy', 'medium'],
        message: 'Difficulty is either: easy , medium , difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.6,
      //min , max can also work with dates.
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //set is fired each time the value is set to this field.
      set: (val) => Math.round(val * 10) / 10, //4.66666 ,46.6666, 47 , 4.7.
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      //validator return a bool validate must return true;
      validate: {
        validator: function (val) {
          //^ NOTE:'this' always point to the current doc on NEW document creation.
          return val < this.price;
        },
        //'{VALUE} is receaved from validator method without $'
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      //trim is used on String to remove white-spaces in start & end .
      trim: true,
      required: [true, 'A tour must have a Summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a Image Cover'],
    },
    images: [String], //Defining an array of Strings.
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // this hides the field from user.
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON.
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        //^"mongoose.Schema.ObjectId" is used for creating reference for differnet object's.
        type: mongoose.Schema.ObjectId,
        //^"ref" is used for refering a different data set.ex:User.
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//*Index: Indexing a property .
//without index if we use sorting the query has to scan all collections where it matches
//with index now it will search in the index's of the property which in return improves
//the performance and faster response time. where 1 is sorting it in Ascening and -1 is descending
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//basically telling that this start location here should be indexed to a 2D sphere.
//So an Earthlike sphere where all our data are located.
//A "2dsphere" index supports queries that calculate geometries on an earth-like sphere.
tourSchema.index({ startLocation: '2dsphere' });

//*adding virutal property which will not be saved into DB.
//^ NOTE: for using this keyword alway use regular funciton not "=>" this.
tourSchema.virtual('durationinWeeks').get(function () {
  //converting days into weeks.
  return this.duration / 7;
});

//*populating tours with its reviews.
//1- 'ref' is reference to the data model.
//2- 'foreignField' is the field you want to select which matches with localField.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//* DOCUMENT MIDDLEWARE: runs before .save() and .create().
//^NOTE: this only runs for 'save' / create not for others.
tourSchema.pre('save', function (next) {
  //'this' is the processed document.
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   //as we are awating multiple promisses we should user Prmoise.all to awiat all the data at the same time
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', (next) => {
//   console.log('Will save document');
//   next();
// });

//post run's after the doc is saved.
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//* QUERY MIDDLEWARE.
//~"this" gives the doc that has been found.the find middleware executes just before-
//~the find query is executed.
//Creating Regex "^" means all the String's which start's with find.
tourSchema.pre(/^find/, function (next) {
  //tourSchema.pre('find', function () {//^NOTE: this only runs for 'find' not for findOne , findById etc..
  this.find({ secretTour: { $ne: true } });
  // this.start = Date.now();

  next();
});
tourSchema.pre(/^find/, function (next) {
  //^ "populate" embeds data into the doc by refernce id's. It
  //^ takes field name as parameter to embed/populate .ex:'guides'.
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, (doc, next) => {
  // console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // console.log(`Query took ${Date.now() - this.start} `);
  next();
});

//*AGGREGATION MIDDLEWARE.
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
