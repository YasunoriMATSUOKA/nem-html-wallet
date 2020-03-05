const fetchNodeList = () => {
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const nodeListUrl = "https://s3-ap-northeast-1.amazonaws.com/xembook.net/data/v4/node.json";
    const url = proxyUrl + nodeListUrl;
    const nodeListUrlFoundation = {
        "http": [
            "alice2.nem.ninja",
            "alice3.nem.ninja",
            "alice4.nem.ninja",
            "alice5.nem.ninja",
            "alice6.nem.ninja",
            "alice7.nem.ninja"
        ],
        "https": [],
        "apostille": [],
        "catapult_test": [],
        "last_update": "",
        "last_version": "",
        "last_compatible": false
    }
    const nodeList = fetch(url).then((response) => {
        return response.json();
    }).then((json) => {
        console.log("優良ノードリスト", json);
        return json;
    }).catch((error) => {
        console.error(error);
        return nodeListUrlFoundation;
    });
    return nodeList;
}

const filterHttpNodeList = (nodeList) => {
    const httpNodeList = nodeList.http.map((element) => {
        return "http://" + element;
    });
    console.log("httpノードリスト: ", httpNodeList);
    return httpNodeList;
}

const selectRandomHttpNode = (httpNodeList) => {
    const randomHttpNode = httpNodeList[Math.floor(httpNodeList.length * Math.random())];
    console.log("ランダムに選んだhttpノード: ", randomHttpNode);
    return randomHttpNode;
}

const refreshNode = async () => {
    const nodeList = await fetchNodeList();
    const httpNodeList = filterHttpNodeList(nodeList);
    const randomHttpNodeUrl = selectRandomHttpNode(httpNodeList);
    document.getElementById("nodeUrl").textContent = randomHttpNodeUrl;
}

const fetchAccountInfo = async (nodeUrl, address) => {
    const url = nodeUrl + ":7890" + "/account/get?address=" + address;
    const accountInfo = await fetch(url).then((res) => {
        return res.json();
    }).then((json) => {
        console.log("accountInfo", json);
        return json;
    }).catch((error) => {
        console.error(error);
    });
    return accountInfo;
}

const filterBalanceFromAccountInfo = (accountInfo) => {
    const balance = accountInfo ? accountInfo.account.balance / 1000000 : 0;
    console.log("balance", balance);
    return balance;
}

const showBalance = async () => {
    const nodeUrl = document.getElementById("nodeUrl").textContent;
    const address = document.getElementById("address").value;
    const accountInfo = await fetchAccountInfo(nodeUrl, address);
    const balance = filterBalanceFromAccountInfo(accountInfo);
    document.getElementById("balance").textContent = balance;
}

const fetchAccountMosaicOwned = async (nodeUrl, address) => {
    const url = nodeUrl + ":7890" + "/account/mosaic/owned?address=" + address;
    const accountMosaicOwned = await fetch(url).then((res) => {
        return res.json();
    }).then((json) => {
        console.log("accountMosaicOwned", json);
        return json;
    }).catch((error) => {
        console.error(error);
    });
    return accountMosaicOwned;
}

const fetchMosaicDefinitions = async (nodeUrl, namespace) => {
    const url = nodeUrl + ":7890" + "/namespace/mosaic/definition/page?namespace=" + namespace;
    const mosaicDefinitions = await fetch(url).then((res) => {
        return res.json();
    }).then((json) => {
        console.log("mosaicDefinitions", json);
        return json;
    }).catch((error) => {
        console.error(error);
    });
    return mosaicDefinitions;
}

const mosaicOwned = (accountMosaicOwned) => {
    return accountMosaicOwned.data.filter((element) => {
        return element.mosaicId.namespaceId !== "nem";
    })
}

const fetchTokenList = async (nodeUrl, accountMosaicOwned) => {
    return Promise.all(mosaicOwned(accountMosaicOwned).map(async (element) => {
        const namespace = element.mosaicId.namespaceId;
        const name = element.mosaicId.name;
        const tokenName = namespace + ":" + name;
        const quantity = element.quantity;
        const mosaicDefinitions = await fetchMosaicDefinitions(nodeUrl, namespace);
        console.log(namespace, mosaicDefinitions);
        const divisibility = mosaicDefinitions.data.filter((element)=>{
            console.log(element);
            return element.mosaic.id.namespaceId === namespace && element.mosaic.id.name === name;
        })[0].mosaic.properties.filter((element)=>{
            return element.name === "divisibility";
        })[0].value;
        console.log("divisibility", divisibility);
        const amount = quantity / Math.pow(10, divisibility);
        console.log("amount", amount);
        return {
            "amount": amount,
            "tokenName": tokenName
        };
    }))
}

const showBalanceList = (tokenList) => {
    const tokenListTable = document.getElementById("tokenList");
    
    tokenListTable.textContent = null;

    const tr = document.createElement("tr");
    const thAmount = document.createElement("th");
    const thTokenName = document.createElement("th");
    thAmount.textContent = "数量";
    thTokenName.textContent = "単位";
    tr.appendChild(thAmount);
    tr.appendChild(thTokenName);
    tokenListTable.appendChild(tr);
    
    tokenList.forEach((element) => {
        const tr = document.createElement("tr")
        const tdAmount = document.createElement("td")
        const tdTokenName = document.createElement("td")
        tdAmount.textContent = element.amount;
        tdTokenName.textContent = element.tokenName;
        tr.appendChild(tdAmount);
        tr.appendChild(tdTokenName);
        tokenListTable.appendChild(tr);
    });
}

const showTokenList = async () => {
    const nodeUrl = document.getElementById("nodeUrl").textContent;
    const address = document.getElementById("address").value;
    const accountMosaicOwned = await fetchAccountMosaicOwned(nodeUrl, address);
    const tokenList = await fetchTokenList(nodeUrl, accountMosaicOwned);
    showBalanceList(tokenList);
}

const showAllBalance = () => {
    showBalance();
    showTokenList();
}

(async () => {
    await refreshNode();
    showAllBalance();
})();