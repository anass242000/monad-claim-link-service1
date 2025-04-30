window.onload = function () {
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
        }
    ];

    let provider;
    let signer;
    let contract;
    let currentWalletAddress = null;
    const feeAmount = ethers.utils.parseUnits("0.2", 18); // 0.2 MONAD fee

    async function connectWallet() {
        if (window.ethereum) {
            try {
                console.log("MetaMask detected, requesting accounts...");
                // Request MetaMask connection
                await window.ethereum.request({ method: "eth_requestAccounts" });

                // Use Web3Provider instead of JsonRpcProvider
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                currentWalletAddress = await signer.getAddress();

                console.log("Wallet connected: " + currentWalletAddress);

                // Display wallet address
                document.getElementById("walletAddress").innerText = currentWalletAddress;

                // Remove hidden class to show further UI elements
                document.getElementById("walletInfo").classList.remove("hidden");
                document.getElementById("connectWalletBtn").classList.add("hidden");
                document.getElementById("tokenSelectContainer").classList.remove("hidden");
                document.getElementById("amountContainer").classList.remove("hidden");
                document.getElementById("expireTimeContainer").classList.remove("hidden");
                document.getElementById("createClaimLinkBtn").classList.remove("hidden");
            } catch (error) {
                console.error("Error connecting to wallet: ", error);
                alert("Error connecting to wallet: " + error);
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
        const expireTimestamp = Math.floor(Date.now() / 1000) + expireTime * 3600; // hours to seconds

        contract = new ethers.Contract(contractAddress, contractABI, signer);

        try {
            let tx;

            if (selectedTokenAddress === "0") {
                // Using MONAD (native token), no ERC-20 approval needed
                tx = await contract.createClaimLink(
                    selectedTokenAddress,
                    ethers.utils.parseUnits(amount, 18), // amount of MONAD
                    expireTimestamp,
                    claimId, 
                    {
                        value: ethers.utils.parseUnits(amount, 18).add(feeAmount) // include fee and amount
                    }
                );
            } else {
                // Using ERC20 token, approve the contract to transfer tokens
                const token = new ethers.Contract(selectedTokenAddress, [
                    "function approve(address spender, uint256 amount) public returns (bool)"
                ], signer);

                // Approve the contract to spend the specified amount of the ERC20 token
                await token.approve(contractAddress, ethers.utils.parseUnits(amount, 18));

                // Proceed to create claim link
                tx = await contract.createClaimLink(
                    selectedTokenAddress,
                    ethers.utils.parseUnits(amount, 18),
                    expireTimestamp,
                    claimId,
                    {
                        value: feeAmount // Only the fee needs to be sent for ERC20
                    }
                );
            }

            await tx.wait();
            alert("Claim link created successfully! Claim ID: " + claimId);

            // Construct the claim link URL
            const claimLinkUrl = window.location.href + `?claimId=${claimId}`;
            
            // Show claim link details
            document.getElementById("claimLinkInfo").classList.remove("hidden");
            document.getElementById("claimLink").innerText = claimLinkUrl;
            document.getElementById("claimLink").setAttribute("href", claimLinkUrl);  // Make it a clickable link
            document.getElementById("claimToken").innerText = selectedTokenAddress;
            document.getElementById("claimAmount").innerText = amount;
            document.getElementById("claimExpireTime").innerText = new Date(expireTimestamp * 1000).toLocaleString();
        } catch (error) {
            console.error("Error creating claim link: ", error);
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
            console.error("Error claiming token: ", error);
            alert("Error claiming token: " + error);
        }
    }

    document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
    document.getElementById("createClaimLinkBtn").addEventListener("click", createClaimLink);
};
