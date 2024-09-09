import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// 修复超时的问题
// https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/2247#discussioncomment-5496669
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

// 加载环境变量
dotenv.config();

// 测试网的 URL
const RPC_URL: string = process.env.RPC_URL!;
// 我们自己的钱包私钥
const PRIVATE_KEY: string = process.env.PRIVATE_KEY!;
// Etherscan 区块链浏览器 API 密钥
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY!;

// Hardhat 配置类型
import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      // Sepolia 网络的 RPC URL
      url: RPC_URL,
      // 用于连接 Sepolia 网络的账户私钥
      accounts: [PRIVATE_KEY],
      // Sepolia 网络的链 ID
      chainId: 11155111
    },
    ethereum: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1,
    },
  },
  // Etherscan 配置，用于访问以太坊区块链数据
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;