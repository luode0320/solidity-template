# 简介

一个hardhat脚手架。

# 环境变量

重命名 `.env.exampl`  ->  `.env`, 并配置api key。

# 安装依赖

```shell
yarn
```

# 编译(可选)

```shell
yarn hardhat compile
```

# 部署到本地区块链网络

```shell
yarn hardhat run scripts/deploy.ts
```

# 部署区块链到测试网

```shell
yarn hardhat run scripts/deploy.ts --network sepolia
```

# 验证合约

```shell
# <合约路径:合约名称> <合约地址>
yarn hardhat verify --network sepolia --contract contracts/Contract.sol:Contract 0xAE8be154553d3b9ebEF90cc9698840c86DbC955c
```

# 测试

```shell
yarn hardhat test test/test.ts 
```
