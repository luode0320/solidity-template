import { ethers, network } from "hardhat";
import dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';

// 获取当前网络信息
const networkName = network.name;
console.log("当前网络:", networkName);

// 加载环境变量
dotenv.config();

// 需要部署的合约名称
const contractName: string = process.env.DEPLOY_CONTRACT_NAME!;

// 调用合约方法
async function exec(contract: any) {
    // console.log("_________________________合约调用________________________________");
    // const owner = await contract.owner();
    // console.log("owner: 获取合约所有者地址:", owner);
    // let balanceOfResult = await contract.balanceOf(owner);
    // console.log("balanceOf(): 合约所有者的代币:", balanceOfResult.toString());

    // // 创建新账户
    // const [newAccount] = await ethers.getSigners();

    // console.log();
    // console.log("transfer(): 代币转账...");
    // await contract.transfer(newAccount.address, 100);
    // console.log();

    // // 获取账户的余额
    // balanceOfResult = await contract.balanceOf(newAccount.address);
    // console.log("balanceOf(): 新账户代币:", balanceOfResult.toString());

    // balanceOfResult = await contract.balanceOf(owner);
    // console.log("balanceOf(): 合约所有者的代币:", balanceOfResult.toString());
}

// 定义一个异步函数 main，用于部署合约。
async function main() {
    console.log("_________________________启动部署________________________________");
    const [deployer] = await ethers.getSigners();
    console.log("部署地址:", deployer.address);

    // 获取账户的余额
    const balance = await deployer.provider.getBalance(deployer.address);
    // 将余额转换为以太币 (ETH)
    console.log("账户余额 balance(wei):", balance.toString());
    const balanceInEther = ethers.formatEther(balance);
    console.log("账户余额 balance(eth):", balanceInEther);

    console.log("_________________________部署合约________________________________");
    // 获取合约工厂。
    const contractFactory = await ethers.getContractFactory(contractName);
    // 部署合约
    const contract = await contractFactory.deploy();
    //  等待部署完成
    await contract.waitForDeployment()
    console.log(`合约地址: ${contract.target}`);

    await exec(contract);

    return contract.target;
}

// 执行 main 函数，并处理可能发生的错误。
main()
    .then((contractAddress) => {
        // 只有本地 localhost 才需要生成调试 html 页面
        if (networkName == "localhost") {
            // 解析路径
            const parsedPath = path.parse(__dirname);
            let dir = parsedPath.dir.split(path.sep)[2] ? "/" + parsedPath.dir.split(path.sep)[2] : "";
            let htmlContent = `
                <!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <title>调试合约</title>
                    <!-- ethers-5.2.umd.min.js -->
                    <script src="ethers.js" type="application/javascript"></script>
                </head>

                <body>
                    <div id="contractAddressInput">
                        <label for="contractAddress">合约地址:</label>
                        <input type="text" id="contractAddress" placeholder="0x..." value='${contractAddress}'>
                        <button onclick="loadContract()">刷新合约</button>
                    </div>

                    <div class="container">
                        <div id="methods" style="display:none;"></div>
                        <div id="results" style="display:none;"></div>
                    </div>

                    <div class="solidity">
                        <pre id="solidityCode"><code></code></pre>
                    </div>

                    <script>
                        const ARTIFACTS_PATH = '${dir}/artifacts/contracts/${contractName}.sol/${contractName}.json';
                        const CODE_PATH = '${dir}/contracts/${contractName}.sol';
                        const NETWORK = 'http://127.0.0.1:8545';

                        // 读取合约的 code
                        async function loadCode() {
                            const response = await fetch(CODE_PATH);
                            const data = await response.text();
                            return data;
                        }
                
                        // 读取合约的 ABI
                        async function loadArtifact() {
                            const response = await fetch(ARTIFACTS_PATH);
                            const data = await response.json();
                            return data.abi;
                        }

                        // 加载合约网络
                        async function loadContract() {
                            // 获取用户输入的合约地址
                            const address = document.getElementById('contractAddress').value;
                            if (!address) {
                                alert("请输入合约地址.");
                                return;
                            }

                            // 获取结果展示区域
                            const solidityCode = document.getElementById('solidityCode');
                            solidityCode.firstElementChild.innerText = await loadCode();
                            solidityCode.style.display = 'block';

                            // 读取合约的 ABI(应用程序二进制接口)
                            const abi = await loadArtifact();
                            // 创建一个 JSON-RPC 提供者，用于与 Ethereum 节点进行通信
                            // 注意：这里假设 NETWORK 变量已经定义并包含 RPC 节点的 URL
                            const provider = new ethers.providers.JsonRpcProvider(NETWORK);
                            // 从提供者获取一个签名者对象，它将用于发送带有私钥签名的交易
                            const signer = provider.getSigner();
                            // 使用合约地址、ABI 和签名者创建一个合约实例
                            const contract = new ethers.Contract(address, abi, signer);

                            // 获取结果展示区域
                            const results = document.getElementById('results');
                            // 清空之前的结果
                            results.innerHTML = '';
                            results.style.display = 'block';

                            // 获取页面上的方法显示区域
                            const methods = document.getElementById('methods');
                            // 清空之前的内容
                            methods.innerHTML = '';
                            // 显示方法列表
                            methods.style.display = 'block';

                            // 遍历 ABI 中定义的所有函数
                            abi.forEach(item => {
                                // 只处理函数类型的方法
                                if (item.type === 'function') {
                                    // 创建一个 div 元素用于显示函数参数
                                    const div = document.createElement('div');
                                    // 为 div 设置 ID
                                    div.id = "params-" + item.name;
                                    div.className = 'param-group'; // 添加一个类名
                                    // 初始时显示参数输入框
                                    div.style.display = 'block';

                                    // 创建一个按钮，用于调用合约中的函数
                                    const button = document.createElement('button');
                                    // 设置按钮文本为函数名称
                                    button.innerText = item.name;

                                    // 包装按钮和参数输入框
                                    const wrapper = document.createElement('div');
                                    wrapper.className = 'button-param-wrapper';
                                    wrapper.appendChild(button);
                                    wrapper.appendChild(div);

                                    // 将包装后的元素添加到页面上
                                    methods.appendChild(wrapper);

                                    // 为按钮绑定点击事件处理器，当点击时调用
                                    button.onclick = async () => {
                                        // 每次调用合约方法前清空results的内容
                                        // results.innerHTML = '';
                                        // 收集所有输入框中的值作为方法参数
                                        const args = [];
                                        // 将输入框中的值添加到参数数组中
                                        div.querySelectorAll('input').forEach(inputEl => {
                                            args.push(inputEl.value);
                                        });

                                        var func = item.name + "(";
                                        // 检查是否有输入参数
                                        if (item.inputs && item.inputs.length > 0) {
                                            func += item.inputs.map(input => {
                                                return input.type;
                                            }).join(",");
                                        }
                                        func = func + ")";

                                        try {
                                            // 使用收集到的参数调用合约方法
                                            const result = await contract[func](...args);
                                            // 在结果区域显示成功信息及结果
                                            const p = document.createElement('p');
                                            p.className = 'result-success';
                                            p.innerHTML = "调用成功: " + func + ": <br>" + result;
                                            results.appendChild(p);

                                            results.scrollTop = results.scrollHeight;
                                        } catch (error) {
                                            // 在结果区域显示错误信息
                                            const p = document.createElement('p');
                                            p.className = 'result-error';
                                            p.innerHTML = "调用失败: " + func + ": <br>" + error.message;
                                            results.appendChild(p);

                                            results.scrollTop = results.scrollHeight;
                                        }
                                    };

                                    // 遍历方法的所有输入参数
                                    if (item.inputs.length > 0) {
                                        item.inputs.forEach(input => {
                                            const innerContainer = document.createElement('div');
                                            innerContainer.className = 'inner-container'; // 添加一个类名

                                            // 为每个输入参数创建一个标签
                                            const label = document.createElement('label');
                                            // 设置标签文本为参数名称
                                            label.innerText = input.name + ': ';
                                            // 将标签添加到参数输入区域
                                            div.appendChild(label);
                                            innerContainer.appendChild(label);

                                            // 为每个输入参数创建一个文本输入框
                                            const inputEl = document.createElement('input');
                                            // 设置输入框类型为文本
                                            inputEl.type = 'text';
                                            inputEl.placeholder = input.type;
                                            // 将输入框添加到参数输入区域
                                            innerContainer.appendChild(inputEl);

                                            div.appendChild(innerContainer);
                                        });
                                    } else {
                                        // 如果没有输入参数，则添加一个特定的类
                                        button.classList.add('no-inputs');
                                    }
                                }
                            });
                        }
                            
                        // 页面加载完成后立即调用 loadContract 函数
                        window.onload = function () {
                            loadContract();
                        };
                    </script>
                </body>
                <style>
                    /* 通用样式 */
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                    }

                    #contractAddressInput {
                        display: flex;
                        /* 使子元素在同一行显示 */
                        align-items: center;
                        /* 垂直居中对齐 */
                        gap: 10px;
                        /* 子元素之间的间隔 */
                        justify-content: center;
                    }

                    #contractAddressInput label {
                        flex-shrink: 0;
                        /* 防止标签文字换行 */
                    }

                    #contractAddressInput input[type="text"] {
                        flex-grow: 0;
                        /* 输入框扩展以填充可用空间 */
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }

                    #contractAddressInput button {
                        padding: 8px 16px;
                        margin-bottom: 10px;
                        background-color: #007BFF;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }

                    #contractAddressInput button:hover {
                        background-color: #0056b3;
                    }

                    .container {
                        display: flex;
                        flex-direction: row;
                        width: 90%;
                        padding: 2%;
                    }

                    #methods,
                    #results {
                        flex: 1;
                        padding: 5px;
                        max-height: 700px;
                        overflow-y: auto;
                        border: 2px solid #bec5d5;
                    }

                    #methods {
                        /* 添加右侧边框 */
                    }

                    #results {
                        background-color: #040404;
                        border-radius: 10px;
                        border: 1px solid #040404;
                        /* 添加左侧边框，如果需要的话 */
                    }

                    .solidity {
                        display: flex;
                        justify-content: center;
                    }

                    pre {
                        /* 背景颜色 */
                        background-color: #e7d3c144;
                        border: 1px solid #e7d3c144;
                        color: black;
                        white-space: pre-wrap;
                        /* 保留换行和缩进 */
                        word-wrap: break-word;
                        /* 长单词自动换行 */
                        font-family: monospace;
                        /* 等宽字体 */
                        padding: 10px;
                        /* 内边距 */
                        border: 1px solid #040404;
                        /* 边框 */
                        border-radius: 10px;
                        /* 圆角 */
                        overflow-x: auto;
                        width: 50%;
                    }
                
                    /* 按钮样式 */
                    button {
                        background-color: #007BFF;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                        /* 边框圆角 */
                        border-radius: 4px;
                    }

                    button:hover {
                        background-color: #0056b3;
                    }

                    /* 输入框样式 */
                    input[type="text"] {
                        width: 50%;
                        padding: 10px;
                        margin-bottom: 10px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        /* 边框圆角 */
                        border-radius: 4px;
                    }

                    /* 参数输入区域样式 */
                    #methods {
                        max-width: 600px;
                        padding: 20px;
                        border-radius: 10px;
                    }

                    /* 标签样式 */
                    label {
                        display: block;
                        margin-bottom: 10px;
                        font-weight: bold;
                    }

                    /* 新增的结果显示区域样式 */
                    #results p {
                        margin: 0;
                        padding: 10px 0;
                        border-bottom: 1px solid #5d4e4e;
                    }

                    #results .result-success {
                        color: #4ec54e;
                    }

                    #results .result-error {
                        color: red;
                    }

                    /* CSS样式 */
                    .button-param-wrapper {
                        display: flex;
                        /* 使用 Flexbox 布局 */
                        flex-direction: row;
                        /* 添加边框 */
                        border: 2px solid #d1bccc;
                        /* 内边距 */
                        padding: 10px 10px;
                        /* 边框圆角 */
                        border-radius: 4px;
                        /* 水平布局 */
                        align-items: center;
                        /* 垂直居中对齐 */
                        margin-bottom: 10px;
                        /* 让子元素分别靠左和靠右对齐 */
                        justify-content: space-between; 
                    }

                    /* CSS样式 */
                    .param-group {
                        display: flex;
                        /* 或者使用 "inline-flex" */
                        flex-direction: row;
                        /* 可以调整间距 */
                        padding: 10px 30px;
                    }

                    .param-group label {
                        width: auto;
                        display: inline-block;
                        margin-right: 5px;
                        /* 调整label与input之间的距离 */
                    }

                    .param-group input[type="text"] {
                        width: auto;
                        display: inline-block;
                    }

                    .inner-container {
                        display: flex;
                        flex-direction: row;
                        justify-content: flex-end;
                        align-items: center;
                    }

                    /* 新增的样式 */
                    .no-inputs {
                        background-color: #6b976d;
                    }
                </style>

                </html>
            `;

            // 写入 HTML 文件
            fs.writeFile(path.join(path.dirname(__dirname), 'index.html'), htmlContent, err => {
                if (err) throw err;
                console.error("生成调试 html,请用 Live Server 调试:", path.join(path.dirname(__dirname), 'index.html'));
            });
        }
    })
    .catch(error => {
        console.error(error); // 如果发生错误，则输出错误信息。
        process.exit(1); // 退出进程，并返回错误代码 1。
    });
