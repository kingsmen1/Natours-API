const fs = require('fs');
const server = require('http').createServer();

server.on('request', (req, res) => {
  //solution 1
  /*fs.readFile('test-file.txt', (err, data) => {
    if (err) console.log('error reading file');
    res.end(data);
  });*/

  //solution 2: Streams
  //this solution has a drawback that reading file is much faster than send file to
  //client by using res.write()
  //Creating a readable strem .

  /**const readable = fs.createReadStream('tet-file.txt');
  //Sendding data piece by piece .
  readable.on('data', (chunk) => {
    //write() method writes some data to the stream
    res.write(chunk);
  });
  //Its always mandatory to call end while using write .
  readable.on('end', () => {
    res.end();
  });
  //Error handling
  readable.on('error', (err) => {
    //Setting status code.
    res.statusCode = 500; //The HTTP status code 500 is a generic error response.
    res.end('File Not found!');
  }); */

  //Solution 3
  const readable = fs.createReadStream('test-file.txt');
  //we can use pipe on readable to the writable destination .
  readable.pipe(res);
});

server.listen(4500);
