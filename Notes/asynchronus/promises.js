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

//Using Created Promise
readFilePro(`${__dirname}/dog.txt`)
  .then((breedName) => {
    console.log(breedName);
    superagent
      .get(`https://dog.ceo/api/breed/${breedName}/images/random`)
      .then((res) => {
        console.log(res.body.message);

        writeFilePro('dog-img.txt', res.body.message)
          .then((data) => {
            console.log(data);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((err) => {
        console.log(err.message);
      });
  })
  .catch((err) => {
    console.log(err);
  });
