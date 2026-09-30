// Password vault: encrypts the GitHub token with a password (AES-256-GCM, key
// from PBKDF2 with 600,000 rounds) so the admin page can offer a password login.
// Only the encrypted blob is ever stored (in vault.json); the password never leaves your browser.
(function (root) {
  const ITER = 600000;
  const wc = () => (root.crypto && root.crypto.subtle ? root.crypto : require("crypto").webcrypto);
  const b64 = (u8) => { let s = ""; u8.forEach((b) => (s += String.fromCharCode(b))); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function deriveKey(pw, salt, iter, usage) {
    const c = wc();
    const base = await c.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    return c.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, usage);
  }

  async function encrypt(token, pw) {
    const c = wc();
    const salt = c.getRandomValues(new Uint8Array(16));
    const iv = c.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pw, salt, ITER, ["encrypt"]);
    const ct = new Uint8Array(await c.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)));
    return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  }

  // Throws if the password is wrong.
  async function decrypt(vault, pw) {
    const key = await deriveKey(pw, unb64(vault.salt), vault.iter, ["decrypt"]);
    const pt = await wc().subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.iv) }, key, unb64(vault.ct));
    return new TextDecoder().decode(pt);
  }

  const api = { encrypt, decrypt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Vault = api;
})(typeof window !== "undefined" ? window : globalThis);
