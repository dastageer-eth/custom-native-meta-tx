import { useEffect, useState } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

const App = () => {
  const [connected, setConnected] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('');
  const [owner, setOwner] = useState("")
  const [flagColor, setFlagColor] = useState("")
  const [chain, setChain] = useState("")
  const [color, setColor] = useState('');
  const [metatx, setMetatx] = useState({});
  const [callback, setCallback] = useState('');
  const [fee, setFee] = useState('');
  const [paymaster, setPaymaster] = useState('');

  // let provider = new ethers.providers.JsonRpcProvider("https://eth-goerli.g.alchemy.com/v2/XHwtctghM5FpTyAva5FpYTtwTFt6AN7Q")

  useEffect(() => {
    let fetchOwner = async () => {
      try {
        const owner = await fetch('/api/owner')
        const data = await owner.json();
        setOwner(data.address)
        setFlagColor(data.color)
      } catch (err) {
        console.log(err);
      }
    }
    fetchOwner();
  }, [])

  const metamask = async () => {
    if (window.ethereum) {
      try {
        if (!connected) {
          const selectedAccount = await window.ethereum.request({ method: "eth_requestAccounts" })
          const network = await window.ethereum.request({ method: 'net_version' })
          if (parseInt(network) === 5) {
            setChain("Goerli")
            setSelectedAccount(selectedAccount[0])
            setConnected(true)
          } else {
            alert("Switch to Goerli")
          }
        }
      } catch (err) {
        console.log("oops! Failed", err);
      }
    } else {
      alert("Install Metamask extension!!!")
    }
  }

  const sendMetaTx = async () => {
    console.log("sendMetaTx Called");
    console.log(color)
    if (color) {
      try {
        const response = await fetch(`/api/metatx/${selectedAccount}/${color}`);
        const data = await response.json();
        console.log(data)
        setMetatx(data.metatx);
        console.log(data.metatx);
        setCallback(data.callback);
        if (metatx && callback) {
          console.log("in UseEffect");
          const method = 'eth_signTypedData_v4';
          const params = [selectedAccount, JSON.stringify(metatx)];
          const provider = await detectEthereumProvider();
          console.log(params);
          provider.sendAsync(
            {
              method,
              params,
              selectedAccount,
            },
            async (err, result) => {
              if (err) {
                console.log("1st if".err);
                return;
              }
              if (result.error) {
                alert(result.error.message);
                return;
              }
              console.log('TYPED SIGNED:' + JSON.stringify(result.result));

              try {
                console.log(`In ${callback}`);
                const response = await fetch(`${callback}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    metatx: metatx,
                    signature: result.result,
                  }),
                });
                const data = await response.json();
                console.log(data);
                setFee(data.fee);
                setPaymaster(data.paymaster);
                console.log(fee, paymaster);
              } catch (error) {
                console.log(`In ${callback} catch`);
                console.error(error);
              }
            },
          );
        }
      } catch (error) {
        console.error("send oops", error);
      }
    } else {
      alert('Missing color');
    }
  }

  return (
    <div >
      <h1>Sending Meta Tx</h1>
      <button onClick={metamask}>{connected && selectedAccount ? selectedAccount : "Connect Wallet"}</button>
      <div>
        <p>
          <strong>Chain:</strong> <span>{chain}</span>
        </p>

        <p>
          <strong>Selected Account:</strong> <span>{selectedAccount}</span>
        </p>

      </div>
      <div>
        <p>
          <strong>Current Flag Owner:</strong><span> {owner}</span>
        </p>
        <p>
          <strong>Current Owner Flag color:</strong><span> {flagColor}</span>
        </p>
      </div>
      <div>
        <input type='text' placeholder="Enter Flag color" onChange={(e) => { setColor(e.target.value) }} value={color} />
        <button onClick={() => sendMetaTx()}> Set Color</button>
      </div>
    </div>
  );
}

export default App;
