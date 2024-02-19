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
  verifyWalletOwner,
  setVerifyWalletOwner,
}) {
  const [digitalSignature, setDigitalSignature] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  async function onChange(evt) {
    setVerifyWalletOwner(false);
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

  async function onChangePrivateKey(evt) {
    const privateKeyInput = evt.target.value;
    setPrivateKey(privateKeyInput);

    if (privateKeyInput) {
      const ec = new EC.ec("secp256k1");
      const keyPair = ec.keyFromPrivate(privateKeyInput, "hex");

      const publicKey = keyPair.getPublic(false, "hex");

      const hashedPublicKey = ethers.keccak256("0x" + publicKey.slice());

      const addressFromPrivateKey = "0x" + hashedPublicKey.slice(-40);

      setVerifyWalletOwner(false);
      if (address == addressFromPrivateKey) {
        setVerifyWalletOwner(true);
        setAddress(address);
      }

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

    const keyPair = ec.keyFromPrivate(privateKey, "hex");
    const signature = keyPair.sign(
      ethers.keccak256(ethers.toUtf8Bytes(message)),
      "hex"
    );
    setDigitalSignature(signature.toDER("hex"));
  }

  function verifySignature(_walletAddress) {
    if (!message || !digitalSignature) {
      alert("Message and digital signature are required.");
      return;
    }

    const keyPair = ec.keyFromPrivate(privateKey, "hex");
    const publicKey = keyPair.getPublic("hex");

    const hashedPublicKey = ethers.keccak256("0x" + publicKey.slice());

    const address = "0x" + hashedPublicKey.slice(-40);
    setSignature("");
    if (_walletAddress !== address) return;
    setSignature(address);
    const msgHash = ethers.keccak256(ethers.toUtf8Bytes(message));

    const isVerified = ec.verify(msgHash, digitalSignature, publicKey, "hex");
    alert(`Signature Verified: ${isVerified}`);
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

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
      <label>Wallet Owner: {verifyWalletOwner ? "Owner" : "Not owner"}</label>

      <div className="balance">Balance: {balance}</div>

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
      <label>
        Digital Signature:{" "}
        {digitalSignature.slice(0, 10) + "..." + digitalSignature.slice(-10)}
      </label>

      <label>
        Verify Signature
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter a message to sign"
        />
        <button onClick={() => verifySignature(walletAddress)}>
          Verify Signature
        </button>
      </label>
      <label>Public Key: {signature}</label>
    </div>
  );
}

export default Wallet;
