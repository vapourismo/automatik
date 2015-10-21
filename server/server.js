const server = require("socket.io")();
require("./communication")(server);
server.listen(3001);
