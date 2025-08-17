/***************************************************
 *  Polyfills for node globals required by some   *
 *  third-party browser libraries (e.g. crypto).  *
 ***************************************************/

// Alias global → window (Node vs browser)
(window as any).global = window;

// Minimal process shim (optional but useful for some libs)
(window as any).process = (window as any).process || { env: {} };

// Buffer polyfill (rarely needed but included for safety)
import { Buffer } from 'buffer';
(window as any).Buffer = (window as any).Buffer || Buffer;

// Polyfill crypto (Node.js) if a library requires `require('crypto')`
// Si une librairie attend "crypto", vous pouvez rediriger vers l’API Web Crypto native.
// Exemple :
//   (window as any).crypto = (window as any).crypto || window.crypto;
// Cela évite d’embarquer un gros polyfill Node. 