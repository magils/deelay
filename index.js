const https = require('https')
const throttle = require('@sitespeed.io/throttle')

module.exports = (request, response, stdout) => {

  try {

      const path = request.url.split('/');
      var dataArray = [];

      if (request.method === 'GET' && path.length > 2 && path[1] === "slow-connection") {

        redirectUrl = path.slice(2).join('/');
        console.log("Slow connection...");

        throttle.start({up: 100, down: 100, rtt: 100}).then(() =>{

          const req = https.get(redirectUrl, (res) => {
            res.on('data', (chunk) => { dataArray.push(chunk) });
            res.on('end', () => {
              var buffer = Buffer.concat(dataArray);
              response.end(buffer);
              throttle.stop();
            });
          });
        });

    }  
    else if (request.method === 'GET' && path.length > 2) {

        const delay = path[1];
        let redirectUrl = path.slice(2).join('/');

        if (isNaN(delay)){
          response.statusCode = 400;
          response.end(JSON.stringify({"error": "Invalid timeout value"}));
          return;
        }

        if (!redirectUrl.match(/^(http|https):/)) {
          redirectUrl = `https://${redirectUrl}`;
        }
        stdout && stdout.write(`${delay}... `);

        setTimeout(() => {
          stdout && stdout.write(`${redirectUrl}\n`);
          response.statusCode = 302;
          response.setHeader('Location', redirectUrl);
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.end();
        }, delay);
      } else if (request.method === 'OPTIONS') {
        response.statusCode = 200;
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Headers', request.headers['access-control-request-headers'] || '');
        response.setHeader('Access-Control-Allow-Methods', request.headers['access-control-request-methods'] || '');
        response.end();
      } else if (request.method === 'HEAD'){

          if(path[2] === "slow-connection") {
            redirectUrl = path.slice(3).join('/');
          }

          const req = https.request(redirectUrl, {"method": "HEAD"}, (res) => {
          response_headers = res.headers;
          for (const key in response_headers) {
            response.setHeader(key, response_headers[key]);
          }
          response.end();
        });

        req.end();
    } else if (request.method == "POST" && path[1] == "restore") {
        throttle.start({up: 5000, down: 20000, rtt: 2}).then(() => {throttle.stop()});
        response.statusCode = 202;
        response.end()
    } else {
      response.statusCode = 404;
      response.end();
    }

  }catch(error){
    console.log(error)
  }
};