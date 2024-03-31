//SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0 <0.9.0;

//openzeppelin library
//https://docs.openzeppelin.com/contracts/5.x/access-control


// chuẩn ERC20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// thừa hưởng OwnerShip, modifiers chỉ dành cho Owner
//Ownable: Đây cũng là một tiện ích từ OpenZeppelin cho phép hạn chế sử dụng của một số chức năng chỉ với người sở hữu hợp đồng.
import "@openzeppelin/contracts/access/Ownable.sol";
// thừa hưởng chức năng bơm token
//ERC20Burnable: Đây là một tiện ích từ OpenZeppelin cho phép chủ sở hữu hợp đồng đốt (hủy) token.
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// Debugging with Hardhat Network
import "hardhat/console.sol";

contract Floppy is ERC20("Floppy", "FLP"), ERC20Burnable,Ownable{
    // Đây là trạng thái biến được sử dụng để cung cấp một giới hạn về số lượng token tối đa có thể được tạo ra. 
    // Nó được đặt thành 50 tỷ token, vì đơn vị được đặt thành 10^18 (định dạng chuẩn cho ERC20 token).
    uint256 private cap = 50_000_000_000 * 10**uint256(18);
    
    //Đây là hàm được gọi khi hợp đồng thông minh được triển khai. 
    //Nó sẽ tạo ra số lượng token tối đa và gán cho người triển khai hợp đồng.  
    constructor() Ownable(msg.sender) {
        // initialOwner = msg.sender;
        _mint(msg.sender, cap);
        //console.log in smart contract
    //      console.log(
    //     "Transferring owner %s cap %s tokens",
    //     msg.sender,
    //     cap
    // );
        transferOwnership(msg.sender);
    }

    //Là một chức năng chỉ người sở hữu hợp đồng mới có khả năng sử dụng, 
    //cho phép tạo ra thêm token mới, miễn là tổng số lượng không vượt quá giới hạn
    function mint(address to, uint256 amount) public onlyOwner {
        require(ERC20.totalSupply() + amount <= cap, "Floopy: cap exceeded" );
        _mint(to,amount);
    }
}

