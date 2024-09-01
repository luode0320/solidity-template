// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Contract {
    // `public` 修饰符使得这些变量可以从合约外部读取。
    string public name = "luo de"; // 代币全名
    string public symbol = "LD"; // 代币简写名

    // 固定发行量，保存在一个无符号整型里, 10w。
    uint256 public totalSupply = 1000000;

    // 一个地址类型变量用于存储以太坊账户。
    address public owner; // 合约所有者==谁创建的这个合约

    // map 映射是一种键值对映射。这里我们存储每个账户的余额。
    mapping(address => uint256) balances;

    /**
     * 合约构造函数
     *
     * `constructor` 只在创建合约时执行一次。
     */
    constructor() {
        // 总供应量分配给交易发送方，即部署合约的账户。
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    /**
     * 代币转账功能。
     *
     * `external` 修饰符使得该函数只能从合约外部调用。
     */
    function transfer(address to, uint256 amount) external {
        // 检查交易发送方是否有足够的代币。
        // 如果 `require` 的第一个参数为 `false`，则交易将会回退, 并返回错误信息
        require(balances[msg.sender] >= amount, "Not enough tokens");

        // 打印日志
        console.log(
            "Transferring from %s to %s %s tokens",
            msg.sender,
            to,
            amount
        );

        // 执行转账操作。
        balances[msg.sender] -= amount; // 合约所有者 - 转账数量
        balances[to] += amount; // 代币接收者 + 转账数量
    }

    /**
     * 返回指定账户的代币余额，这是一个只读函数。
     *
     * `view` 修饰符表明该函数不会修改合约的状态，
     * 这使得我们可以不通过执行交易就能调用它。
     */
    function balanceOf(address account) external view returns (uint256) {
        // 返回一个账户所拥有的代币数量
        return balances[account];
    }
}
