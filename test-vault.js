// Run with: node test-vault.js
const assert = require("assert");
const Vault = require("./vault.js");
(async () => {
  const token = "github_pat_EXAMPLE1234567890";
  const vault = await Vault.encrypt(token, "correct horse battery staple");
  assert(!JSON.stringify(vault).includes("EXAMPLE"));
  assert.strictEqual(await Vault.decrypt(vault, "correct horse battery staple"), token);
  await assert.rejects(() => Vault.decrypt(vault, "wrong password here"));
  console.log("vault tests passed");
})();
