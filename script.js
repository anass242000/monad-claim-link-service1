const contractAddress = "0xb5e0d98108e7D39EA4600DeA7Dd61fbdaec8993e";
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
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
        "inputs": [
            { "internalType": "bytes32", "name": "claimId", "type": "bytes32" }
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let provider;
let signer;
let contract;
let currentWalletAddress = null;

const feeAmount = ethers.utils.parseUnits("0.2", 18); // 0.2 MONAD service fee

async function connectWallet() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            currentWalletAddress = await signer.getAddress();
            document.getElementById("walletAddress").innerText = currentWalletAddress;
            document.getElementById("walletInfo").classList.remove("hidden");
            document.getElementById("connectWalletBtn").classList.add("hidden");
            document.getElementById("createClaimLinkForm").classList.remove("hidden");
            document.getElementById("claimForm").classList.remove("hidden");
            document.getElementById("feeInfo").classList.remove("hidden");
        } catch (error) {
            alert("Error connecting to wallet: " + error.message);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function createClaimLink() {
    const selectedTokenAddress = document.getElementById("tokenSelect").value;
    const amount = document.getElementById("amount").value;
    const expireTime = document.getElementById("expireTime").value;
    const claimId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`claim-${Date.now()}`));
    const expireTimestamp = Math.floor(Date.now() / 1000) + expireTime * 3600; // convert hours to seconds

    contract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
        const parsedAmount = ethers.utils.parseUnits(amount, 18);
        let tx;

        if (selectedTokenAddress === "0x0000000000000000000000000000000000000000") {
            tx = await contract.createClaimLink(
                "0x0000000000000000000000000000000000000000", // native token address
                parsedAmount,
                expireTimestamp,
                claimId,
                { value: feeAmount.add(parsedAmount) }
            );
        } else {
            const token = new ethers.Contract(selectedTokenAddress, [
                "function approve(address spender, uint256 amount) public returns (bool)"
            ], signer);

            await token.approve(contractAddress, parsedAmount);

            tx = await contract.createClaimLink(
                selectedTokenAddress,
                parsedAmount,
                expireTimestamp,
                claimId,
                { value: feeAmount }
            );
        }

        await tx.wait();
        alert("Claim link created successfully! Claim ID: " + claimId);

        document.getElementById("claimLinkInfo").classList.remove("hidden");
        document.getElementById("claimToken").innerText = selectedTokenAddress;
        document.getElementById("claimAmount").innerText = amount;
        document.getElementById("claimExpireTime").innerText = new Date(expireTimestamp * 1000).toLocaleString();
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
        document.getElementById("claimSuccess").classList.remove("hidden");
    } catch (error) {
        alert("Error claiming token: " + error.message);
    }
}

document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("createClaimLinkBtn").addEventListener("click", createClaimLink);
document.getElementById("claimBtn").addEventListener("click", claimToken);
