import server from "./server";
import EC from "elliptic";
import { ethers } from "ethers";
import { useState } from "react";

function Wallet({
  address,
  setAddress,
  balance,
  setBalance,
  privateKey,
  setPrivateKey,
}) {
  const [digitalSignature, setDigitalSignature] = useState("");
  const [message, setMessage] = useState("");

  async function onChange(evt) {
    const address = evt.target.value;
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  const ec = new EC.ec("secp256k1");

  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0, c = 0; c < hex.length; c += 2, i++) {
      bytes[i] = parseInt(hex.substr(c, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  async function onChangePrivateKey(evt) {
    const privateKeyInput = evt.target.value;
    setPrivateKey(privateKeyInput);

    if (privateKeyInput) {
      const ec = new EC.ec("secp256k1");
      const keyPair = ec.keyFromPrivate(privateKeyInput, "hex");

      const publicKey = keyPair.getPublic(false, "hex");

      const hashedPublicKey = ethers.keccak256("0x" + publicKey.slice());

      const address = "0x" + hashedPublicKey.slice(-40);

      console.log("Ethereum Address: ", address);

      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  function signMessage() {
    if (!privateKey || !message) {
      alert("Private key and message are required.");
      return;
    }

    console.log(privateKey);

    const keyPair = ec.keyFromPrivate(privateKey, "hex");
    const signature = keyPair.sign(
      ethers.keccak256(ethers.toUtf8Bytes(message)),
      "hex"
    );
    setDigitalSignature(signature.toDER("hex"));
  }

  function verifySignature() {
    if (!message || !digitalSignature) {
      alert("Message and digital signature are required.");
      return;
    }

    const keyPair = ec.keyFromPrivate(privateKey, "hex");
    const publicKey = keyPair.getPublic("hex");
    const msgHash = ethers.keccak256(ethers.toUtf8Bytes(message));

    const isVerified = ec.verify(msgHash, digitalSignature, publicKey, "hex");
    alert(`Signature Verified: ${isVerified}`);
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Message to Sign
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message to sign"
        />
      </label>

      <button onClick={signMessage}>Sign Message</button>
      <div>Digital Signature: {digitalSignature}</div>

      <button onClick={verifySignature}>Verify Signature</button>

      <label>
        Wallet Address
        <input
          placeholder="Type an address, for example: 0x1"
          value={address}
          onChange={onChange}
        ></input>
      </label>
      <label>
        Private Key
        <input
          placeholder="Type an address, for example: 0x1"
          value={privateKey}
          onChange={onChangePrivateKey}
        ></input>
      </label>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
