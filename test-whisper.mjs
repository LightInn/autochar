// Test nodejs-whisper import
import pkg from 'nodejs-whisper';

console.log('nodejs-whisper exports:', Object.keys(pkg));
console.log('pkg:', pkg);

// Try different ways to access the whisper functionality
if (typeof pkg === 'function') {
  console.log('pkg is a function');
} else if (pkg.NodeJSWhisper) {
  console.log('Found NodeJSWhisper in pkg');
} else if (pkg.default) {
  console.log('Found default export:', pkg.default);
}
