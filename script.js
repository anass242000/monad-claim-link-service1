const contractAddress = "0xb5e0d98108e7D39EA4600DeA7Dd61fbdaec8993e";
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "claimId",
                "type": "bytes32"
            }
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expireTime",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "claimId",
                "type": "bytes32"
            }
        ],
        "name": "createClaimLink",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "FEE",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

let provider;
let signer;
let contract;
let currentWalletAddress = null;

async function connectWallet() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            provider = new ethers.BrowserProvider(window.ethereum);
			signer = provider.getSigner();
            currentWalletAddress = await signer.getAddress();
            document.getElementById("walletAddress").innerText = currentWalletAddress;
            document.getElementById("walletInfo").classList.remove("hidden");
            document.getElementById("connectWalletBtn").classList.add("hidden");
        } catch (error) {
            alert("Error connecting to wallet: " + error);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function createClaimLink() {
    const selectedTokenAddress = "0xE0590015A873bF326bd645c3E1266d4db41C4E6B"; // CHOG token address (as an example)
    const amount = document.getElementById("amount").value;
    const claimId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`claim-${Date.now()}`));
    const expireTime = Math.floor(Date.now() / 1000) + 3600; // expires in 1 hour

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
        const fee = await contract.FEE();
        const tx = await contract.createClaimLink(selectedTokenAddress, ethers.utils.parseUnits(amount, 18), expireTime, claimId, {
            value: fee
        });
        await tx.wait();
        alert("Claim link created successfully! Claim ID: " + claimId);
        document.getElementById("selectedToken").innerText = "CHOG";
    } catch (error) {
        alert("Error creating claim link: " + error);
    }
}

async function claimToken() {
    const claimId = document.getElementById("claimLink").value;

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
        const tx = await contract.claim(claimId);
        await tx.wait();
        alert("Token claimed successfully!");
    } catch (error) {
        alert("Error claiming token: " + error);
    }
}

document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("createClaimLinkBtn").addEventListener("click", createClaimLink);
document.getElementById("claimBtn").addEventListener("click", claimToken);
