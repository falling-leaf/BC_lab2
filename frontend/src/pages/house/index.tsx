import {Button, Table, Modal, Input} from 'antd';
import {useEffect, useState} from 'react';
import {roomContract, web3} from "../../utils/contracts";
import './index.css';

const { Column, ColumnGroup } = Table;

const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
// TODO change according to your configuration
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'

interface House {
    tokenId: number;
    owner: string;
    listedTimestamp: number;
    price: number; // 房屋价格
    onSale: boolean; // 是否在售
    onSaleTimestamp: number; // 挂单时间
}

const HousePage = () => {

    const [account, setAccount] = useState('')
    const [managerAccount, setManagerAccount] = useState('')
    const [houses, setHouses] = useState<House[]>([])
    const [onSaleHouses, setOnSaleHouses] = useState<House[]>([])
    const [settingPrice, setSettingPrice] = useState(0)

    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [CopeSaleHouse, setCopeSaleHouse] = useState<House | null>(null);
    const [CopeBuyHouse, setCopeBuyHouse] = useState<House | null>(null);

    const showSaleModal = (record: House) => {
        setIsSaleModalOpen(true);
        setCopeSaleHouse(record);
    };

    const handleSaleOk = (price: number) => {
        onSaleHouse(CopeSaleHouse!.tokenId, price)
        setIsSaleModalOpen(false);
    };

    const handleSaleCancel = () => {
        setIsSaleModalOpen(false);
    };

    const showBuyModal = (record: House) => {
        setIsBuyModalOpen(true);
        setCopeBuyHouse(record);
    };

    const handleBuyOk = () => {
        onBuyHouse(CopeBuyHouse!.tokenId)
        setIsBuyModalOpen(false);
    };

    const handleBuyCancel = () => {
        setIsBuyModalOpen(false);
    };

    useEffect(() => {
        // 初始化检查用户是否已经连接钱包
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        const initCheckAccounts = async () => {
            // @ts-ignore
            const {ethereum} = window;
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                // 尝试获取连接的用户账户
                const accounts = await web3.eth.getAccounts()
                if(accounts && accounts.length) {
                    setAccount(accounts[0])
                }
            }
        }
        initCheckAccounts()
    }, [])

    useEffect(() => {
        const GetManager = async () => {
            if (roomContract) {
                try {
                    const manager: string = await roomContract.methods.getManager().call()
                    setManagerAccount(manager)
                }
                catch (error: any) {
                    console.log(error)
                    alert(error.message)
                }
            }
        }
        GetManager()
    }, [])

    const onClaimTokenAirdrop = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (roomContract) {
            try {
                await roomContract.methods.airdrop().send({
                    from: account
                })
                alert('You have claimed airdrop.')
            } catch (error: any) {
                alert(error.message)
            }

        } else {
            alert('Contract not exists.')
        }
    }

    const onGetMyHouse = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (roomContract) {
            try {
                const houses: House[] = await roomContract.methods.getMyHouses().call({
                    from: account
                })
                console.log(houses)
                setHouses(houses)
            } catch (error: any) {
                alert(error.message)
            }

        } else {
            alert('Contract not exists.')
        }
    }

    const onGetOnSaleHouse = async () => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (roomContract) {
            try {
                const houses: House[] = await roomContract.methods.getSellingHouses().call({
                    from: account
                })
                console.log(houses)
                setOnSaleHouses(houses)
            } catch (error: any) {
                alert(error.message)
            }

            } else {
            alert('Contract not exists.')
        }
    }

    const onBuyHouse = async (houseId: number) => {
        if (account === '') {
            alert('You have not connected wallet yet.')
            return;
        }
    
        if (roomContract) {
            try {
                // 获取房屋信息以获取价格
                const house: House = await roomContract.methods.getHouseInfo(houseId).call(); // 确保此函数可以从合约中获取房屋信息
                const housePrice = BigInt(house.price) * BigInt("1000000000000000000"); // 获取房屋价格
    
                console.log(`House ID: ${houseId}, Price: ${housePrice}`);
    
                // 执行购买房屋交易
                const tx = await roomContract.methods.buyHouse(houseId).send({
                    from: account,
                    value: housePrice.toString() // 将房屋价格作为以太币数量传递
                });
    
                console.log(tx);
                alert('You have bought the house.');
                onGetMyHouse(); // 刷新用户房屋列表
                onGetOnSaleHouse(); // 刷新可购房屋列表
            } catch (error: any) {
                alert(error.message);
            }
        } else {
            alert('Contract not exists.');
        }
    }
    

    const onSaleHouse = async (houseId: number, price: number) => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (roomContract) {
            try {
                console.log(houseId, price)
                const tx = await roomContract.methods.saleHouse(houseId, price).send({
                    from: account
                })
                console.log(tx)
                alert('You have put the house on sale.')
                onGetMyHouse();
                onGetOnSaleHouse();
            } catch (error: any) {
                alert(error.message)
            }

            } else {
            alert('Contract not exists.')
        }
    }

    const onClickConnectWallet = async () => {
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        // @ts-ignore
        const {ethereum} = window;
        if (!Boolean(ethereum && ethereum.isMetaMask)) {
            alert('MetaMask is not installed!');
            return
        }

        try {
            // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
            if (ethereum.chainId !== GanacheTestChainId) {
                const chain = {
                    chainId: GanacheTestChainId, // Chain-ID
                    chainName: GanacheTestChainName, // Chain-Name
                    rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
                };

                try {
                    // 尝试切换到本地网络
                    await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: chain.chainId}]})
                } catch (switchError: any) {
                    // 如果本地网络没有添加到Metamask中，添加该网络
                    if (switchError.code === 4902) {
                        await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain]
                        });
                    }
                }
            }

            // 小狐狸成功切换网络了，接下来让小狐狸请求用户的授权
            await ethereum.request({method: 'eth_requestAccounts'});
            // 获取小狐狸拿到的授权用户列表
            const accounts = await ethereum.request({method: 'eth_accounts'});
            // 如果用户存在，展示其account，否则显示错误信息
            setAccount(accounts[0] || 'Not able to get accounts');
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div className='container'>
            <div>
                <h1>房屋交易系统</h1>
                <Button onClick={onClaimTokenAirdrop}>领取房屋空投</Button>
                <div>管理员地址：{managerAccount}</div>
                <div className='account'>
                    {account === '' && <Button onClick={onClickConnectWallet}>连接钱包</Button>}
                    <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                </div>
                <Button onClick={onClickConnectWallet}>连接钱包</Button>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <div>我的房屋
                        <Button onClick={onGetMyHouse}>查看我的房屋</Button>
                        <Table<House> dataSource={houses}>
                            <Column title="编号" key="tokenId" render={(text, record) => record.tokenId !== undefined ? record.tokenId.toString() : '无编号'} />
                            <Column title="所有人" dataIndex="owner" key="owner" />
                            <Column title="价格" key="price" render={(text, record) => record.price !== undefined ? record.price.toString() : '无编号'} />
                            <Column title="是否在售" key="onSale" render={(text, record) => record.onSale !== undefined ? record.onSale.toString() : '无编号'} />
                            <Column title="挂单时间" key="onSaleTimestamp" render={(text, record) => record.onSaleTimestamp !== undefined ? record.onSaleTimestamp.toString() : '无编号'} />
                            <Column
                                title="Action"
                                key="action"
                                render={(_: any, record: House) => (
                                    <div>
                                        <Button onClick={() => showSaleModal(record)}>出售</Button>
                                        <Modal title="Basic Modal" open={isSaleModalOpen} onOk={() =>handleSaleOk(settingPrice)} onCancel={handleSaleCancel}>
                                            <Input placeholder="请输入价格"
                                                onChange={(e) => setSettingPrice(parseInt(e.target.value))}
                                             />
                                        </Modal>
                                    </div>
                                    
                                )}
                            />
                        </Table>
                    </div>
                    <div>买入房屋
                        <Button onClick={onGetOnSaleHouse}>查看可购房屋</Button>
                        <Table<House> dataSource={onSaleHouses}>
                            <Column title="编号" key="tokenId" render={(text, record) => record.tokenId !== undefined ? record.tokenId.toString() : '无编号'} />
                            <Column title="所有人" dataIndex="owner" key="owner" />
                            <Column title="价格" key="price" render={(text, record) => record.price !== undefined ? record.price.toString() : '无编号'} />
                            <Column title="是否在售" key="onSale" render={(text, record) => record.onSale !== undefined ? record.onSale.toString() : '无编号'} />
                            <Column title="挂单时间" key="onSaleTimestamp" render={(text, record) => record.onSaleTimestamp !== undefined ? record.onSaleTimestamp.toString() : '无编号'} />
                            <Column
                                title="Action"
                                key="action"
                                render={(_: any, record: House) => (
                                    <div>
                                        <Button onClick={() => showBuyModal(record)}>购买</Button>
                                        <Modal title="Basic Modal" open={isBuyModalOpen} onOk={() =>handleBuyOk()} onCancel={handleBuyCancel}>
                                            <p>你确定要购买该房屋吗？</p>
                                        </Modal>
                                    </div>
                                    
                                )}
                            />
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HousePage;