# 🔗 CertChain — Student Certificate Validation using Blockchain

A full-stack application that issues, verifies, and revokes student certificates on the **Ethereum Sepolia** test network. Certificates are hashed (SHA-256) and stored on-chain, making them tamper-proof and globally verifiable.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │Dashboard │  │  Admin   │  │  Verify  │  │   History    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       └─────────────┴─────────────┴───────────────┘            │
│                          │ HTTP (axios)                         │
└──────────────────────────┼──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API  (Express · Node.js)                   │
│                                                                 │
│   routes.js ──► blockchain.js (ethers.js) ──► Sepolia RPC      │
│       │                   │                                     │
│       ▼                   ▼                                     │
│   store.js         CertificateRegistry.sol                      │
│  (in-memory)        (Sepolia contract)                          │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │  Ethereum Sepolia   │
              │  (testnet)          │
              └─────────────────────┘
```

### Key Design Decisions

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 + Tailwind | Fast dev, great DX, built-in routing |
| State | React Context (wallet) | Keeps wallet logic central; no heavy libs needed |
| HTTP client | Axios | Simple, promise-based |
| Backend | Express + ethers.js | Minimal footprint; ethers v6 is the standard for Ethereum |
| On-chain | Solidity 0.8.20 | Latest stable compiler; gas-efficient mappings |
| Network | Sepolia | Official Ethereum testnet; well-supported by faucets & explorers |

---

## 📁 Project Structure

```
cert-blockchain/
├── frontend/                   # Next.js 14 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Single-page app shell
│   │   ├── components/
│   │   │   ├── Background.tsx  # Animated background
│   │   │   ├── Navbar.tsx      # Navigation + wallet connect
│   │   │   ├── Dashboard.tsx   # Stats & quick actions
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── VerifyCertificate.tsx
│   │   │   └── History.tsx     # Certificate table
│   │   ├── utils/
│   │   │   ├── api.ts          # Axios wrappers for backend
│   │   │   └── walletContext.tsx # MetaMask integration
│   │   └── styles/
│   │       └── globals.css     # Tailwind + custom styles
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                    # Express API + blockchain layer
│   ├── src/
│   │   ├── index.js            # App entry point
│   │   ├── routes.js           # All API endpoints
│   │   ├── blockchain.js       # ethers.js provider / contract
│   │   └── store.js            # In-memory certificate cache
│   ├── config/
│   │   ├── abi.json            # Smart contract ABI
│   │   └── bytecode.txt        # (you create this after compiling)
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.js           # Deploys the contract
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MetaMask | Latest browser extension |
| solc | 0.8.20 (for recompiling the contract) |

### 2. Clone & install

```bash
git clone <repo-url>
cd cert-blockchain

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 3. Configure environment

```bash
cd ../backend
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `SEPOLIA_RPC_URL` | Infura or Alchemy Sepolia endpoint |
| `PRIVATE_KEY` | A **throwaway** Sepolia wallet private key |
| `CONTRACT_ADDRESS` | Filled **after** deploy (step 4) |

### 4. Compile & deploy the smart contract

#### Option A — Remix (recommended for beginners)
1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. Paste `CertificateRegistry.sol` into a new file.
3. Compile with Solidity 0.8.20.
4. Deploy to **Sepolia** via MetaMask (Injected Provider).
5. Copy the deployed address into `.env` as `CONTRACT_ADDRESS`.
6. Copy the compiled bytecode into `backend/config/bytecode.txt`.

#### Option B — solc CLI
```bash
# From the backend/ directory
solc --bin contracts/CertificateRegistry.sol -o config/
# Rename the output:
mv config/CertificateRegistry.bin config/bytecode.txt

# Then deploy:
node scripts/deploy.js
# The script prints the address — paste it into .env
```

### 5. Start the backend

```bash
cd backend
npm run dev   # uses --watch for auto-reload
# Server starts on http://localhost:3001
```

### 6. Start the frontend

```bash
cd ../frontend
npm run dev
# App starts on http://localhost:3000
```

### 7. Fund your wallet

Go to a Sepolia faucet (e.g. <https://faucet.link/sepolia>) and send ETH to your deployer wallet so transactions can be paid for.

---

## 📡 API Reference

| Method | Endpoint | Body / Params | Description |
|---|---|---|---|
| GET | `/api/health` | — | Returns contract address, network, latest block |
| POST | `/api/certificates/issue` | JSON (see below) | Issues a certificate on-chain |
| GET | `/api/certificates/verify/:hash` | `:hash` = certificate hash | Verifies against the blockchain |
| GET | `/api/certificates/student/:id` | `:id` = student ID | Returns all certs for a student |
| GET | `/api/certificates` | — | Lists all cached certificates |
| POST | `/api/certificates/revoke` | `{ certificateHash }` | Revokes a certificate on-chain |

#### Issue payload

```json
{
  "studentName"    : "John Doe",
  "studentId"      : "STU-2024-001",
  "courseName"     : "B.Tech Computer Science",
  "institutionName": "MIT",
  "issuanceDate"   : "2024-06-15",
  "expiryDate"     : "2029-06-15",
  "grade"          : "A+",
  "issuerAddress"  : "0x…"
}
```

---

## 🔐 How Certificate Hashing Works

```
Certificate Payload (JSON)
        │
        ▼  SHA-256
   32-byte Hash (bytes32)
        │
        ▼  Stored on Sepolia
   CertificateRegistry.issueCertificate(hash, studentId)
```

The **same payload** always produces the **same hash**, so anyone with the original certificate data can re-hash and verify it independently — no need to trust the backend.

---

## 🛡️ Smart Contract Functions

| Function | Access | Description |
|---|---|---|
| `issueCertificate(bytes32, string)` | Anyone | Stores a new cert hash |
| `revokeCertificate(bytes32)` | Issuer only | Marks a cert as revoked |
| `verifyCertificate(bytes32)` | Anyone (view) | Returns exists / isValid / issuer / issuedAt |
| `getCertsByStudent(string)` | Anyone (view) | Returns all cert hashes for a student |
| `getAllCertHashes()` | Anyone (view) | Returns every cert hash ever issued |

---

## 🖥️ Frontend Pages

| Tab | What it does |
|---|---|
| **Dashboard** | High-level stats, network status, quick-action cards |
| **Issue Certificate** | Form → backend → on-chain tx → receipt with Etherscan link |
| **Verify** | Enter a hash or student ID → live on-chain check |
| **History** | Full searchable table; revoke button for valid certs |

---

## 🔧 Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `SEPOLIA_RPC_URL` | — | **Required** – Infura / Alchemy URL |
| `PRIVATE_KEY` | — | **Required** – Sepolia testnet key only! |
| `CONTRACT_ADDRESS` | — | **Required after deploy** |
| `PORT` | `3001` | Backend server port |

---

## ⚡ Production Checklist

- [ ] Replace in-memory `store.js` with a persistent database (PostgreSQL / MongoDB).
- [ ] Move `PRIVATE_KEY` to a secrets manager (AWS Secrets Manager, etc.).
- [ ] Add rate-limiting middleware to the API.
- [ ] Switch `SEPOLIA_RPC_URL` to a mainnet endpoint for production.
- [ ] Add proper HTTPS / TLS configuration.
- [ ] Set up CI/CD for contract deployment + app deployment.

---

## 📜 License

MIT – use freely for learning and projects.
