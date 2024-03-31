// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// giao tiếp token ở low level, có một số trường hợp không chạy đc không trả về null mà trả về 0 hay 1 cai gì đó và transactions không bị report
// thư viện này giúp đảm bảo khi 1 transaction bị fail thì sẽ bị revert
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// giúp người dùng không không tương tác quá nhiều đến withdraw
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Vault is Ownable,AccessControlEnumerable {
    IERC20 private token;
    uint256 public maxWithdrawAmount;
    bool public withdrawEnable;
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    // event deposit
      event Deposit(address indexed depositor, uint256 amount);
    // event withdraw
      event Withdraw(address indexed to , uint256 amount);


        constructor () Ownable(msg.sender){
            _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        }
      // owner()
        //Trả về địa chỉ của chủ sở hữu hiện tại.
    modifier onlyWithdrawer (){
            require(owner() == _msgSender() || hasRole(WITHDRAWER_ROLE,_msgSender()), "Caller is not a withrawer");
            _;
    }

  // onlyWoner from library Ownable openzeppelin
  function setWithdrawEnable(bool _inabled) public onlyOwner {
    withdrawEnable = _inabled;
  }

  function setMaxWithdrawAmount(uint256 _max) public onlyOwner {
    maxWithdrawAmount = _max;
  } 

  function setToken(IERC20 _token) public onlyOwner{
    token =_token;

  }

  function withdraw(address _to, uint256 _amount) external onlyWithdrawer {
    // yêu cầu cho rút thì sẽ được rút
    require(withdrawEnable, "withdraw is not available");
    // yêu cầu nhỏ hơn số lượng tối đa
    require(_amount <= maxWithdrawAmount, "Exceed maximun amount");
    //bạn đang kiểm tra xem số lượng rút ra có vượt quá maxWithdrawAmount hay không
    require(_amount <= token.balanceOf(address(this)), "Insufficient Vault balance");
    token.transfer(_to, _amount);
    emit Withdraw(_to,_amount);
  }

  function deposit(uint256 _amount) external {
    require(token.balanceOf(msg.sender) >= _amount, "Insufficient account balance");
    require(address(token) != address(0), "Token is not set");
    // hàm này giúp lấy tiền trong ví của user và bỏ trong vault
    //safeTransferFrom : phải được người sử dụng approve để lấy thì mới lấy được
    SafeERC20.safeTransferFrom(token, msg.sender , address(this), _amount);
    emit Deposit(msg.sender, _amount);
  }
}