import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import UserLayout from '../layouts/UserLayout'
import AdminLayout from '../layouts/AdminLayout'
import RequireAuth from './RequireAuth'

// Trang công khai
import HomePage from '../pages/public/HomePage'
import MarketPage from '../pages/public/MarketPage'
import CryptoDetailPage from '../pages/public/CryptoDetailPage'
import LoginPage from '../pages/public/LoginPage'
import RegisterPage from '../pages/public/RegisterPage'

// Trang người dùng (cần đăng nhập)
import TradePage from '../pages/user/TradePage'
import WalletPage from '../pages/user/WalletPage'
import TransactionsPage from '../pages/user/TransactionsPage'
import CashRequestsPage from '../pages/user/CashRequestsPage'
import ProfilePage from '../pages/user/ProfilePage'
import SupportPage from '../pages/user/SupportPage'
import NotificationsPage from '../pages/user/NotificationsPage'

// Trang quản trị (chỉ admin)
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage'
import AdminCryptosPage from '../pages/admin/AdminCryptosPage'
import AdminTransactionsPage from '../pages/admin/AdminTransactionsPage'
import AdminCashPage from '../pages/admin/AdminCashPage'
import AdminTicketsPage from '../pages/admin/AdminTicketsPage'
import AdminContentPage from '../pages/admin/AdminContentPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/market/:symbol" element={<CryptoDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Nhóm trang người dùng: RequireAuth bọc UserLayout, các con render qua Outlet */}
        <Route
          element={
            <RequireAuth>
              <UserLayout />
            </RequireAuth>
          }
        >
          <Route path="/trade" element={<TradePage />} />
          <Route path="/trade/:symbol" element={<TradePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/cash" element={<CashRequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Nhóm trang quản trị: tách biệt giao diện hoàn toàn */}
        <Route
          element={
            <RequireAuth adminOnly>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/cryptos" element={<AdminCryptosPage />} />
          <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          <Route path="/admin/cash" element={<AdminCashPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
