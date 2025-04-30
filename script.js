const contractAddress = "0xb5e0d98108e7D39EA4600DeA7Dd61fbdaec8993e";
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "claimId", "type": "bytes32" }
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "uint256", "name": "expireTime", "type": "uint256" },
            { "internalType": "bytes32", "name": "claimId", "type": "bytes32" }
        ],
        "name": "createClaimLink",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "FEE",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

let provider;
let signer;
let contract;

async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            const address = await signer.getAddress();
            document.getElementById("walletAddress").innerText = address;
            document.getElementById("walletInfo").classList.remove("hidden");
            document.getElementById("connectWalletBtn").classList.add("hidden");
        } catch (error) {
            alert("Error connecting to wallet: " + error.message);
        }
    } else {
        alert("MetaMask not found!");
    }
}

async function createClaimLink() {
    const tokenSelect = document.getElementById("tokenSelect");
    const selectedToken = tokenSelect.value;
    const amount = document.getElementById("amount").value;
    const claimId = ethers.id("claim-" + Date.now());
    const expireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
        const fee = await contract.FEE();
        const tx = await contract.createClaimLink(
            selectedToken === "MON" ? ethers.ZeroAddress : selectedToken,
            ethers.parseUnits(amount, 18),
            expireTime,
            claimId,
            { value: fee }
        );
        await tx.wait();

        const claimUrl = `${window.location.origin}/?claimId=${claimId}`;
        document.getElementById("claimLinkResult").innerText = `Claim Link: ${claimUrl}`;
    } catch (error) {
        alert("Error creating claim link: " + error.message);
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
        alert("Error claiming token: " + error.message);
    }
}

document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("createClaimLinkBtn").addEventListener("click", createClaimLink);
document.getElementById("claimBtn").addEventListener("click", claimToken);
