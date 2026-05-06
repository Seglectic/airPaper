'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                        logger.js                       ┃
// ┃                                                        ┃
// ┃  Timestamp-prefixed console logging.                   ┃
// ┃  Preserves the 「timestamp」 format from airPaper v1.   ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

// ╭──────────────────────────────────────────────────────╮
// │  Prints text to terminal with a timestamp prefixed.  │
// ╰──────────────────────────────────────────────────────╯
function log(text) {
  const ts = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  });
  console.log(`「${ts}」 ${text}`);
}

module.exports = { log };
