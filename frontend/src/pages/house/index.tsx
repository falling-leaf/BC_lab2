import {Button, Table} from 'antd';
import {useEffect, useState} from 'react';
import {roomContract, web3} from "../../utils/contracts";
import './index.css';
import { on } from 'events';

const { Column, ColumnGroup } = Table;

const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
// TODO change according to your configuration
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'

interface House {
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



    // useEffect(() => {
    //     const getAccountInfo = async () => {
    //         if (myERC20Contract) {
    //             const ab = await myERC20Contract.methods.balanceOf(account).call()
    //             setAccountBalance(ab)
    //         } else {
    //             alert('Contract not exists.')
    //         }
    //     }

    //     if(account !== '') {
    //         getAccountInfo()
    //     }
    // }, [account])

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
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (roomContract) {
            try {
                const tx = await roomContract.methods.buyHouse(houseId).send({
                    from: account
                })
                console.log(tx)
                alert('You have bought the house.')
                onGetMyHouse();
            } catch (error: any) {
                alert(error.message)
            }

            } else {
            alert('Contract not exists.')
        }
    }

    const onSaleHouse = async (houseId: number) => {
        if(account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (roomContract) {
            try {
                const tx = await roomContract.methods.saleHouse(houseId).send({
                    from: account
                })
                console.log(tx)
                alert('You have put the house on sale.')
                onGetMyHouse();
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
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <div>我的房屋
                        <Button onClick={onGetMyHouse}>查看我的房屋</Button>
                        <Table<House> dataSource={houses}>
                            <Column title="所有人" dataIndex="owner" key="owner" />
                            <Column title="价格" dataIndex="price" key="price" />
                            <Column title="是否在售" dataIndex="onSale" key="onSale" />
                            <Column title="挂单时间" dataIndex="onSaleTimestamp" key="onSaleTimestamp" />
                            {/* <Column
                                title="Action"
                                key="action"
                                render={(_: any, record: House) => (
                                    <div>
                                        <Button onClick={onBuyHouse(record.houseId)}>出售</Button>
                                    </div>
                                )}
                            /> */}
                        </Table>
                    </div>
                    <div>买入房屋
                        <Button onClick={onGetOnSaleHouse}>查看可购房屋</Button>
                        <Table<House> dataSource={onSaleHouses}>
                            <Column title="所有人" dataIndex="owner" key="owner" />
                            <Column title="价格" dataIndex="price" key="price" />
                            <Column title="是否在售" dataIndex="onSale" key="onSale" />
                            <Column title="挂单时间" dataIndex="onSaleTimestamp" key="onSaleTimestamp" />
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HousePage;