const fs = require('fs');
const { resolve } = require('path');
const superagent = require('superagent');

//creating Promise of readFile .
const readFilePro = (file) => {
  //this promise takes one executor function which executes the fs.readFile .
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err) reject('Could not find the file😥');
      resolve(data);
    });
  });
};

const writeFilePro = (file, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (error) => {
      if (error) reject('Could not find the file😥');
      resolve('Success');
    });
  });
};

const getDogPic = async () => {
  try {
    const breedName = await readFilePro(`${__dirname}/dog.txt`);
    console.log(`Breed : ${breedName}`);

    //Method / Good pratice  for getting multiple api responses at same time.
    const res1Pro = superagent.get(
      `https://dog.ceo/api/breed/${breedName}/images/random`
    );
    const res2Pro = superagent.get(
      `https://dog.ceo/api/breed/${breedName}/images/random`
    );
    const res3Pro = superagent.get(
      `https://dog.ceo/api/breed/${breedName}/images/random`
    );
    //Promise.all gets all the data at the same time
    const all = await Promise.all([res1Pro, res2Pro, res3Pro]);
    const images = all.map((el) => {
      return el.body.message;
    });
    console.log(images);
    // console.log(resp.body.message);

    writeFilePro('dog-img.txt', images.join('\n'));
    console.log('Random Dog Image is saved to file😀');
  } catch (err) {
    console.log(err);
    throw err;
  }
  return '2: Ready 🐶';
};

//calling the Future Function using 'IIFE'(immediately invoked function expression).
(async () => {
  try {
    console.log('1: will get dog pics');
    const res = await getDogPic();
    console.log(res);
    console.log('3: done getting dog pics');
  } catch (err) {
    console.log(`${err} 💥`);
  }
})();

// getDogPic()
//   .then((x) => {
//     console.log(x);
//     console.log('3: done getting dog pics');
//   })
//   .catch((err) => {
//     console.log(`${err} 💥`);
//   });
