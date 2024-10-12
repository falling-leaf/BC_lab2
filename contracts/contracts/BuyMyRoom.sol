// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Uncomment the line to use openzeppelin/ERC721,ERC20
// You can use this dependency directly because it has been installed by TA already
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BuyMyRoom is ERC721 {

    // use a event if you want
    // to represent time you can choose block.timestamp
    event HouseListed(uint256 tokenId, uint256 price, address owner);

    // maybe you need a struct to store car information
    struct House {
        uint256 tokenId;
        address owner;
        uint256 listedTimestamp;
        uint256 price; // 房屋价格
        bool onSale; // 是否在售
        uint256 onSaleTimestamp; // 挂单时间
        // ...
    }

    mapping(uint256 => House) public houses; // A map from house-index to its information
    // ...
    // TODO add any variables and functions if you want

    address[] public users; // 用户
    address manager;
    uint256 private token_cnt = 0; // 房屋总数
    mapping(address => bool) public AirDropped; // 空投过的用户

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        manager = msg.sender; // 管理员就是部署的账户（在config中配置的那个）
    }

    // 功能零：直接获取房屋用以测试
    function airdrop() external {
        require(AirDropped[msg.sender] == false, "This user has claimed airdrop already");
        uint256 tokenId = 0;
        // 随机生成三个房屋
        for (uint i = 0; i < 3; i++) {
            tokenId = token_cnt; // 生成唯一的 tokenId
            token_cnt++; // 房屋总数加一
            _mint(msg.sender, tokenId); // 铸造代币
            // uint256 new_price = block.timestamp % 100; // 随机生成价格
            houses[tokenId] = House(tokenId, msg.sender, block.timestamp, 0, false, 0); // 初始化房屋信息
        }
        AirDropped[msg.sender] = true;
    }

    // 功能一：用户查看拥有房屋
    function getMyHouses() public view returns(House[] memory) {
        // 由于memory是一个静态数组，因此需要先计数
        uint cnt = 0;
        for (uint i = 0; i < token_cnt; i++) {
            if (houses[i].owner == msg.sender)
                cnt++;
        }
        House[] memory res_value = new House[](cnt);

        cnt = 0;
        for (uint i = 0; i < token_cnt; i++) {
            if (houses[i].owner == msg.sender) {
                res_value[cnt] = houses[i];
                cnt++;
            }
        }
        return res_value;
    }

    // 功能二：查看所有出售中的房产
    function getSellingHouses() public view returns(House[] memory) {
        // 由于memory是一个静态数组，因此需要先计数
        uint cnt = 0;
        for (uint i = 0; i < token_cnt; i++) {
            // 如果在售，就计数
            if (houses[i].onSale) 
                cnt++;
        }
        House[] memory res_value = new House[](cnt);

        cnt = 0;
        for (uint i = 0; i < token_cnt; i++) {
            // 遍历所有房屋，如果在售，就添加到结果数组中
            if (houses[i].onSale) {
                res_value[cnt] = houses[i];
                cnt++;
            }
        }
        return res_value;
    }

    // 功能三：查询特定房子的信息
    function getHouseInfo(uint256 houseId) public view returns(House memory) {
        return houses[houseId];
    }

    // 功能四：出售房屋
    function saleHouse(uint256 houseId, uint256 price) public returns(bool) {
        require (houses[houseId].owner == msg.sender, "You are not the owner of this house");
        require (houses[houseId].onSale == false, "This house is already on sale");
        houses[houseId].onSale = true; // 房屋在售
        houses[houseId].onSaleTimestamp = block.timestamp; // 挂单时间
        houses[houseId].price = price; // 房屋价格
        return true;
    }

    // 功能五：购买房屋+手续费
    function buyHouse(uint256 houseId) public returns(bool) {
        require (houses[houseId].onSale, "This house is not on sale");
        require (msg.sender != houses[houseId].owner, "You cannot buy your own house");
        require (msg.sender.balance >= houses[houseId].price, "You don't have enough balance");
        // 开始交易
        uint fee = houses[houseId].price / 10; // 手续费
        payable(manager).transfer(fee); // 转账给管理员
        payable(houses[houseId].owner).transfer(houses[houseId].price - fee); // 转账给房主
        _transfer(houses[houseId].owner, msg.sender, houseId); // 转移房产
        houses[houseId].onSale = false; // 房屋不再在售
        houses[houseId].onSaleTimestamp = 0; // 挂单时间清零
        houses[houseId].owner = msg.sender; // 房主变更
        return true;
    }

    // ...
    // TODO add any logic if you want
}