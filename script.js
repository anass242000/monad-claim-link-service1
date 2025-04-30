const contractAddress = "0xb5e0d98108e7D39EA4600DeA7Dd61fbdaec8993e";
const contractABI = [ /* ...same as yours... */ ];

const tokenList = {
    "MONAD": "0x0000000000000000000000000000000000000000", // Native
    "CHOG": "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
    "DAK": "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
    "YAKI": "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50"
};

let provider;
let signer;
let contract;
let currentWalletAddress = null;

async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            currentWalletAddress = await signer.getAddress();
            document.getElementById("walletAddress").innerText = currentWalletAddress;
            document.getElementById("walletInfo").classList.remove("hidden");
            document.getElementById("connectWalletBtn").classList.add("hidden");
        } catch (error) {
            alert("Error connecting to wallet: " + error.message);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function createClaimLink() {
    const tokenSymbol = document.getElementById("tokenSelect").value;
    const selectedTokenAddress = tokenList[tokenSymbol];
    const amount = document.getElementById("amount").value;
    const claimId = ethers.id("claim-" + Date.now()); // safer & Ethers v6-style hash
    const expireTime = Math.floor(Date.now() / 1000) + 3600; // expires in 1 hour

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
        const fee = await contract.FEE();
        const tx = await contract.createClaimLink(
            selectedTokenAddress,
            ethers.parseUnits(amount, 18),
            expireTime,
            claimId,
            { value: fee }
        );
        await tx.wait();

        const claimLink = `${window.location.origin}/claim#${claimId}`;
        alert(`✅ Claim link created!\nToken: ${tokenSymbol}\nAmount: ${amount}\nLink: ${claimLink}`);

        document.getElementById("selectedToken").innerText = tokenSymbol;
        document.getElementById("claimOutput").innerText = claimLink;
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
        alert("🎉 Token claimed successfully!");
    } catch (error) {
        alert("Error claiming token: " + error.message);
    }
}

document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("createClaimLinkBtn").addEventListener("click", createClaimLink);
document.getElementById("claimBtn").addEventListener("click", claimToken);
