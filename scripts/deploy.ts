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
// 合约的测试 html 名称
const contractHtml: string = "index.html";

// 我们自己的钱包私钥
let PRIVATE_KEY: string = "";
// 网络的 URL
let RPC_URL = "http://127.0.0.1:8545";
// 如果不是本地，则使用环境变量
if (networkName != "localhost") {
    RPC_URL = process.env.RPC_URL!;
    PRIVATE_KEY = process.env.PRIVATE_KEY!;
}

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
    // 部署合约(可以添加构造函数, 按照构造函数的顺序添加即可)
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
        if (networkName == "hardhat") {
            return
        }

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
                    <!-- 添加下拉列表 -->
                    <div id="accountSelector">
                        <select id="account" onchange="selectAccount()">
                            <!-- 选项将在 JavaScript 中动态生成 -->
                        </select>
                    </div>
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
                        const NETWORK = '${RPC_URL}';

                        let address;
                        let contract;
                        let provider;
                        let abi;

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
                            address = document.getElementById('contractAddress').value;
                            if (!address) {
                                alert("请输入合约地址.");
                                return;
                            }

                            // 获取结果展示区域
                            const solidityCode = document.getElementById('solidityCode');
                            solidityCode.firstElementChild.innerText = await loadCode();
                            solidityCode.style.display = 'block';

                            // 读取合约的 ABI(应用程序二进制接口)
                            abi = await loadArtifact();
                            // 创建一个 JSON-RPC 提供者，用于与 Ethereum 节点进行通信
                            // 注意：这里假设 NETWORK 变量已经定义并包含 RPC 节点的 URL
                            provider = new ethers.providers.JsonRpcProvider(NETWORK);

                            let signer;
                            const accountSelect = document.getElementById("account");
                            if ('${networkName}' == 'localhost') {
                                // 从提供者获取一个签名者对象，它将用于发送带有私钥签名的交易
                                signer = provider.getSigner(0);
                                for (let index = 0; index < 3; index++) {
                                    const option = document.createElement("option");
                                    option.value = index;
                                    const signerAddress = await provider.getSigner(index).getAddress();
                                    option.text = signerAddress;
                                    accountSelect.appendChild(option);
                                }
                            } else {
                                // 使用私钥创建一个签名者对象
                                signer = new ethers.Wallet('${PRIVATE_KEY}', provider);
                                const option = document.createElement("option");
                                option.value = "0";
                                option.text = signer.address;
                                accountSelect.appendChild(option);
                                console.log(signer.address);
                            }

                            // 使用合约地址、ABI 和签名者创建一个合约实例
                            contract = new ethers.Contract(address, abi, signer);

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
                                        var payable = null;
                                        // 将输入框中的值添加到参数数组中
                                        div.querySelectorAll('input').forEach(inputEl => {
                                            if (inputEl.className == 'payable-input') {
                                                if (inputEl.value) {
                                                    // 确保转换为整数字符串
                                                    const valueInWei = BigInt(inputEl.value * Math.pow(10, 18)).toString();
                                                    payable = {
                                                        value: ethers.BigNumber.from(valueInWei), // 设置发送的 ETH 数量
                                                        gasLimit: 3000000,
                                                    };     
                                                }
                                            } else {
                                                try {
                                                    // 尝试解析 inputEl.value 为一个数组: ["0x9A676e781A523b5d0C0e43731313A708CB607508"]
                                                    const valueArray = JSON.parse(inputEl.value);
                                                    if (Array.isArray(valueArray)) {
                                                        // 如果成功解析为数组，则将整个数组推入 args
                                                        args.push(valueArray);
                                                    } else {
                                                        throw new Error("Input value is not an array.");
                                                    }
                                                } catch (error) {
                                                    // 如果不是数组，则将原始字符串推入 args
                                                    args.push(inputEl.value);
                                                }
                                            }
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
                                            var result = {};
                                            if (payable) {
                                                result = await contract[func](...args, { ...payable });
                                            } else {
                                                result = await contract[func](...args,{ gasLimit: 3000000 });
                                            }

                                            if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
                                                console.log(result);
                                            }
                                            // 在结果区域显示成功信息及结果
                                            const p = document.createElement('p');
                                            p.className = 'result-success';
                                            p.innerHTML = "调用成功: " + func + ": <br>" + result;
                                            if (payable) {
                                                p.innerHTML = p.innerHTML + ": <br>" + "ETH 发送成功: 金额: " + ethers.utils.formatEther(payable.value) + " ETH";
                                            }
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
                                        
                                    // 在所有输入参数之后添加一个额外的输入框
                                    if (item.stateMutability === 'payable') {
                                        const payableContainer = document.createElement('div');
                                        payableContainer.className = 'inner-container';

                                        // 为 payable 输入框创建一个标签
                                        const payableLabel = document.createElement('label');
                                        payableLabel.innerText = '发送ETH: ';
                                        payableContainer.appendChild(payableLabel);

                                        // 为 payable 输入框创建一个文本输入框
                                        const payableInputEl = document.createElement('input');
                                        payableInputEl.type = 'text';
                                        payableInputEl.placeholder = 'payable方法(ETH)';
                                        payableInputEl.className = 'payable-input';
                                        // 将标签和输入框添加到容器中
                                        payableContainer.appendChild(payableInputEl);

                                        // 将 payable 容器添加到 div 中
                                        div.appendChild(payableContainer);
                                    }
                                }else if (item.type === 'event') {
                                    // 动态创建事件监听器
                                    const filter = contract.filters[item.name] ? contract.filters[item.name]() : contract.filters[item.name](...item.anonymous ? [] : item.inputs.map(input => input.indexed));

                                    // 添加事件监听器，当事件发生时，执行回调函数。
                                    contract.on(filter, (...args) => {
                                        const p = document.createElement('p');
                                        p.className = 'result-success';

                                        // 如果事件有参数，则格式化每个参数的信息。
                                        let eventStr = "事件触发: " + item.name + "(";
                                        if (item.inputs && item.inputs.length > 0) {
                                            eventStr += item.inputs.map((input, index) => {
                                              return input.name + ":" + args[index]
                                            }).join(",");
                                        }
                                        eventStr += ")";

                                        // 将构建好的事件字符串设置为段落元素的内容。
                                        p.innerHTML = eventStr;
                                        // 将段落元素添加到结果显示区域。
                                        results.appendChild(p);

                                        results.scrollTop = results.scrollHeight;
                                    });
                                }
                            });


                            
                            // 创建一个发送eth按钮

                            // 创建一个 div 元素用于显示函数参数
                            const div = document.createElement('div');
                            // 为 div 设置 ID
                            div.id = "params-send";
                            div.className = 'param-group'; // 添加一个类名
                            // 初始时显示参数输入框
                            div.style.display = 'block';

                            // 创建一个按钮，用于调用合约中的函数
                            const button = document.createElement('button');
                            // 设置按钮文本为函数名称
                            button.innerText = "发送 ETH";

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
                                var args = [];
                                // 将输入框中的值添加到参数数组中
                                div.querySelectorAll('input').forEach(inputEl => {
                                    args.push(inputEl.value);
                                });

                                try {
                                    var wei = BigInt(args[0] * Math.pow(10, 18)).toString()
                                    const limit = args[1]
                                    // 获取签名者对象
                                    const signer = provider.getSigner(1);
                                    // 构建交易数据
                                    if (args[2]){
                                        const tx = await signer.sendTransaction({
                                            to: address,
                                            value: ethers.BigNumber.from(wei), // 发送的 ETH 金额
                                            gasLimit: ethers.BigNumber.from(limit), // 设置 gas 限制
                                            data: args[2],
                                        }); 
                                    
                                        // 等待交易确认
                                        await tx.wait();
                                    }else{
                                        const tx = await signer.sendTransaction({
                                            to: address,
                                            value: ethers.BigNumber.from(wei), // 发送的 ETH 金额
                                            gasLimit: ethers.BigNumber.from(limit), // 设置 gas 限制
                                        }); 
                                    
                                        // 等待交易确认
                                        await tx.wait();
                                    }


                                    // 显示成功信息
                                    const p = document.createElement('p');
                                    p.className = 'result-success';
                                    p.innerHTML = "ETH 发送成功: <br>金额: " + ethers.utils.formatEther(ethers.BigNumber.from(wei)) + " ETH, Gas Limit: " + limit;
                                    document.getElementById('results').appendChild(p);
                                    document.getElementById('results').scrollTop = document.getElementById('results').scrollHeight;
                                } catch (error) {
                                    // 显示错误信息
                                    const p = document.createElement('p');
                                    p.className = 'result-error';
                                    p.innerHTML = "发送 ETH 失败: <br>" + error.message;
                                    document.getElementById('results').appendChild(p);
                                    document.getElementById('results').scrollTop = document.getElementById('results').scrollHeight;
                                }
                            };

                            // wei amount输入参数
                            const innerContainer = document.createElement('div');
                            innerContainer.className = 'inner-container'; // 添加一个类名

                            // 为每个输入参数创建一个标签
                            const label = document.createElement('label');
                            // 设置标签文本为参数名称
                            label.innerText = 'eth amount: ';
                            // 将标签添加到参数输入区域
                            div.appendChild(label);
                            innerContainer.appendChild(label);

                            // 为每个输入参数创建一个文本输入框
                            const inputEl = document.createElement('input');
                            // 设置输入框类型为文本
                            inputEl.type = 'text';
                            inputEl.value = "1";
                            // 将输入框添加到参数输入区域
                            innerContainer.appendChild(inputEl);

                            div.appendChild(innerContainer);

                            // gas limit输入参数
                            const innerContainer2 = document.createElement('div');
                            innerContainer2.className = 'inner-container'; // 添加一个类名

                            // 为每个输入参数创建一个标签
                            const label2 = document.createElement('label');
                            // 设置标签文本为参数名称
                            label2.innerText = 'gas limit: ';
                            // 将标签添加到参数输入区域
                            div.appendChild(label2);
                            innerContainer2.appendChild(label2);

                            // 为每个输入参数创建一个文本输入框
                            const inputE2 = document.createElement('input');
                            // 设置输入框类型为文本
                            inputE2.type = 'text';
                            inputE2.value = "3000000";
                            // 将输入框添加到参数输入区域
                            innerContainer2.appendChild(inputE2);

                            div.appendChild(innerContainer2);
                            
                            // data输入参数
                            const innerContainer3 = document.createElement('div');
                            innerContainer3.className = 'inner-container'; // 添加一个类名

                            // 为每个输入参数创建一个标签
                            const label3 = document.createElement('label');
                            // 设置标签文本为参数名称
                            label3.innerText = 'data: ';
                            // 将标签添加到参数输入区域
                            div.appendChild(label3);
                            innerContainer3.appendChild(label3);

                            // 为每个输入参数创建一个文本输入框
                            const inputE3 = document.createElement('input');
                            // 设置输入框类型为文本
                            inputE3.type = 'text';
                            inputE3.placeholder = "0x00";
                            // 将输入框添加到参数输入区域
                            innerContainer3.appendChild(inputE3);

                            div.appendChild(innerContainer3);
                        }
                         
                        // 选择账户
                        function selectAccount() {
                            const selectedIndex = +document.getElementById("account").value;
                            if ('${networkName}' == 'localhost') {
                                // 从提供者获取一个签名者对象，它将用于发送带有私钥签名的交易
                                signer = provider.getSigner(selectedIndex);
                                // 使用合约地址、ABI 和签名者创建一个合约实例
                                contract = new ethers.Contract(address, abi, signer);
                            }
                            const txt = document.getElementById("account").options[selectedIndex].text
                            navigator.clipboard.writeText(txt);
                            console.log(txt)
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

                    #account {
                        border-radius: 4px;
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
        fs.writeFile(path.join(path.dirname(__dirname), contractHtml), htmlContent, err => {
            if (err) throw err;
            console.error("生成调试 html,请用 Live Server 调试:", path.join(path.dirname(__dirname), contractHtml));
        });
    })
    .catch(error => {
        console.error(error); // 如果发生错误，则输出错误信息。
        process.exit(1); // 退出进程，并返回错误代码 1。
    });
