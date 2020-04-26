let repl = require('repl');
context = repl.start({ prompt: "puz_repl> "}).context;
context.p = require('./test.js');
