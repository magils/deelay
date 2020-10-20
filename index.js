const https = require('https')
const throttle = require('@sitespeed.io/throttle')

module.exports = (request, response, stdout) => {
  const path = request.url.split('/');
  const delay = path[1];
  let redirectUrl = path.slice(2).join('/');

  if (request.method === 'GET' && path.length > 2 && path[2] === "slow-connection") {

  redirectUrl = redirectUrl = path.slice(3).join('/');

  const throttle_conn = async function (){
    const options = {up: 360, down: 25, rtt: 300};
    await throttle.start(options);

    const req = https.get(redirectUrl, (res) => {
      res.on('data', (chunk) => { response.write(chunk) });
     });

     response.end();

    await throttle.stop();
   }

   throttle_conn();

 }  else if (request.method === 'GET' && !isNaN(delay) && path.length > 2) {
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

      const req = https.request(redirectUrl, {"method": "HEAD"}, (res) => {
      response_headers = res.headers;
      for (const key in response_headers) {
        response.setHeader(key, response_headers[key]);
      }
      response.end();
    });

    req.end();
  }
  else {
    response.statusCode = 404;
    response.end();
  }
};