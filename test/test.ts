import { ethers } from "hardhat";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 需要部署的合约名称
const contractName: string = process.env.DEPLOY_CONTRACT_NAME!;

describe("测试集合-1", function () {
    it("测试1: 部署", async function () {
        // 获取合约工厂。
        const Contract = await ethers.getContractFactory(contractName);

        // 部署合约。
        await Contract.deploy();
    });
});