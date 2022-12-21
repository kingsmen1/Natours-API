const fs = require('fs');
const superagent = require('superagent');

//Using callbacks.

fs.readFile(`${__dirname}/dog.txt`, 'utf-8', (err, breedName) => {
  console.log(`Breed : ${breedName}`);
  superagent
    .get(`https://dog.ceo/api/breed/${breedName}/images/random`)
    .end((err, res) => {
      if (err) return console.log('Something went wrong');
      console.log(res.body.message);
      fs.writeFile('dog-img.txt', res.body.message, (error) => {
        if (error) return console.log('Something went wrong');

        console.log('random dog image saved ');
      });
    });
});
