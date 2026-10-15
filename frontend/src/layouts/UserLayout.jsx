import { NavLink, Outlet } from 'react-router-dom'

/**
 * Layout người dùng: thanh điều hướng con bên dưới header chung.
 */
export default function UserLayout() {
  return (
    <div className="subnav-wrap">
      <nav className="subnav">
        <NavLink to="/trade" end>
          Giao dịch
        </NavLink>
        <NavLink to="/wallet">Tài sản</NavLink>
        <NavLink to="/cash">Nạp / Rút</NavLink>
        <NavLink to="/transactions">Lịch sử GD</NavLink>
        <NavLink to="/notifications">Thông báo</NavLink>
        <NavLink to="/support">Hỗ trợ</NavLink>
        <NavLink to="/profile">Hồ sơ</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
