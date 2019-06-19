const readline = require('readline');

(async () => {

  const window = globalThis.window;
  const process = globalThis.process;
  const rlOpts = !window
    ? (() => {

        return {
          input: process.stdin,
          output: process.stdout,
        }
      })()
    : await new Promise(async (resolve) => {

        const term = new Terminal({
          // rendererType: 'dom',
          fontSize: 20,
        });

        const convertKeyEventFromDomToNode = (onkeypress) => {
          return (s, domKey) => {

            const key = {
              name: domKey.key.toLowerCase().replace('arrow', ''),
              shift: domKey.shiftKey,
              ctrl: domKey.ctrlKey,
              meta: domKey.metaKey,
            };
            return onkeypress(s, key);
          }
        };

        const _on = term.on.bind(term);
        const _off = term.off.bind(term);
        const eventToCount = {};
        term.on = (event, listener, ...args) => {
          if (event === 'keypress') {
            event = 'key';
            listener = convertKeyEventFromDomToNode(listener);
          }
          eventToCount[event] = (eventToCount[event] || 0) + 1;
          _on(event, listener, ...args);
        }
        term.off = (event, listener, ...args) => {
          if (event === 'keypress') {
            event = 'key';
            listener = convertKeyEventFromDomToNode(listener);
          }
          eventToCount[event] = (eventToCount[event] || 1) - 1;
          _off(event, listener, ...args);
        }
        term.listenerCount = (event) => {
          if (event === 'keypress') {
            event = 'key';
          }

          return eventToCount[event] || 0;
        }

        term.resume = term.pause = () => {};
        term.removeListener = term.off;

        term.open(document.getElementById('terminal'));
        term.resize(
          Math.floor(document.body.clientWidth / (document.querySelector('.xterm-scroll-area').clientWidth / term.cols)),
          Math.floor(document.body.clientHeight / (document.querySelector('.terminal').clientHeight / term.rows)),
        );

        term.focus();
        resolve({
          input: term,
          output: term,
          terminal: true,
        });
      });

  const rl = readline.createInterface({
    ...rlOpts,
    prompt: 'SUB> ',
    completer(line) {

      const completions = 'help fuck'.split(' ');
      const hits = completions.filter((c) => c.startsWith(line));
      // Show all completions if none found
      return [hits.length ? hits : completions, line];
    },
  });
  const term = rlOpts.output;
  const println = (text) => term.write(text + '\r\n');

  const service = {
    welcome: 'Share subdomains of your second level domain with others!',
    commands: {
      help: {
        handler: () => {
          println(Object.keys(service.commands).join(' '));
        },
      },
      share: {
        args: {
          name: 'domain',
        },
        handler: (domain) => {
          
        },
      },
    },
  };

  println('Share subdomains of your second level domain with others!');

  rl.prompt();

  rl
    .on('line', (line) => {

      const [ command, ...args ] = line.trim().split(/\s+/g);
      const cmd = service.commands[command];
      if (cmd) {
        cmd.handler(...args);
      } else {
        println(`Unknown command "${line.trim()}". Type "help" without quotes to get started.`);
      }
      rl.prompt();
    })
    .on('close', () => {

      println('Have a great day!');
      if (window) {
        window.location.reload(); // We can't close the window.
      } else {
        process.exit(0);
      }
    });

})();
