import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/common/Toast'
import { formatDate, userStatusLabels } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [savingName, setSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  if (!user) return null

  const saveName = async (e) => {
    e.preventDefault()
    setSavingName(true)
    try {
      const res = await authApi.updateMe({ name })
      setUser({ ...user, name: res.data.user.name })
      toast('Đã cập nhật thông tin cá nhân')
    } catch (err) {
      toast(err.message || 'Cập nhật thất bại', 'error')
    } finally {
      setSavingName(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmNew) {
      toast('Mật khẩu mới nhập lại không khớp', 'error')
      return
    }
    setChangingPassword(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      toast('Đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNew('')
    } catch (err) {
      toast(err.message || 'Đổi mật khẩu thất bại', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="page narrow-page">
      <h1 className="page-title">Hồ sơ cá nhân</h1>

      <div className="card">
        <h2 className="card-title">Thông tin tài khoản</h2>
        <table className="table key-value">
          <tbody>
            <tr>
              <td>Tên hiển thị</td>
              <td>{user.name}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{user.email}</td>
            </tr>
            <tr>
              <td>Vai trò</td>
              <td>{user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</td>
            </tr>
            <tr>
              <td>Trạng thái tài khoản</td>
              <td>
                <StatusBadge value={user.status} labels={userStatusLabels} />
              </td>
            </tr>
            <tr>
              <td>Ngày tham gia</td>
              <td>{formatDate(user.createdAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        <form className="card" onSubmit={saveName}>
          <h2 className="card-title">Cập nhật tên hiển thị</h2>
          <div className="form-group">
            <label htmlFor="profile-name">Tên hiển thị mới</label>
            <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={50} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingName}>
            {savingName ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        <form className="card" onSubmit={changePassword}>
          <h2 className="card-title">Đổi mật khẩu</h2>
          <div className="form-group">
            <label htmlFor="cur-pass">Mật khẩu hiện tại</label>
            <input id="cur-pass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="new-pass">Mật khẩu mới</label>
            <input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-new-pass">Nhập lại mật khẩu mới</label>
            <input id="confirm-new-pass" type="password" value={confirmNew} onChange={(e) => setConfirmNew(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-outline" disabled={changingPassword}>
            {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">Phiên đăng nhập</h2>
        <p className="form-hint">Đăng xuất sẽ xóa token khỏi trình duyệt của bạn.</p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
