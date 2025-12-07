const fs = require('fs');

try {
  require('./replacebasepath');
  console.log('[runner.js] replacebasepath completed');
} catch (error) {
  console.error('[runner.js] replacebasepath error:', error);
  process.exit(1);
}

try {
  if (fs.existsSync('generateruntimeenvfile.js')) {
    require('./generateruntimeenvfile');
    console.log('[runner.js] generateruntimeenvfile completed');
  } else {
    console.warn('[runner.js] generateruntimeenvfile.js not found');
  }
} catch (error) {
  console.error('[runner.js] generateruntimeenvfile error:', error);
  process.exit(1);
}

try {
  // server.js file is generated at build time by nextjs (see .next/standalone/webapps/XXXXX/server.js)
  require('./server');
} catch (error) {
  console.error('[runner.js] server startup error:', error);
  process.exit(1);
}
