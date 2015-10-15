// HTTP server
const http = require("http").Server();

// Application
require("./communication")(http);

http.listen(3001);
