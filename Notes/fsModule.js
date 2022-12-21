const fs = require('fs');

// Blocking  , Synchronus way :(


//Reading data .
let textIN = fs.readFileSync("./txt/read-this.txt", 'utf-8');
console.log(textIN);

//Setting data .
//String concactination .
let textOut = `This is what we know about Avocado ${textIN} . \n Created on ${Date.now()}`;
fs.writeFileSync('./txt/Output.txt', textOut);
console.log('file written');



/**----------------------------------------------------- */

// Non-Blocking Asynchronus way .

fs.readFile('./txt/starrrt.txt', 'utf-8', (error, data1) => {
    if (error) return console.log('Error 🎆');
    fs.readFile(`./txt/${data1}.txt`, 'utf-8', (error, data2) => {

        fs.readFile(`./txt/append.txt`, 'utf-8', (error, data3) => {
            //Setting data 
            fs.writeFile('./txt/final.txt', `${data2}\n${data3}`, 'utf-8', err => {
                console.log('data has been written');
            });

        });
    });
});


