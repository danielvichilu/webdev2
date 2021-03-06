'use strict';

const ip = require('ip');

module.exports =
  {
    serverOptions: {
      // --- port and host name ---
      listenPort : process.env.PORT,
      hostName: "ip.address()", // ex) server.domain.com
      // --- for using HTTPS ---
      useHttps: false,
      httpsKeyFile: './key/server.key',
      httpsCertFile: './key/server.cert',

      dummyTail: false
    },

    mcuOptions: {
      autoStartHeadless: true,

      // ---- auto start conditions ----
      headlessFullpath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome', // for MacOS X
      headlessArgs: ['--headless', '--remote-debugging-port=9222'], // With Debug port, for Chrome 61

      headlessUrlSingle: 'user.html',

      dummyTail: false
    }
  }
