"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const root = process.cwd();
const types = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
};

http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);
  const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end();
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}).listen(4173, "127.0.0.1");
