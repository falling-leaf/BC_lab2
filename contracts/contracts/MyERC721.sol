// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyERC721 is ERC721 {

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId); // 调用内部的 _mint 函数
    }

    function transfer(address from, address to, uint256 tokenId) public  {
        _transfer(from, to, tokenId); // 调用内部的 _transfer 函数
    }
}
