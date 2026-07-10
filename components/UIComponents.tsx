// @ts-nocheck
'use client';
import React, { useEffect, useState } from 'react';
import {
  Search, Mic, Camera, MapPin, AlertCircle, X, Plus, Users, Bookmark,
  MessageCircle, Share2, FileText, FileDown, Star, Package, User, Store,
  Settings, ChevronDown, ShoppingCart, ShoppingBag, FolderOpen, PlusCircle, CheckCircle,
  Shield, Eye, Lock, MessageSquare, Send, Upload, Database, Folder, Trash2,
  AlertTriangle, Image as ImageIcon, BarChart, TrendingUp, Server, Tag, Wrench, Filter,
  ArrowLeft, Bell
} from 'lucide-react';

// LocalStorage helpers
export const safeGet = (key: string, fallback: any) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};
export const safeSet = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};

// Small Avatar
export const Avatar = ({ src, name, size = 40, userId = null }: { src?: string, name?: string, size?: number, userId?: string | null }) => {
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    if(!userId) return;
    const checkStatus = () => {
      const users = safeGet('bme_users', []);
      const user = users.find((u:any) => u.id === userId);
      if(user) setIsOnline(user.isOnline);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const StatusDot = () => isOnline ? <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10"></span> : null;

  if (src) {
    return (
      <div className="relative inline-block">
        <img src={src} alt={name || 'avatar'} onError={(e)=>{ (e.target as any).src = `https://i.pravatar.cc/150?u=${name||'bme'}` }} style={{ width: size, height: size }} className="rounded-full object-cover relative z-0" />
        <StatusDot />
      </div>
    );
  }
  return (
    <div className="relative inline-block">
      <div style={{ width: size, height: size }} className="rounded-full bg-gray-200 flex items-center justify-center text-gray-600"><User size={Math.max(12, Math.floor(size/3))} /></div>
      <StatusDot />
    </div>
  );
};

// =========================
// Custom Toast System
// =========================
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bme-toast', { detail: { message, type } }));
  }
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<any[]>([]);
  useEffect(() => {
    const handler = (e: any) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); // Tự động ẩn sau 3s
    };
    window.addEventListener('bme-toast', handler);
    return () => window.removeEventListener('bme-toast', handler);
  }, []);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-lg shadow-2xl border-l-4 bg-white pointer-events-auto transition-all transform animate-fade-in ${t.type === 'error' ? 'border-red-500 text-red-700' : t.type === 'success' ? 'border-green-500 text-green-700' : 'border-blue-500 text-blue-700'}`}>
          {t.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : t.type === 'success' ? <CheckCircle size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-blue-500" />}
          <p className="font-semibold text-sm">{t.message}</p>
        </div>
      ))}
    </div>
  );
};

// =========================
// Login / Register Modal
// =========================
export const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [role, setRole] = useState('user');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('merchant');
  const [password, setPassword] = useState('');
  const [cccd, setCccd] = useState('');
  const [taxId, setTaxId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(()=>{ 
    if(!isOpen){ 
      setIsLoginMode(true); setIsForgotMode(false); setPhone(''); setPassword(''); setCccd(''); setTaxId(''); setRole('user'); setBusinessType('merchant'); setErrorMsg(''); setName('');
    } 
  },[isOpen]);
  
  if(!isOpen) return null;

  const handleSubmit = () => {
    setErrorMsg('');
    if(!phone.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu');
      return;
    }
    const users: any[] = safeGet('bme_users', []);
    const found = users.find(u=>u.phone===phone);
    if(found){
      if(found.password !== password) {
        setErrorMsg('Sai mật khẩu! Vui lòng thử lại.');
        return;
      }
      if(found.status === 'Banned' || found.status === 'locked') {
        setErrorMsg('Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng');
        return;
      }
      
      // Cập nhật trạng thái Online thời gian thực cho tài khoản đang Login
      const nextUsers = users.map(u => u.id === found.id ? { ...u, isOnline: true, lastActive: Date.now() } : u);
      safeSet('bme_users', nextUsers);
      
      const loggedUser = nextUsers.find(u => u.id === found.id);
      safeSet('bme_current_user', loggedUser);
      onLogin && onLogin(loggedUser);
      showToast('Đăng nhập thành công', 'success');
      onClose();
      return;
    }
    if(isLoginMode) {
      setErrorMsg('Tài khoản không tồn tại. Vui lòng đăng ký!');
      return;
    }
    if(!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên');
      return;
    }
    if(!cccd.trim() && role !== 'user') {
      setErrorMsg('Vui lòng nhập CCCD');
      return;
    }
    const newUser = { id:`u_${Date.now()}`, name: name.trim(), phone, password, cccd, taxId: taxId||null, role, businessType: role === 'business' ? businessType : undefined, status: (role==='business'||role==='coordinator')? 'pending' : 'active', createdAt: new Date().toISOString(), isOnline: true, lastActive: Date.now() };
    users.push(newUser); safeSet('bme_users', users);
    if(newUser.status === 'active'){ safeSet('bme_current_user', newUser); onLogin && onLogin(newUser); }
    showToast(`Đăng ký thành công. Trạng thái: ${ newUser.status==='pending' ? 'Chờ duyệt' : 'Đã duyệt' }`, 'success');
    onClose();
  };

  const handleForgotPassword = () => {
    setErrorMsg('');
    if(!phone.trim()) return setErrorMsg('Vui lòng nhập số điện thoại');
    const users = safeGet('bme_users', []);
    const userIndex = users.findIndex((u: any) => u.phone === phone);
    if(userIndex !== -1) {
      users[userIndex].password = '123456';
      safeSet('bme_users', users);

      const oldAdminNotifs = safeGet('adminNotifications', safeGet('bme_admin_notifications', []));
      const adminNotifs = Array.isArray(oldAdminNotifs) ? oldAdminNotifs : [];
      const newAdminNotif = {
        id: Date.now(),
        type: 'FORGOT_PASSWORD',
        phone,
        message: `Yêu cầu quên mật khẩu từ SĐT ${phone}. Hệ thống đã cấp mật khẩu tạm thời 123456.`,
        time: new Date().toLocaleString(),
        status: 'NEW'
      };
      const nextAdminNotifs = [newAdminNotif, ...adminNotifs];
      safeSet('adminNotifications', nextAdminNotifs);
      safeSet('bme_admin_notifications', nextAdminNotifs);

      alert('Đã cấp lại mật khẩu thành công!\nMật khẩu mới của bạn là: 123456\nVui lòng đăng nhập lại.');
      setIsForgotMode(false);
      setPassword('');
      setErrorMsg('');
    } else {
      setErrorMsg('Số điện thoại không tồn tại trong hệ thống');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute right-3 top-3 text-gray-500"><X /></button>
        <h3 className="text-xl font-bold text-bme-primary mb-4">{isForgotMode ? 'Cấp lại mật khẩu' : isLoginMode ? 'Đăng nhập vào hệ thống' : 'Đăng ký tài khoản mới'}</h3>
        
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-r-md">
            <p className="text-red-700 text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        <div className="space-y-3">
          {!isLoginMode && !isForgotMode && (
            <div className="flex gap-2 mb-2">
              <button onClick={()=>setRole('user')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${role==='user'?'bg-bme-primary text-white shadow':'bg-gray-100 text-gray-600'}`}>Cá nhân</button>
              <button onClick={()=>setRole('business')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${role==='business'?'bg-bme-primary text-white shadow':'bg-gray-100 text-gray-600'}`}>Doanh nghiệp</button>
              <button onClick={()=>setRole('coordinator')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${role==='coordinator'?'bg-bme-primary text-white shadow':'bg-gray-100 text-gray-600'}`}>Chuyên gia</button>
            </div>
          )}
          
          {!isLoginMode && !isForgotMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
              <input className="w-full p-2.5 border rounded-lg outline-none focus:ring-1 focus:ring-bme-primary bg-white transition mb-2" placeholder="Nhập họ và tên của bạn" value={name} onChange={e=>{setName(e.target.value); setErrorMsg('');}} />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
            <input className="w-full p-2.5 border rounded-lg outline-none focus:ring-1 focus:ring-bme-primary bg-white transition" placeholder="Nhập số điện thoại" value={phone} onChange={e=>{setPhone(e.target.value); setErrorMsg('');}} />
          </div>
          
          {!isForgotMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
              <input type="password" className="w-full p-2.5 border rounded-lg outline-none focus:ring-1 focus:ring-bme-primary bg-white transition" placeholder="Nhập mật khẩu" value={password} onChange={e=>{setPassword(e.target.value); setErrorMsg('');}} />
              {isLoginMode && (
                <div className="flex justify-end mt-1">
                  <button onClick={() => {setIsForgotMode(true); setErrorMsg('');}} className="text-xs text-bme-primary hover:underline font-semibold">Quên mật khẩu?</button>
                </div>
              )}
            </div>
          )}

          {!isLoginMode && !isForgotMode && (
            <>
              <input className="w-full p-2.5 border rounded-lg bg-white mt-1" placeholder="CCCD" value={cccd} onChange={e=>setCccd(e.target.value)} />
              {(role==='business' || role==='coordinator') && <input className="w-full p-2.5 border rounded-lg bg-white mt-1" placeholder="MST / Chứng chỉ nghề" value={taxId} onChange={e=>setTaxId(e.target.value)} /> }
          {role === 'business' && (
            <select className="w-full p-2.5 border rounded-lg bg-white mt-1 outline-none focus:ring-1 focus:ring-bme-primary font-semibold text-gray-700" value={businessType} onChange={e => setBusinessType(e.target.value)}>
              <option value="merchant">🏪 Người Bán Hàng (Merchant)</option>
              <option value="engineer">👨‍🔧 Kỹ Sư Sửa Chữa (Engineer)</option>
            </select>
          )}
            </>
          )}
          <div className="flex gap-2 mt-4 pt-2">
            {isForgotMode ? (
              <>
                <button className="flex-1 bg-bme-primary text-white py-2.5 rounded-lg font-bold hover:bg-bme-secondary shadow transition" onClick={handleForgotPassword}>Gửi yêu cầu</button>
                <button className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => { setIsForgotMode(false); setErrorMsg(''); }}>Quay lại</button>
              </>
            ) : (
              <>
                <button className="flex-1 bg-bme-primary text-white py-2.5 rounded-lg font-bold hover:bg-bme-secondary shadow transition" onClick={handleSubmit}>{isLoginMode ? 'Đăng nhập' : 'Đăng ký'}</button>
                <button className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition" onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }}>{isLoginMode ? 'Đăng ký mới' : 'Quay lại Đăng nhập'}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================
// OCR Modal (simple)
// =========================
export const OcrSearchModal = ({ isOpen, onClose }) => {
  const [img, setImg] = useState(null);
  const [results, setResults] = useState(null);
  if(!isOpen) return null;
  const handle = (e)=>{
    const f = e.target.files?.[0]; if(!f) return; const r = new FileReader(); r.onload = (ev)=>{ setImg(ev.target.result); setTimeout(()=>setResults({ text: 'E-405 ERROR', confidence: 92 }), 1200); }; r.readAsDataURL(f);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl p-6">
        <div className="flex justify-between items-center"><h4 className="font-bold text-bme-primary">Tìm bằng hình ảnh</h4><button onClick={onClose}><X /></button></div>
        <div className="mt-4">
          {!img ? (
            <label className="block p-6 border-dashed border rounded text-center cursor-pointer">
              <input className="hidden" type="file" accept="image/*" onChange={handle} />
              <Camera className="mx-auto text-bme-primary" size={40} />
              <p className="mt-2">Chọn ảnh mã lỗi / linh kiện</p>
            </label>
          ) : (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="ocr" className="mx-auto max-h-48 object-contain" />
              {results && <pre className="mt-3 bg-gray-50 p-3 rounded">{JSON.stringify(results,null,2)}</pre>}
              <div className="mt-3 flex gap-2"><button className="px-3 py-2 border rounded" onClick={()=>{ setImg(null); setResults(null); }}>Tải ảnh khác</button><button className="px-3 py-2 bg-bme-primary text-white rounded" onClick={onClose}>Đóng</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =========================
// Home Feed
// =========================
export const HomeFeed = ({ searchQuery = '', currentUser = null, savedOnly = false }: { searchQuery?: string, currentUser?: any, savedOnly?: boolean }) => {
  const [posts, setPosts] = useState<any[]>(()=> safeGet('bme_posts', []));
  const [allGroupPosts, setAllGroupPosts] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>(() => safeGet('bme_users', []));
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [expanded, setExpanded] = useState<any>({});
  const [filter, setFilter] = useState('all');
  const [attachment, setAttachment] = useState<any>(null);

  useEffect(() => {
    const fetchPosts = () => {
      setPosts(safeGet('bme_posts', []));
      setUsersData(safeGet('bme_users', []));
      
      const comms = safeGet('bme_communities', []);
      let gPosts: any[] = [];
      if (Array.isArray(comms)) {
        comms.forEach((c: any) => {
          if (Array.isArray(c.groupPosts)) {
             c.groupPosts.forEach((gp: any) => {
               gPosts.push({ id: gp.id, authorId: gp.authorId, author: gp.author, avatar: gp.avatar || `https://i.pravatar.cc/150?u=${gp.authorId}`, time: gp.date, content: gp.text, attachment: gp.attachment, images: gp.attachment?.typeLabel === 'Image' ? [gp.attachment.base64] : [], category: `Nhóm: ${c.name}`, likes: 0, comments: 0, replies: [], status: 'active' });
             });
          }
        });
      }
      setAllGroupPosts(gPosts);
    };
    fetchPosts();
    const interval = setInterval(fetchPosts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size > 500 * 1024) {
        alert('Dung lượng ảnh quá lớn! Để hệ thống hoạt động ổn định, vui lòng chọn ảnh dưới 500KB.');
        e.target.value = '';
        return;
      }

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }
          reject(new Error('Kết quả đọc ảnh không hợp lệ.'));
        };
        reader.onerror = () => {
          reject(new Error('Không thể đọc ảnh đã chọn.'));
        };
        reader.readAsDataURL(file);
      });

      setAttachment({
        id: `file_${Date.now()}`,
        name: file.name,
        size: file.size,
        ext: file.name.split('.').pop()?.toLowerCase() || 'img',
        path: '/storage/images/',
        typeLabel: 'Image',
        base64: base64Image,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Lỗi khi tải ảnh bài viết:', error);
      showToast('Không thể xử lý ảnh. Vui lòng thử lại!', 'error');
      setAttachment(null);
    }
  };

  const createPost = async () => {
    if(!content.trim() && !attachment) return showToast('Vui lòng nhập nội dung hoặc đính kèm file', 'error');
    
    if (attachment) {
      const globalStorage = safeGet('bme_storage', []);
      safeSet('bme_storage', [...globalStorage, { ...attachment, uploaderId: currentUser?.id }]);
    }

    const newPost = { 
      id: `p_${Date.now()}`, 
      authorId: currentUser?.id, 
      author: currentUser?.name||'Ẩn danh', 
      avatar: currentUser?.avatar||`https://i.pravatar.cc/150?u=${Date.now()}`, 
      time: new Date().toLocaleString(), 
      content, 
      attachment,
      images: attachment?.typeLabel === 'Image' ? [attachment.base64] : [], 
      category, likes:0, comments:0, replies:[], status: 'active' 
    };
    
    const next = [newPost, ...posts]; setPosts(next); safeSet('bme_posts', next);
    setContent(''); setCategory('Tất cả'); setAttachment(null);
  };
  const addComment = (id, text)=>{ if(!text.trim()) return; const next = posts.map(p=> p.id===id?{...p, replies:[...(p.replies||[]), { id:`r_${Date.now()}`, authorId: currentUser?.id, author: currentUser?.name||'Ẩn danh', text, time: new Date().toLocaleString() }], comments:(p.comments||0)+1}:p); setPosts(next); safeSet('bme_posts', next); };

  const currentUserData = usersData.find((u: any) => u.phone === currentUser?.phone) || currentUser;
  const savedPostIds = currentUserData?.savedPostIds || [];

  const toggleSave = (id: string) => {
    if (!currentUser) return showToast('Vui lòng đăng nhập để lưu bài viết', 'error');
    const allUsers = safeGet('bme_users', []);
    const userIndex = allUsers.findIndex((u: any) => u.phone === currentUser.phone);
    if (userIndex === -1) return;
    
    const user = allUsers[userIndex];
    let newSavedPostIds = user.savedPostIds || [];
    if (newSavedPostIds.includes(id)) {
      newSavedPostIds = newSavedPostIds.filter((savedId: string) => savedId !== id);
      showToast('Đã bỏ lưu bài viết', 'info');
    } else {
      newSavedPostIds.push(id);
      showToast('Đã lưu bài viết vào Mục đã lưu', 'success');
    }
    allUsers[userIndex] = { ...user, savedPostIds: newSavedPostIds };
    safeSet('bme_users', allUsers);
    setUsersData(allUsers);
  };

  const combinedPosts = savedOnly ? [...posts, ...allGroupPosts] : posts;

  const visible = combinedPosts.filter(post => {
    if (post.status === 'locked') return false;
    if (savedOnly) return savedPostIds.includes(post.id);
    if (filter !== 'all' && post.category !== filter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return post.content.toLowerCase().includes(query) || post.author.toLowerCase().includes(query) || post.category.toLowerCase().includes(query);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <aside className="lg:col-span-3">
        <div className="bg-white p-4 rounded shadow sticky top-20">
          <h4 className="font-bold mb-3">{savedOnly ? 'Quản lý Lưu trữ' : 'Danh mục'}</h4>
          {savedOnly ? (
            <p className="text-sm text-gray-600">Bạn đang xem danh sách các bài viết và tài liệu đã lưu. Bạn có thể bấm bỏ lưu để xóa khỏi danh sách.</p>
          ) : (
            ['Tất cả','Chẩn đoán','Hồi sức','Linh kiện','X-ray'].map(c => (
              <button key={c} onClick={() => setFilter(c === 'Tất cả' ? 'all' : c)} className={`w-full text-left py-2 px-3 rounded mb-1 transition ${filter === (c === 'Tất cả' ? 'all' : c) ? 'bg-bme-primary text-white shadow' : 'hover:bg-blue-50 text-gray-700'}`}>
                {c}
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="lg:col-span-6 space-y-4">
        {!savedOnly && (
          <div className="bg-white p-4 rounded shadow">
          <div className="flex gap-3">
            <Avatar src={currentUser?.avatar} name={currentUser?.name} size={48} userId={currentUser?.id} />
            <div className="flex-1">
              <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Bạn muốn chia sẻ gì?" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 border rounded text-sm">
                    <option>Chẩn đoán</option>
                    <option>Hồi sức</option>
                    <option>Linh kiện</option>
                    <option>X-ray</option>
                  </select>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <button onClick={createPost} className="bg-bme-primary text-white px-4 py-2 rounded">Đăng bài</button>
              </div>
              {attachment && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center text-sm shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3">
                    <img src={attachment.base64} alt="Preview ảnh bài viết" className="h-16 w-16 object-cover rounded" />
                    <span className="truncate max-w-[80%] font-semibold text-bme-primary">{attachment.name}</span>
                  </div>
                  <button onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-700 font-bold bg-white px-2 py-0.5 rounded">Xóa</button>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {visible.length === 0 && (
          <div className="bg-white p-10 rounded shadow text-center border border-dashed border-gray-300">
            <span className="text-5xl block mb-3 opacity-50">📭</span>
            <p className="font-bold text-gray-600 text-lg">Chưa có bài viết nào.</p>
            <p className="text-sm text-gray-500 mt-1">Hãy là người đầu tiên chia sẻ hoặc điều chỉnh lại bộ lọc tìm kiếm!</p>
          </div>
        )}

        {visible.map(post => (
          <article key={post.id} className="bg-white rounded shadow overflow-hidden">
            <div className="p-4 flex items-start gap-3 border-b">
              <Avatar src={post.avatar} name={post.author} size={48} userId={post.authorId} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold hover:text-bme-primary cursor-pointer transition" onClick={() => document.dispatchEvent(new CustomEvent('viewProfile', {detail: post.authorId}))}>{post.author}</p>
                    <p className="text-xs text-gray-500">{post.time}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{post.category}</span>
                </div>
                <p className="mt-3 text-gray-800">{post.content}</p>
                
                {post.attachment && post.attachment.typeLabel !== 'Image' && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 cursor-pointer hover:border-bme-primary transition group">
                    <div className={`p-2 rounded-lg ${post.attachment.typeLabel === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}><FileText size={24} /></div>
                    <div className="flex-1"><p className="font-bold text-sm text-gray-800 group-hover:text-bme-primary transition">{post.attachment.name}</p><p className="text-xs text-gray-500">{post.attachment.typeLabel} • {Math.round((post.attachment.size || 0)/1024)} KB</p></div>
                  </div>
                )}
                {post.images && post.images.length > 0 && (
                  <div className="mt-3"><img src={post.images[0]} alt="attachment" className="rounded-lg max-h-80 w-auto object-cover border border-gray-200" /></div>
                )}
              </div>
            </div>
            <div className="px-4 py-2 flex items-center gap-2 border-t">
              <button onClick={() => toggleSave(post.id)} className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition ${savedPostIds.includes(post.id) ? 'text-bme-primary font-bold' : 'text-gray-600'}`}><Bookmark size={16} fill={savedPostIds.includes(post.id) ? 'currentColor' : 'none'} /> {savedPostIds.includes(post.id) ? 'Đã lưu' : 'Lưu bài viết'}</button>
              <button onClick={() => setExpanded(s => ({ ...s, [post.id]: !s[post.id] }))} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"><MessageCircle size={16} /> {post.comments || 0}</button>
              <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"><Share2 size={16} /> Chia sẻ</button>
            </div>
            {expanded[post.id] && (
              <div className="p-3 bg-gray-50">
                <CommentsList replies={post.replies || []} />
                <CommentInput onAdd={text => addComment(post.id, text)} />
              </div>
            )}
          </article>
        ))}
      </main>

      <aside className="lg:col-span-3">
        <div className="bg-white p-4 rounded shadow sticky top-20">
          <h4 className="font-bold mb-2">Trạng thái</h4>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Avatar src={currentUser.avatar} name={currentUser.name} size={48} userId={currentUser?.id} />
              <div>
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-sm text-gray-500">{currentUser.role}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Bạn chưa đăng nhập</div>
          )}
          <button onClick={() => document.dispatchEvent(new CustomEvent('openMap'))} className="mt-4 w-full bg-red-600 text-white py-2 rounded">Khẩn cấp</button>
        </div>
      </aside>
    </div>
  );
};

const CommentInput = ({ onAdd }) => {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2 mt-3">
      <input className="flex-1 p-2 border rounded" placeholder="Viết bình luận..." value={text} onChange={e => setText(e.target.value)} />
      <button className="px-3 py-2 bg-bme-primary text-white rounded" onClick={() => { if (!text.trim()) return; onAdd(text); setText(''); }}>Gửi</button>
    </div>
  );
};

const CommentsList = ({ replies = [] }) => (
  <div className="space-y-3">
    {replies.map(reply => (
      <div key={reply.id} className="flex gap-2 p-3 bg-gray-50 rounded">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-bme-primary font-bold"><User size={16} /></div>
        <div className="flex-1">
          <p className="font-semibold text-sm hover:text-bme-primary cursor-pointer transition inline-block" onClick={() => reply.authorId && document.dispatchEvent(new CustomEvent('viewProfile', {detail: reply.authorId}))}>{reply.author}</p>
          <p className="text-sm text-gray-700">{reply.text}</p>
          <p className="text-xs text-gray-400 mt-1">{reply.time}</p>
        </div>
      </div>
    ))}
  </div>
);

// ------------------ MapView ------------------
export const MapView = () => {
  const [pingNote, setPingNote] = useState(null);
  const [techs, setTechs] = useState(() => {
    const users = safeGet('bme_users', []);
    // Lọc ra các tài khoản là Chuyên gia (Coordinator) hoặc Kỹ sư sửa chữa (Business/Engineer)
    return users.filter((u: any) => (u.role === 'coordinator' || u.businessType === 'engineer') && u.status === 'active');
  }); 
  useEffect(()=>{ const h=()=>{}; window.addEventListener('openMap', h); return ()=>window.removeEventListener('openMap', h); },[]);
  const ping = tech => { setPingNote(`Đã gửi ping tới ${tech.name}`); setTimeout(()=>setPingNote(null),3000); };
  return (
    <div className="space-y-4">
      <div className="bg-red-600 text-white p-6 rounded-2xl flex items-center gap-4 shadow-lg">
        <AlertCircle size={32}/>
        <div>
          <p className="font-bold text-xl">TÌM KIẾM KHẨN CẤP</p>
          <p className="text-sm opacity-90">Bản đồ mô phỏng các kỹ thuật viên và chuyên gia đang trực tuyến gần bạn.</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="relative h-80 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden border border-blue-100">
          <svg viewBox="0 0 400 300" className="w-full h-full"><rect width="400" height="300" fill="#e6f2ff" />{techs.map((t,i)=>(<circle key={t.id} cx={60+i*110} cy={80+(i%2)*80} r={12} fill={'#16a34a'} />))}</svg>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {techs.length === 0 && <p className="col-span-3 text-center text-gray-500 italic">Không có kỹ thuật viên nào trực tuyến gần đây.</p>}
          {techs.map((t: any) => (
            <div key={t.id} className="p-4 border border-gray-200 bg-white rounded-xl shadow-sm hover:border-bme-primary hover:shadow-md transition flex items-start justify-between gap-3">
              <div className="flex-1 cursor-pointer" onClick={() => document.dispatchEvent(new CustomEvent('viewProfile', { detail: t.id }))}>
                <p className="font-bold text-gray-800 hover:text-bme-primary transition">{t.name}</p>
                <p className="text-sm text-gray-500 mt-1">{t.phone} • {t.role === 'coordinator' ? 'Chuyên gia' : 'Kỹ sư'}</p>
              </div>
              <button onClick={()=>ping(t)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition">Ping</button>
            </div>
          ))}
        </div>
      </div>
      {pingNote && <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded">{pingNote}</div>}
    </div>
  );
};

// ------------------ TinyCommunity ------------------
export const TinyCommunity = ({ currentUser, searchQuery = '' }: { currentUser?: any, searchQuery?: string }) => {
  const [communities, setCommunities] = useState(() => safeGet('bme_communities', []));
  const [users, setUsers] = useState(() => safeGet('bme_users', []));
  const [active, setActive] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'files'
  const [localSearch, setLocalSearch] = useState('');

  // States Form tạo nhóm
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommSpecialty, setNewCommSpecialty] = useState('');
  
  // State Form Đăng bài thảo luận
  const [newPostText, setNewPostText] = useState('');
  const [postAttachment, setPostAttachment] = useState<any>(null);

  // States Form Tải tài liệu
  const [commAttachment, setCommAttachment] = useState<any>(null);
  const [newFileDesc, setNewFileDesc] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  useEffect(()=>{ const h=(e:any)=>setActive(e.detail); window.addEventListener('openCommunity', h); return ()=>window.removeEventListener('openCommunity', h); },[]);
  useEffect(() => {
    const fetchComm = () => { setCommunities(safeGet('bme_communities', [])); setUsers(safeGet('bme_users', [])); };
    fetchComm();
    const interval = setInterval(fetchComm, 3000);
    return () => clearInterval(interval);
  }, []);

  // Phân quyền: Chỉ Admin và Coordinator (Chuyên gia) mới có quyền quản trị tạo nhóm và tải tài liệu
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'coordinator';
  const isAdmin = currentUser?.role === 'admin';

  const handleCreateCommunity = () => {
    if(!newCommName.trim()) return showToast('Vui lòng nhập tên hội nhóm', 'error');
    const isAutoApproved = isAdmin || isManager;
    const newComm = { 
      id:`c_${Date.now()}`, name: newCommName, description: newCommDesc, specialty: newCommSpecialty, 
      membersCount: 1, members: [currentUser?.phone], creatorId: currentUser?.id, creatorPhone: currentUser?.phone, pendingMembers: [],
      status: isAutoApproved ? 'APPROVED' : 'PENDING_APPROVAL',
      groupPosts: [], groupFiles: [], icon: '👥'
    };
    const next = [...communities, newComm]; setCommunities(next); safeSet('bme_communities', next);
    setNewCommName(''); setNewCommDesc(''); setNewCommSpecialty('');
    setActive(newComm.id);
    if (!isAutoApproved) showToast('Nhóm đã được tạo và đang chờ chuyên gia phê duyệt!', 'success');
    else showToast('Tạo nhóm thành công!', 'success');
  };

  const handleFileChange = (e: any, setAttachmentState: Function) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const isImg = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
    const isPdf = ext === 'pdf';
    const isDoc = ['doc', 'docx'].includes(ext);
    
    let path = '/storage/misc/';
    let typeLabel = 'OTHER';
    if (isImg) { path = '/storage/images/'; typeLabel = 'Image'; }
    else if (isPdf) { path = '/storage/documents/pdf/'; typeLabel = 'PDF'; }
    else if (isDoc) { path = '/storage/documents/docs/'; typeLabel = 'DOCX'; }

    if (!isImg && !isPdf && !isDoc) return showToast('Định dạng file không được hỗ trợ!', 'error');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachmentState({ id: `file_${Date.now()}`, name: file.name, size: file.size, ext, path, typeLabel, base64: ev.target.result, timestamp: new Date().toLocaleString() });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleCommunityPostImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size > 500 * 1024) {
        alert('Dung lượng ảnh quá lớn! Để hệ thống hoạt động ổn định, vui lòng chọn ảnh dưới 500KB.');
        e.target.value = '';
        return;
      }

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }
          reject(new Error('Kết quả đọc ảnh không hợp lệ.'));
        };
        reader.onerror = () => {
          reject(new Error('Không thể đọc ảnh đã chọn.'));
        };
        reader.readAsDataURL(file);
      });

      setPostAttachment({
        id: `file_${Date.now()}`,
        name: file.name,
        size: file.size,
        ext: file.name.split('.').pop()?.toLowerCase() || 'img',
        path: '/storage/images/',
        typeLabel: 'Image',
        base64: base64Image,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Lỗi khi tải ảnh bài viết nhóm:', error);
      showToast('Không thể xử lý ảnh. Vui lòng thử lại!', 'error');
      setPostAttachment(null);
    }
  };

  const handlePost = () => {
    if(!newPostText.trim() && !postAttachment) return showToast('Vui lòng nhập nội dung hoặc đính kèm', 'error');
    if(!active) return;
    
    if (postAttachment) {
      const globalStorage = safeGet('bme_storage', []);
      safeSet('bme_storage', [...globalStorage, { ...postAttachment, uploaderId: currentUser?.id }]);
    }

    const newPost = { id: `gp_${Date.now()}`, authorId: currentUser?.id, author: currentUser?.name || 'Ẩn danh', text: newPostText, date: new Date().toLocaleString(), attachment: postAttachment };
    const next = communities.map(c => c.id === active ? { ...c, groupPosts: [newPost, ...(c.groupPosts || [])] } : c);
    setCommunities(next); safeSet('bme_communities', next);
    setNewPostText(''); setPostAttachment(null);
  };

  const handleUploadFile = () => {
    if(!commAttachment || !active) return showToast('Vui lòng chọn tài liệu để tải lên', 'error');
    
    const globalStorage = safeGet('bme_storage', []);
    const newFile = { ...commAttachment, uploaderId: currentUser?.id, description: newFileDesc, uploadedBy: currentUser?.name || 'Quản trị viên', date: new Date().toLocaleDateString() };
    safeSet('bme_storage', [...globalStorage, newFile]);

    const next = communities.map(c => c.id === active ? { ...c, groupFiles: [newFile, ...(c.groupFiles || [])] } : c);
    setCommunities(next); safeSet('bme_communities', next);
    setCommAttachment(null); setNewFileDesc('');
  };

  const handleJoinRequest = () => {
    if(!currentUser) return showToast('Vui lòng đăng nhập', 'error');
    const activeComm = communities.find(c => c.id === active);
    if(activeComm?.pendingMembers?.includes(currentUser.phone)) return;
    const next = communities.map(c => c.id === active ? { ...c, pendingMembers: [...(c.pendingMembers||[]), currentUser.phone] } : c);
    setCommunities(next); safeSet('bme_communities', next);
    showToast('Đã gửi yêu cầu tham gia nhóm. Vui lòng chờ phê duyệt.', 'success');
  };

  const handleApproveMember = (pid: string) => {
    const next = communities.map(c => {
      if (c.id === active) return { ...c, pendingMembers: (c.pendingMembers||[]).filter((id:string) => id !== pid), members: [...(c.members || []), pid], membersCount: (c.membersCount || 1) + 1 };
      return c;
    });
    setCommunities(next); safeSet('bme_communities', next); showToast('Đã phê duyệt thành viên', 'success');
  };

  const handleRejectMember = (pid: string) => {
    const next = communities.map(c => c.id === active ? { ...c, pendingMembers: (c.pendingMembers||[]).filter((id:string) => id !== pid) } : c);
    setCommunities(next); safeSet('bme_communities', next); showToast('Đã từ chối thành viên', 'info');
  };

  const handleDeleteGroupPostViolation = (postId: string) => {
    if (!isCoordinatorAccount || !active) return;
    if (typeof window !== 'undefined' && !window.confirm('Bạn có chắc chắn muốn xóa bài viết vi phạm này khỏi hệ thống không?')) return;
    const updatedPosts = (activeComm?.groupPosts || []).filter((p: any) => p?.id !== postId);
    const next = communities.map(c => {
      if (c.id === active) {
        return { ...c, groupPosts: updatedPosts };
      }
      return c;
    });
    setCommunities(next);
    safeSet('bme_communities', next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
    }
    alert('Đã xóa bài viết vi phạm khỏi hệ thống!');
  };

  const handleDeleteCommunityViolation = () => {
    if (!isCoordinatorAccount || !active) return;
    if (typeof window !== 'undefined' && !window.confirm('HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn XÓA HOÀN TOÀN nhóm này cùng tất cả bài viết bên trong không?')) return;
    const updatedCommunities = communities.filter(c => c.id !== active);
    const allPosts = safeGet('bme_posts', safeGet('posts', []));
    const updatedPosts = Array.isArray(allPosts) ? allPosts.filter((p: any) => p?.communityId !== active) : [];
    setCommunities(updatedCommunities);
    safeSet('bme_communities', updatedCommunities);
    safeSet('bme_posts', updatedPosts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('communities', JSON.stringify(updatedCommunities));
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
    }
    setActive(null);
    alert('Đã xóa sạch nhóm cộng đồng và các bài viết vi phạm!');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bme-go-home'));
    }
  };

  const activeComm = communities.find(c => c.id === active);
  const normalizePhone = (value: any) => String(value || '').replace(/\D/g, '');
  const normalizedCurrentPhone = normalizePhone(currentUser?.phone);
  const isCoordinatorAccount = normalizedCurrentPhone === '0977777777' || normalizedCurrentPhone === '84977777777' || String(currentUser?.role || '').toLowerCase() === 'coordinator';
  const hasGroupAccess = isCoordinatorAccount || activeComm?.creatorPhone === currentUser?.phone || activeComm?.members?.includes(currentUser?.phone);
  const canManageMembers = isCoordinatorAccount || activeComm?.creatorPhone === currentUser?.phone;
  const isPending = activeComm?.pendingMembers?.includes(currentUser?.phone);
  
  const visibleCommunities = communities.filter((c: any) => 
    (c.status === 'APPROVED' || !c.status || c.status === undefined || c.creatorPhone === currentUser?.phone || isAdmin || isCoordinatorAccount) &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Logic tìm kiếm toàn văn trong một nhóm cụ thể
  const filteredPosts = (activeComm?.groupPosts || []).filter(p => p.text.toLowerCase().includes(localSearch.toLowerCase()) || p.author.toLowerCase().includes(localSearch.toLowerCase()));
  const filteredFiles = (activeComm?.groupFiles || []).filter(f => f.title.toLowerCase().includes(localSearch.toLowerCase()) || (f.description && f.description.toLowerCase().includes(localSearch.toLowerCase())));

  const currentUserData = users.find((u: any) => u.phone === currentUser?.phone) || currentUser;
  const savedPostIds = currentUserData?.savedPostIds || [];

  const toggleSave = (id: string) => {
    if (!currentUser) return showToast('Vui lòng đăng nhập để lưu bài viết', 'error');
    const allUsers = safeGet('bme_users', []);
    const userIndex = allUsers.findIndex((u: any) => u.phone === currentUser.phone);
    if (userIndex === -1) return;
    const user = allUsers[userIndex];
    let newSavedPostIds = user.savedPostIds || [];
    if (newSavedPostIds.includes(id)) { newSavedPostIds = newSavedPostIds.filter((savedId: string) => savedId !== id); showToast('Đã bỏ lưu bài viết', 'info'); }
    else { newSavedPostIds.push(id); showToast('Đã lưu bài viết vào Mục đã lưu', 'success'); }
    allUsers[userIndex] = { ...user, savedPostIds: newSavedPostIds };
    safeSet('bme_users', allUsers);
    setUsers(allUsers);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* CỘT TRÁI: DANH SÁCH NHÓM */}
      <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-lg text-bme-primary flex items-center gap-2"><Users size={20}/> Các Hội Nhóm</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {visibleCommunities.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Hệ thống chưa có hội nhóm nào.</p>}
          {visibleCommunities.map((c:any) => {
            const isJoined = c.members?.includes(currentUser?.phone) || isAdmin || isCoordinatorAccount || c.creatorPhone === currentUser?.phone;
            return (
            <button key={c.id} onClick={() => { setActive(c.id); setLocalSearch(''); setActiveTab('posts'); }} className={`w-full text-left p-3 rounded-lg border transition block ${active === c.id ? 'border-bme-primary bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
              <div className="flex justify-between items-start">
                <p className="font-bold text-gray-800">{c.name}</p>
                {isJoined && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap ml-2">Đã tham gia</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.specialty || 'Chung'} • {c.membersCount} thành viên {c.status==='PENDING_APPROVAL' && <span className="text-orange-500">(Chờ duyệt)</span>}</p>
            </button>
          )})}
        </div>
        {currentUser && (
          <div className="p-4 border-t bg-blue-50/50">
            <p className="font-bold text-sm text-bme-primary mb-3 flex items-center gap-2"><PlusCircle size={16}/> Tạo hội nhóm mới</p>
            <input value={newCommName} onChange={e=>setNewCommName(e.target.value)} placeholder="Tên nhóm (VD: Hội kỹ sư máy thở)..." className="w-full p-2 border border-gray-300 rounded-md mb-2 text-sm bg-white outline-none focus:border-bme-primary" />
            <input value={newCommSpecialty} onChange={e=>setNewCommSpecialty(e.target.value)} placeholder="Chuyên khoa ngách..." className="w-full p-2 border border-gray-300 rounded-md mb-2 text-sm bg-white outline-none focus:border-bme-primary" />
            <textarea value={newCommDesc} onChange={e=>setNewCommDesc(e.target.value)} placeholder="Mô tả nhóm..." rows={2} className="w-full p-2 border border-gray-300 rounded-md mb-3 text-sm bg-white outline-none focus:border-bme-primary resize-none" />
            <button onClick={handleCreateCommunity} className="w-full bg-bme-primary hover:bg-bme-secondary text-white py-2 rounded-md text-sm font-bold shadow-sm transition">Xác nhận tạo nhóm</button>
          </div>
        )}
      </div>

      {/* CỘT PHẢI: KHÔNG GIAN BÊN TRONG NHÓM */}
      <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        {!activeComm ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Users size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Chọn một hội nhóm bên trái để xem nội dung</p>
            <p className="text-sm mt-2">Tham gia thảo luận và tìm kiếm tài liệu kỹ thuật chuyên sâu</p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b bg-gradient-to-r from-bme-light/50 to-white">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-bme-primary">{activeComm.name}</h2>
                {isCoordinatorAccount && (
                  <button onClick={handleDeleteCommunityViolation} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 text-xs flex items-center gap-2"><AlertTriangle size={16}/> XÓA NHÓM VI PHẠM</button>
                )}
              </div>
              <p className="text-gray-600 mt-1">{activeComm.description}</p>
              <div className="flex gap-3 mt-3 text-xs font-semibold text-gray-500">
                <span className="bg-white px-3 py-1 rounded-full border border-gray-200">🏷️ {activeComm.specialty || 'Đa khoa'}</span>
                <span className="bg-white px-3 py-1 rounded-full border border-gray-200">👥 {activeComm.membersCount} thành viên</span>
              </div>
            </div>

            {!hasGroupAccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <Lock size={48} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700">Nhóm riêng tư</h3>
                <p className="text-gray-500 mt-2 mb-6">Bạn cần tham gia nhóm để xem các bài viết thảo luận và kho tài liệu.</p>
                {isPending ? (
                  <button disabled className="bg-gray-200 text-gray-500 px-6 py-2.5 rounded-lg font-bold shadow-sm cursor-not-allowed">Đang chờ trưởng nhóm duyệt...</button>
                ) : (
                  <button onClick={handleJoinRequest} className="bg-bme-primary hover:bg-bme-secondary text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition">Xin vào nhóm</button>
                )}
              </div>
            ) : (
            <>
            <div className="px-5 pt-4 border-b">
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input value={localSearch} onChange={e=>setLocalSearch(e.target.value)} placeholder={`Tìm kiếm tài liệu, thảo luận trong ${activeComm.name}...`} className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-bme-primary focus:ring-1 ring-blue-100 border pl-10 pr-4 py-2 rounded-lg outline-none transition text-sm" />
              </div>
              <div className="flex gap-6">
                <button onClick={() => setActiveTab('posts')} className={`pb-3 font-bold text-sm transition border-b-2 ${activeTab === 'posts' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Thảo luận chung</button>
                <button onClick={() => setActiveTab('files')} className={`pb-3 font-bold text-sm transition border-b-2 ${activeTab === 'files' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Kho tài liệu</button>
                {canManageMembers && <button onClick={() => setActiveTab('members')} className={`pb-3 font-bold text-sm transition border-b-2 ${activeTab === 'members' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Duyệt thành viên {(activeComm.pendingMembers?.length || 0) > 0 && <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs ml-1">{activeComm.pendingMembers.length}</span>}</button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {currentUser && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-bme-primary flex-shrink-0 font-bold">{currentUser?.name?.charAt(0) || 'U'}</div>
                      <div className="flex-1">
                        <textarea value={newPostText} onChange={e=>setNewPostText(e.target.value)} placeholder="Viết câu hỏi hoặc chia sẻ kỹ thuật vào nhóm..." rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-bme-primary rounded-lg outline-none resize-none text-sm transition" />
                        {postAttachment && <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center text-sm shadow-sm animate-fade-in"><div className="flex items-center gap-3"><img src={postAttachment.base64} alt="Preview ảnh nhóm" className="h-16 w-16 object-cover rounded" /><span className="truncate max-w-[80%] font-semibold text-bme-primary">{postAttachment.name}</span></div><button onClick={() => setPostAttachment(null)} className="text-red-500 font-bold">Xóa</button></div>}
                        <div className="flex justify-between items-center mt-2">
                          <div><input type="file" accept="image/*" onChange={handleCommunityPostImageChange} className="p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div>
                          <button onClick={handlePost} className="bg-bme-primary hover:bg-bme-secondary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition">Đăng bài</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {filteredPosts.length === 0 && <p className="text-center text-gray-500 text-sm mt-8">Chưa có bài thảo luận nào phù hợp.</p>}
                  {filteredPosts.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2"><div className="font-bold text-gray-800 hover:text-bme-primary cursor-pointer transition inline-block" onClick={() => p.authorId && document.dispatchEvent(new CustomEvent('viewProfile', {detail: p.authorId}))}>{p.author}</div><div className="flex items-center gap-2"><div className="text-xs font-medium text-gray-400">{p.date}</div></div></div>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>
                      {p.attachment && p.attachment.typeLabel === 'Image' && <img src={p.attachment.base64} alt="post" className="mt-3 rounded max-h-64 object-cover border border-gray-200" />}
                      {p.attachment && p.attachment.typeLabel !== 'Image' && <div className="mt-3 p-2 bg-gray-50 border rounded flex items-center gap-2"><FileText size={20} className={p.attachment.typeLabel === 'PDF' ? 'text-red-500' : 'text-blue-500'} /><div className="flex-1"><p className="font-semibold text-sm">{p.attachment.name}</p><p className="text-xs text-gray-500">{p.attachment.typeLabel} • {Math.round(p.attachment.size/1024)} KB</p></div></div>}
                      <div className="mt-3 pt-2 border-t flex gap-2">
                        <button onClick={() => toggleSave(p.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition hover:bg-gray-50 ${savedPostIds.includes(p.id) ? 'text-bme-primary font-bold' : 'text-gray-500'}`}>
                          <Bookmark size={16} fill={savedPostIds.includes(p.id) ? 'currentColor' : 'none'} /> {savedPostIds.includes(p.id) ? 'Đã lưu' : 'Lưu bài viết'}
                        </button>
                        {isCoordinatorAccount && (
                          <button onClick={() => handleDeleteGroupPostViolation(p.id)} className="ml-auto text-red-600 hover:text-red-800 font-semibold p-2 bg-red-50 rounded-lg flex items-center gap-1 text-xs"><Trash2 size={16}/> Xóa bài vi phạm</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-4">
                  {isManager && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-sm">
                      <p className="font-bold text-sm text-bme-primary mb-3 flex items-center gap-2"><FolderOpen size={16}/> Tải tài liệu mới lên kho (Asset Storage)</p>
                      <div className="flex flex-col md:flex-row gap-3 mb-3 items-start md:items-center">
                        <input type="file" id="comm-upload-file" className="hidden" accept=".jpg,.png,.pdf,.doc,.docx" onChange={e => handleFileChange(e, setCommAttachment)} />
                        <button onClick={() => document.getElementById('comm-upload-file')?.click()} className="bg-white border border-gray-300 text-gray-700 hover:text-bme-primary px-4 py-2 rounded text-sm font-semibold transition flex items-center gap-2 shadow-sm whitespace-nowrap"><Upload size={16}/> Chọn tệp từ máy tính</button>
                        {commAttachment && <span className="text-sm font-bold text-bme-primary flex-1 truncate bg-white px-3 py-2 rounded border border-blue-100 flex items-center justify-between">📎 {commAttachment.name} <button onClick={()=>setCommAttachment(null)} className="text-red-500 font-bold ml-2">X</button></span>}
                      </div>
                      <input value={newFileDesc} onChange={e=>setNewFileDesc(e.target.value)} placeholder="Mô tả nội dung tài liệu..." className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none focus:border-bme-primary mb-3" />
                      <div className="flex justify-end"><button onClick={handleUploadFile} disabled={!commAttachment} className={`px-5 py-2 rounded text-sm font-bold shadow-sm flex items-center gap-2 transition ${commAttachment ? 'bg-bme-secondary hover:bg-bme-primary text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><FileDown size={16}/> Đăng tài liệu</button></div>
                    </div>
                  )}
                  
                  {/* Folder Structure View */}
                  {!currentFolder ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 animate-fade-in">
                      <div onClick={() => setCurrentFolder('/storage/images/')} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-bme-primary hover:shadow-md cursor-pointer transition flex flex-col items-center gap-3 text-center group">
                        <Folder size={56} className="text-blue-500 fill-blue-50 group-hover:scale-110 transition-transform" />
                        <div><p className="font-bold text-gray-800">Hình ảnh</p><p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded">.jpg, .png</p></div>
                      </div>
                      <div onClick={() => setCurrentFolder('/storage/documents/pdf/')} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-bme-primary hover:shadow-md cursor-pointer transition flex flex-col items-center gap-3 text-center group">
                        <Folder size={56} className="text-red-500 fill-red-50 group-hover:scale-110 transition-transform" />
                        <div><p className="font-bold text-gray-800">Tài liệu PDF</p><p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded">.pdf</p></div>
                      </div>
                      <div onClick={() => setCurrentFolder('/storage/documents/docs/')} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-bme-primary hover:shadow-md cursor-pointer transition flex flex-col items-center gap-3 text-center group">
                        <Folder size={56} className="text-indigo-500 fill-indigo-50 group-hover:scale-110 transition-transform" />
                        <div><p className="font-bold text-gray-800">File Word</p><p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded">.doc, .docx</p></div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <button onClick={() => setCurrentFolder(null)} className="mb-4 text-sm font-bold text-gray-500 hover:text-bme-primary flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 transition">← Quay lại danh mục thư mục</button>
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm"><FolderOpen size={20} className="text-bme-primary"/> Thư mục: {currentFolder}</h4>
                      <div className="grid gap-3">
                        {filteredFiles.filter(f => f.path === currentFolder).length === 0 && <p className="text-center text-gray-500 text-sm py-10 bg-white border-2 border-dashed border-gray-200 rounded-xl font-medium">Thư mục này hiện đang trống.</p>}
                        {filteredFiles.filter(f => f.path === currentFolder).map(f => (
                          <div key={f.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-bme-primary transition group cursor-pointer">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${f.typeLabel === 'PDF' ? 'bg-red-50 text-red-500' : f.typeLabel === 'Image' ? 'bg-green-50 text-green-500' : 'bg-indigo-50 text-indigo-500'}`}>
                              {f.typeLabel === 'Image' ? <ImageIcon size={24} /> : <FileText size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 truncate text-base">{f.name || f.title}</p>
                              <p className="text-sm text-gray-500 truncate mt-0.5">{f.description}</p>
                              <div className="flex gap-2 mt-1.5 text-xs font-semibold text-gray-400"><span>Bởi: {f.uploadedBy}</span><span>•</span><span>{Math.round((f.size || 0)/1024)} KB</span><span>•</span><span>{f.date}</span></div>
                            </div>
                            {f.typeLabel === 'Image' && <img src={f.base64} alt="thumb" className="w-12 h-12 object-cover rounded shadow-sm opacity-50 group-hover:opacity-100 transition" />}
                            <button className="bg-gray-100 hover:bg-bme-primary hover:text-white text-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition opacity-0 group-hover:opacity-100 ml-2 shadow-sm">Mở</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'members' && canManageMembers && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Yêu cầu tham gia ({(activeComm.pendingMembers?.length || 0)})</h3>
                  {(!activeComm.pendingMembers || activeComm.pendingMembers.length === 0) && <p className="text-gray-500 text-sm">Chưa có yêu cầu nào.</p>}
                  {activeComm.pendingMembers?.map((pid: string) => {
                    const u = users.find((user:any) => user.phone === pid || user.id === pid);
                    if(!u) return null;
                    return (
                      <div key={pid} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatar} name={u.name} size={40} userId={u.id} />
                          <div>
                            <p className="font-bold text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.role} • {u.phone}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveMember(pid)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition">Chấp nhận</button>
                          <button onClick={() => handleRejectMember(pid)} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold transition">Từ chối</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ====================================================
// PRODUCT DETAIL MODAL (Shopee-style with qty select)
// ====================================================
const ProductDetailModal = ({ product, store, currentUser, onClose }: { product: any, store: any, currentUser: any, onClose: () => void }) => {
  const [qty, setQty] = useState(1);
  const stock = Number(product?.stock ?? 0);
  const isOutOfStock = stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (qty < 1 || qty > stock) return showToast(`Số lượng không hợp lệ. Tồn kho: ${stock}`, 'error');
    for (let i = 0; i < qty; i++) {
      document.dispatchEvent(new CustomEvent('addToCart', { detail: { ...product, storeName: store?.name, storeId: store?.id } }));
    }
    showToast(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition"><X size={22} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="bg-gray-100 flex items-center justify-center h-64 md:h-auto overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/400x300?text=Sản+phẩm'; }} />
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div>
              <p className="text-3xl font-black text-red-600">{Number(product.price).toLocaleString()}đ</p>
              <p className="text-sm text-gray-500 mt-1">Bởi: <span className="font-bold text-bme-primary">{store?.name}</span></p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Package size={16} className="text-gray-500" />
              <span>Tồn kho: <strong className={stock === 0 ? 'text-red-600' : 'text-green-600'}>{stock} sản phẩm</strong></span>
            </div>
            {!isOutOfStock ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Số lượng:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition">−</button>
                    <input type="number" min={1} max={stock} value={qty} onChange={e => setQty(Math.min(stock, Math.max(1, Number(e.target.value))))} className="w-14 text-center py-2 outline-none font-bold text-gray-800 border-x border-gray-300" />
                    <button onClick={() => setQty(q => Math.min(stock, q + 1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition">+</button>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-700">Tổng: <span className="text-red-600 text-lg">{(Number(product.price) * qty).toLocaleString()}đ</span></p>
                <button onClick={handleAddToCart} className="w-full bg-bme-primary hover:bg-bme-secondary text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                  <ShoppingCart size={20} /> THÊM VÀO GIỎ HÀNG
                </button>
              </>
            ) : (
              <div className="w-full bg-gray-200 text-gray-500 font-bold py-3 rounded-xl text-center text-lg">HẾT HÀNG</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------ StoreProfile ------------------
export const StoreProfile = ({ currentUser, viewingStoreId, setViewingStoreId, mode = 'PUBLIC_MARKET' }: { currentUser: any, viewingStoreId: string | null, setViewingStoreId: (id: string | null) => void, mode?: 'PUBLIC_MARKET' | 'MERCHANT_DASHBOARD' }) => {
  const [stores, setStores] = useState(() => safeGet('bme_stores', []));
  const [products, setProducts] = useState(() => safeGet('bme_products', safeGet('products', [])));
  const [orders, setOrders] = useState(() => safeGet('bme_orders', safeGet('orders', [])));
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [marketSearch, setMarketSearch] = useState('');
  const [newStoreForm, setNewStoreForm] = useState({ name: '', description: '', address: '' });
  const [newProductForm, setNewProductForm] = useState({ name: '', price: '', stock: '' });
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);

  const roleUpper = String(currentUser?.role || '').toUpperCase();
  const businessTypeUpper = String(currentUser?.businessType || '').toUpperCase();
  const isMerchant = roleUpper === 'BUSINESS' && businessTypeUpper === 'MERCHANT';
  const myStore = stores.find((s: any) => s?.ownerPhone === currentUser?.phone);
  const myProducts = products.filter((p: any) => p?.storeId === myStore?.id);
  const myOrders = orders.filter((o: any) => o?.storeId === myStore?.id);

  useEffect(() => {
    const syncData = () => {
      setStores(safeGet('bme_stores', []));
      setProducts(safeGet('bme_products', safeGet('products', [])));
      setOrders(safeGet('bme_orders', safeGet('orders', [])));
    };
    syncData();
    const timer = setInterval(syncData, 2500);
    return () => clearInterval(timer);
  }, []);

  const persistProducts = (nextProducts: any[]) => {
    setProducts(nextProducts);
    safeSet('bme_products', nextProducts);
    safeSet('products', nextProducts);
  };

  const handleCreateStore = () => {
    if (!isMerchant || !currentUser?.phone) {
      showToast('Chỉ BUSINESS MERCHANT được phép tạo gian hàng', 'error');
      return;
    }
    if (!newStoreForm.name.trim() || !newStoreForm.description.trim() || !newStoreForm.address.trim()) {
      showToast('Vui lòng nhập đủ Tên Shop, Mô tả và Địa chỉ', 'error');
      return;
    }
    const existed = stores.find((s: any) => s?.ownerPhone === currentUser?.phone);
    if (existed?.id) {
      showToast('Tài khoản đã có gian hàng, chuyển sang dashboard quản lý', 'info');
      return;
    }

    const createdStore = {
      id: `store_${Date.now()}`,
      ownerId: currentUser?.id,
      ownerPhone: currentUser?.phone,
      name: newStoreForm.name.trim(),
      description: newStoreForm.description.trim(),
      address: newStoreForm.address.trim(),
      rating: 5,
      feedback_count: 0,
      status: 'online'
    };
    const nextStores = [createdStore, ...stores];
    setStores(nextStores);
    safeSet('bme_stores', nextStores);
    setNewStoreForm({ name: '', description: '', address: '' });
    showToast('Khởi tạo gian hàng thành công', 'success');
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        setProductImageBase64(null);
        return;
      }

      if (file.size > 500 * 1024) {
        alert('Dung lượng ảnh quá lớn! Để hệ thống hoạt động ổn định, vui lòng chọn ảnh dưới 500KB.');
        e.target.value = '';
        return;
      }

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }
          reject(new Error('Kết quả đọc ảnh không hợp lệ.'));
        };
        reader.onerror = () => {
          reject(new Error('Không thể đọc ảnh đã chọn.'));
        };
        reader.readAsDataURL(file);
      });

      setProductImageBase64(base64Image);
    } catch (error) {
      console.error('Lỗi khi xử lý ảnh sản phẩm:', error);
      showToast('Không thể xử lý ảnh sản phẩm. Vui lòng thử lại!', 'error');
      setProductImageBase64(null);
    }
  };

  const handleAddProduct = () => {
    if (!myStore?.id) {
      showToast('Chưa xác định được gian hàng của bạn', 'error');
      return;
    }
    if (!newProductForm.name.trim() || !newProductForm.price || !productImageBase64 || newProductForm.stock === '') {
      showToast('Vui lòng nhập đủ Tên, Giá, Ảnh sản phẩm và Số lượng kho', 'error');
      return;
    }
    const stockValue = Number(newProductForm.stock);
    const priceValue = Number(newProductForm.price);
    if (Number.isNaN(stockValue) || stockValue < 0 || Number.isNaN(priceValue) || priceValue < 0) {
      showToast('Giá hoặc số lượng kho không hợp lệ', 'error');
      return;
    }

    const createdProduct = {
      id: `prod_${Date.now()}`,
      storeId: myStore.id,
      storeName: myStore.name,
      name: newProductForm.name.trim(),
      price: priceValue,
      image: productImageBase64,
      stock: stockValue,
      soldCount: 0,
      description: ''
    };
    const nextProducts = [createdProduct, ...products];
    persistProducts(nextProducts);
    setNewProductForm({ name: '', price: '', stock: '' });
    setProductImageBase64(null);
    showToast('Đăng sản phẩm thành công', 'success');
  };

  const handleDeleteProduct = (productId: string) => {
    const target = myProducts.find((p: any) => p?.id === productId);
    if (!target?.id) return;
    const nextProducts = products.filter((p: any) => p?.id !== productId);
    persistProducts(nextProducts);
    showToast('Đã xóa sản phẩm', 'info');
  };

  const handleOpenStoreChat = (store: any) => {
    if (!currentUser?.phone) {
      showToast('Vui lòng đăng nhập để nhắn tin trao đổi', 'error');
      return;
    }
    if (!store?.ownerPhone) {
      showToast('Không tìm thấy thông tin liên hệ cửa hàng', 'error');
      return;
    }
    if (store?.ownerPhone === currentUser?.phone) {
      showToast('Bạn đang là chủ gian hàng này', 'info');
      return;
    }
    document.dispatchEvent(new CustomEvent('openChat', {
      detail: {
        id: store?.ownerId || store?.id,
        name: store?.name || 'Cửa hàng',
        phone: store?.ownerPhone,
        role: 'business',
        businessType: 'merchant'
      }
    }));
  };

  const handleApproveOrder = (orderId: string) => {
    if (!myStore?.id) return;
    const order = myOrders.find((o: any) => o?.id === orderId);
    if (!order?.id) return;

    const nextOrders = orders.map((o: any) => o?.id === orderId ? { ...o, status: 'SHIPPED' } : o);
    setOrders(nextOrders);
    safeSet('bme_orders', nextOrders);
    safeSet('orders', nextOrders);

    const nextProducts = products.map((p: any) => {
      if (p?.storeId !== myStore?.id) return p;
      const itemFromArray = Array.isArray(order?.items) ? order.items.find((it: any) => it?.id === p?.id) : null;
      const deductQty = itemFromArray?.qty != null
        ? Number(itemFromArray?.qty || 0)
        : (order?.productId === p?.id ? Number(order?.quantity || 0) : 0);
      if (!deductQty || deductQty <= 0) return p;
      return {
        ...p,
        stock: Math.max(0, Number(p?.stock || 0) - deductQty),
        soldCount: Number(p?.soldCount || 0) + deductQty
      };
    });
    persistProducts(nextProducts);
    showToast('Đã duyệt đơn và cập nhật tồn kho', 'success');
  };

  // =========================
  // MERCHANT DASHBOARD MODE
  // =========================
  if (mode === 'MERCHANT_DASHBOARD') {
    if (!isMerchant) {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p>
          <p className="text-yellow-700 mt-2">Khu vực này chỉ dành cho BUSINESS MERCHANT.</p>
        </div>
      );
    }

    if (!myStore?.id) {
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Khởi tạo Gian hàng mới</h3>
          <p className="text-sm text-gray-600">Tài khoản của bạn chưa có Shop. Vui lòng tạo một gian hàng duy nhất để bắt đầu kinh doanh.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newStoreForm.name} onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })} placeholder="Tên Shop" className="p-2.5 border rounded" />
            <input value={newStoreForm.address} onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })} placeholder="Địa chỉ" className="p-2.5 border rounded" />
            <textarea value={newStoreForm.description} onChange={(e) => setNewStoreForm({ ...newStoreForm, description: e.target.value })} placeholder="Mô tả" rows={3} className="p-2.5 border rounded md:col-span-2 resize-none" />
          </div>
          <button onClick={handleCreateStore} className="bg-bme-primary hover:bg-bme-secondary text-white font-bold px-5 py-2.5 rounded-lg">Tạo gian hàng</button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Dashboard Gian hàng: {myStore?.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{myStore?.description}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Đăng bán sản phẩm mới</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} placeholder="Tên" className="p-2 border rounded" />
            <input type="number" value={newProductForm.price} onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })} placeholder="Giá" className="p-2 border rounded" />
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={handleProductImageUpload} className="w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {productImageBase64 && <img src={productImageBase64} alt="Preview sản phẩm" className="h-16 w-16 object-cover rounded" />}
            </div>
            <input type="number" value={newProductForm.stock} onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })} placeholder="Số lượng kho" className="p-2 border rounded" />
          </div>
          <button onClick={handleAddProduct} className="mt-4 bg-bme-primary hover:bg-bme-secondary text-white font-bold px-5 py-2 rounded">Đăng sản phẩm</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Bảng quản lý kho</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 font-bold">Tên sản phẩm</th>
                  <th className="p-3 font-bold">Giá</th>
                  <th className="p-3 font-bold">Kho</th>
                  <th className="p-3 font-bold">Lượt bán</th>
                  <th className="p-3 font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map((p: any) => (
                  <tr key={p?.id} className="border-b">
                    <td className="p-3 font-semibold">{p?.name}</td>
                    <td className="p-3">{Number(p?.price || 0).toLocaleString()}đ</td>
                    <td className="p-3">
                      <div className="font-bold">{Number(p?.stock || 0)}</div>
                      {Number(p?.stock || 0) === 0 && <div className="text-xs font-black text-red-700 mt-1">🚨 HẾT HÀNG</div>}
                    </td>
                    <td className="p-3">{Number(p?.soldCount || 0)}</td>
                    <td className="p-3">
                      <button onClick={() => handleDeleteProduct(p?.id)} className="text-red-600 hover:text-red-800 font-bold">Xóa</button>
                    </td>
                  </tr>
                ))}
                {myProducts.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">Chưa có sản phẩm nào</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4">Bảng quản lý đơn hàng</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 font-bold">Mã đơn</th>
                  <th className="p-3 font-bold">Sản phẩm</th>
                  <th className="p-3 font-bold">Khách hàng</th>
                  <th className="p-3 font-bold">Tổng</th>
                  <th className="p-3 font-bold">Trạng thái</th>
                  <th className="p-3 font-bold">Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o: any) => (
                  <tr key={o?.id} className="border-b">
                    <td className="p-3 font-mono text-xs">{o?.id}</td>
                    <td className="p-3">{Array.isArray(o?.items) ? o.items.map((item: any) => `${item?.name || 'Sản phẩm'} x${item?.qty || 0}`).join(', ') : (o?.productName || 'N/A')}</td>
                    <td className="p-3">{o?.buyerPhone || 'N/A'}</td>
                    <td className="p-3 font-bold text-red-600">{Number(o?.totalPrice || 0).toLocaleString()}đ</td>
                    <td className="p-3">{o?.status}</td>
                    <td className="p-3">
                      {(o?.status === 'Chờ xác nhận' || o?.status === 'PENDING') && (
                        <button onClick={() => handleApproveOrder(o?.id)} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-bold">Duyệt đơn</button>
                      )}
                    </td>
                  </tr>
                ))}
                {myOrders.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">Chưa có đơn hàng nào</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // PUBLIC MARKET MODE
  // =========================
  const normalizedMarketSearch = String(marketSearch || '').toLowerCase();
  const visibleStores = (Array.isArray(stores) ? stores : []).filter((s: any) => {
    const storeName = String(s?.name || '').toLowerCase();
    const storeDesc = String(s?.description || '').toLowerCase();
    const storeAddress = String(s?.address || '').toLowerCase();
    return storeName.includes(normalizedMarketSearch) || storeDesc.includes(normalizedMarketSearch) || storeAddress.includes(normalizedMarketSearch);
  });
  const activeStore = stores.find((s: any) => s?.id === viewingStoreId);
  const storeProducts = (Array.isArray(products) ? products : []).filter((p: any) => p?.storeId === viewingStoreId);
  const visibleProducts = (Array.isArray(products) ? products : []).filter((p: any) => {
    const productName = String(p?.name || '').toLowerCase();
    const storeName = String(p?.storeName || '').toLowerCase();
    return productName.includes(normalizedMarketSearch) || storeName.includes(normalizedMarketSearch);
  });

  if (!viewingStoreId) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Chợ Y tế hiện đại</h3>
          <input value={marketSearch} onChange={(e) => setMarketSearch(e.target.value)} placeholder="Tìm theo tên Shop, sản phẩm, địa chỉ..." className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:border-bme-primary" />
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-gray-800">Danh sách cửa hàng</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleStores.map((store: any) => {
              const isStoreOnline = store?.isOnline !== false;
              return (
                <div key={store?.id} onClick={() => setViewingStoreId(store?.id)} className="bg-white p-5 rounded-xl border border-gray-200 cursor-pointer shadow-md hover:shadow-xl transition-transform hover:-translate-y-1">
                  <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{store?.name}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store?.description}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><MapPin size={12}/> {store?.address || 'Chưa cập nhật địa chỉ'}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isStoreOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    <span className={`text-xs font-bold ${isStoreOnline ? 'text-green-600' : 'text-gray-500'}`}>{isStoreOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
                  </div>
                </div>
              );
            })}
            {visibleStores.length === 0 && <div className="col-span-full bg-white p-6 text-center text-gray-500 rounded-xl border border-dashed">Không có gian hàng phù hợp</div>}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-gray-800">Sản phẩm nổi bật toàn sàn</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleProducts.map((p: any) => (
              <div key={p?.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-transform hover:-translate-y-1">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img src={p?.image} alt={p?.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 truncate">{p?.storeName || 'Không rõ cửa hàng'}</p>
                  <h4 className="font-bold text-gray-800 line-clamp-2 min-h-[40px] mt-1">{p?.name}</h4>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-bme-accent font-black text-lg">{Number(p?.price || 0).toLocaleString()}đ</p>
                    <span className="text-xs font-semibold text-gray-500">Kho: {Number(p?.stock || 0)}</span>
                  </div>
                  <button onClick={() => { setViewingStoreId(p?.storeId || null); }} className="w-full mt-3 bg-blue-50 hover:bg-bme-primary hover:text-white text-bme-primary font-bold py-2 rounded-lg transition">Xem tại gian hàng</button>
                </div>
              </div>
            ))}
            {visibleProducts.length === 0 && <div className="col-span-full bg-white p-6 text-center text-gray-500 rounded-xl border border-dashed">Không có sản phẩm phù hợp bộ lọc</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <button onClick={() => setViewingStoreId(null)} className="flex items-center gap-2 font-bold text-gray-700 hover:text-bme-primary bg-white px-4 py-2 rounded-lg border">
          <ArrowLeft size={18} /> Quay lại Chợ tổng
        </button>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-800">{activeStore?.name || 'Gian hàng'}</h3>
          <p className="text-gray-600 mt-1">{activeStore?.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <p className="flex items-center gap-2"><MapPin size={16}/> {activeStore?.address || 'Chưa cập nhật địa chỉ'}</p>
            <p className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${activeStore?.isOnline !== false ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span><span className={activeStore?.isOnline !== false ? 'text-green-600 font-bold' : 'text-gray-500'}>{activeStore?.isOnline !== false ? 'Đang hoạt động' : 'Ngoại tuyến'}</span></p>
            <button onClick={() => handleOpenStoreChat(activeStore)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><MessageCircle size={16}/> Nhắn tin trao đổi</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {storeProducts.map((p: any) => (
            <div key={p?.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-transform hover:-translate-y-1">
              <div className="aspect-square bg-gray-100 overflow-hidden"><img src={p?.image} alt={p?.name} className="w-full h-full object-cover" /></div>
              <div className="p-4">
                <h4 className="font-bold line-clamp-2 min-h-[40px]">{p?.name}</h4>
                <p className="text-bme-accent font-black text-xl mt-1">{Number(p?.price || 0).toLocaleString()}đ</p>
                <p className="text-xs font-semibold text-gray-600 mt-1">Tồn kho: {Number(p?.stock || 0)}</p>
                <button onClick={() => setSelectedProduct(p)} className={`w-full mt-3 font-bold py-2 rounded-lg transition ${Number(p?.stock || 0) === 0 ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-bme-primary hover:bg-bme-primary hover:text-white'}`}>
                  {Number(p?.stock || 0) === 0 ? 'HẾT HÀNG' : 'Xem chi tiết'}
                </button>
              </div>
            </div>
          ))}
          {storeProducts.length === 0 && <div className="col-span-full bg-white p-6 text-center text-gray-500 rounded-xl border border-dashed">Shop chưa có sản phẩm nào</div>}
        </div>
      </div>
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          store={activeStore || stores.find((s: any) => s?.id === selectedProduct?.storeId)}
          currentUser={currentUser}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

// ------------------ User Profile (MỚI) ------------------
export const UserProfile = ({ userId, currentUser }: { userId: string, currentUser: any }) => {
  const users = safeGet('bme_users', []);
  const stores = safeGet('bme_stores', []);
  const posts = safeGet('bme_posts', []);
  const orders = safeGet('bme_orders', []);
  const [feedbacks, setFeedbacks] = useState(() => safeGet('bme_feedbacks', []));
  const [ratingVal, setRatingVal] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const user = users.find((u:any) => u.id === userId);

  // Early return if user not found
  if(!user) return <div className="p-8 text-center text-gray-500">Người dùng không tồn tại.</div>;

  // All other state and variables that depend on `user`
  const userStore = stores.find((s:any) => s.ownerId === userId);
  const userPosts = posts.filter((p:any) => p.authorId === userId);
  const myOrders = orders.filter((o:any) => o.buyerId === userId);
  // Saved posts for the profile owner
  const savedPostIds: string[] = user?.savedPostIds || [];
  const savedPosts = posts.filter((p: any) => savedPostIds.includes(p.id));

  const [securityForm, setSecurityForm] = useState({
    password: '',
    cccd: user.cccd || '',
    taxId: user.taxId || ''
  });

  const isTechOrExpert = user.role === 'coordinator' || user.businessType === 'engineer';
  const userFeedbacks = feedbacks.filter((f:any) => f.targetUserId === userId);
  const avgRating = userFeedbacks.length > 0 ? (userFeedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / userFeedbacks.length).toFixed(1) : 0;

  const handleLeaveFeedback = () => {
    if (!currentUser) return showToast('Vui lòng đăng nhập để đánh giá', 'error');
    if (!commentText.trim()) return showToast('Vui lòng nhập bình luận', 'error');
    const fb = { 
      id:`fb_${Date.now()}`, 
      targetUserId: userId, 
      userId: currentUser.id, 
      author: currentUser.name, 
      rating: ratingVal, 
      comment: commentText, 
      date: new Date().toLocaleDateString(), 
      avatar: currentUser.avatar || `https://i.pravatar.cc/150?u=${Date.now()}` 
    };
    const next = [fb, ...feedbacks]; 
    setFeedbacks(next); 
    safeSet('bme_feedbacks', next); 
    setCommentText(''); 
    setRatingVal(5);
    showToast('Đã gửi đánh giá thành công', 'success');
  };

  const handleSubmitUpdateRequest = () => {
    if (!securityForm.password.trim() && !securityForm.cccd.trim() && !securityForm.taxId.trim()) {
      showToast('Vui lòng nhập ít nhất 1 thông tin bảo mật cần thay đổi', 'error');
      return;
    }

    const requests = safeGet('adminChangeRequests', safeGet('bme_admin_change_requests', []));
    const requestsArray = Array.isArray(requests) ? requests : [];
    const newReq = {
      id: `req_${Date.now()}`,
      userId: user.id,
      userPhone: user.phone,
      oldData: {
        name: user.name, password: user.password, phone: user.phone, cccd: user.cccd || '', taxId: user.taxId || '', role: user.role
      },
      newData: {
        password: securityForm.password.trim() || user.password || '',
        cccd: securityForm.cccd.trim(),
        taxId: securityForm.taxId.trim()
      },
      status: 'PENDING',
      createdAt: new Date().toLocaleString()
    };
    const nextRequests = [...requestsArray, newReq];
    safeSet('adminChangeRequests', nextRequests);
    safeSet('bme_admin_change_requests', nextRequests);
    showToast('Yêu cầu thay đổi bảo mật đã được gửi và đang chờ Admin phê duyệt', 'success');
    setSecurityForm({
      password: '',
      cccd: securityForm.cccd,
      taxId: securityForm.taxId
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* KHU VỰC CHÍNH (BÊN TRÁI): HỒ SƠ NĂNG LỰC CÔNG KHAI */}
      <div className="lg:col-span-8 space-y-6">
        {/* Card Thông tin Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-bme-primary to-bme-secondary"></div>
          <div className="px-6 pb-6 relative">
            <div className="absolute -top-12 border-4 border-white rounded-full bg-white"><Avatar src={user.avatar} name={user.name} size={96} userId={user.id} /></div>
            <div className="mt-14 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {user.name} 
                  {user.role==='admin' && <Shield size={20} className="text-blue-500"/>} 
                  {user.role==='coordinator' && <Star size={20} className="text-yellow-500"/>}
                </h2>
                <p className="text-gray-500">{user.role === 'business' ? '🏬 Tài khoản Doanh nghiệp' : user.role === 'coordinator' ? '👨‍🏫 Chuyên gia kỹ thuật' : user.role === 'supervisor' ? '👁️ Ban Giám sát' : '👤 Tài khoản Cá nhân'}</p>
                <div className="flex gap-4 mt-3 text-sm flex-wrap">
                  <span className="text-gray-600 font-medium">📞 SĐT: {user.phone}</span>
                  {user.cccd && <span className="text-gray-600 font-medium">💳 CCCD: {user.cccd}</span>}
                  {user.taxId && <span className="text-gray-600 font-medium">🏢 MST: {user.taxId}</span>}
                  <span className="text-gray-600 font-medium">🕒 Hoạt động: {user.isOnline ? <span className="text-green-600 font-bold">Đang Online</span> : new Date(user.lastActive).toLocaleString()}</span>
                </div>
              </div>
              {currentUser?.id !== userId && (
                <button onClick={()=>document.dispatchEvent(new CustomEvent('openChat', {detail: user}))} className="bg-bme-primary hover:bg-bme-secondary text-white px-5 py-2 rounded-lg shadow font-bold flex items-center gap-2 transition"><MessageSquare size={18}/> Nhắn tin ngay</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Store nếu là Business */}
          {user.role === 'business' && userStore ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2"><Store size={20} className="text-bme-primary"/> Gian hàng đang kinh doanh</h3>
              <p className="font-semibold text-gray-800">{userStore.name}</p>
              <p className="text-sm text-gray-600 mt-1 mb-4">{userStore.description}</p>
              <div className="space-y-2">
                {(userStore.products || []).slice(0, 3).map((p:any, i:number) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                    <span className="font-medium text-gray-700 truncate mr-2">{p.name}</span>
                    <span className="text-bme-accent font-bold shrink-0">{Number(p.price).toLocaleString()}đ</span>
                  </div>
                ))}
                {(userStore.products?.length || 0) > 3 && <p className="text-center text-xs text-blue-500 mt-2 cursor-pointer hover:underline" onClick={()=>document.dispatchEvent(new CustomEvent('openStore', {detail: userStore.id}))}>Xem tất cả tại Gian hàng</p>}
              </div>
              <button onClick={()=>document.dispatchEvent(new CustomEvent('openStore', {detail: userStore.id}))} className="w-full mt-4 border border-bme-primary text-bme-primary py-2 rounded-lg font-bold hover:bg-blue-50 transition">Đi đến Gian hàng</button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
              <User size={40} className="mb-2 opacity-30" />
              <p>Chưa có thông tin Gian hàng</p>
            </div>
          )}

          {/* Bài viết cá nhân */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2"><FileText size={20} className="text-bme-primary"/> Bài viết gần đây</h3>
            {userPosts.length === 0 ? <p className="text-center text-gray-500 py-4">Chưa có bài viết nào.</p> : (
              <div className="space-y-4">
                {userPosts.slice(0, 3).map((p:any) => (
                  <div key={p.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{p.category}</span> <span>{p.time}</span></div>
                    <p className="text-sm text-gray-800 line-clamp-2">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lịch sử mua hàng */}
        {(currentUser?.id === userId || currentUser?.role === 'admin') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2"><Package size={20} className="text-bme-primary"/> Lịch sử mua hàng ({myOrders.length})</h3>
            {myOrders.length === 0 ? <p className="text-center text-gray-500 py-6">Bạn chưa có giao dịch nào trên hệ thống.</p> : (
              <div className="space-y-4">
                {myOrders.sort((a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((o:any) => (
                  <div key={o.id} className="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-bme-primary transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-gray-200 pb-3">
                      <div>
                        <p className="font-bold text-gray-800">Mã ĐH: <span className="text-bme-primary">{o.id}</span></p>
                        <p className="text-sm text-gray-500 mt-1">Đặt lúc: {o.timestamp} • Cửa hàng: <span className="font-bold text-gray-700 cursor-pointer hover:underline hover:text-bme-primary" onClick={()=>document.dispatchEvent(new CustomEvent('openStore', {detail: o.storeId}))}>{o.storeName}</span></p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap text-center ${o.status === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : o.status === 'Đang giao hàng' ? 'bg-blue-100 text-blue-800 border border-blue-200' : o.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{o.status}</span>
                    </div>
                    <div className="space-y-2">
                      {o.items.map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-sm"><span className="text-gray-700"><span className="font-bold text-gray-600 mr-2">{item.qty}x</span> {item.name}</span> <span className="font-semibold text-gray-800">{(item.price * item.qty).toLocaleString()}đ</span></div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={16}/> {o.shippingAddress}</p>
                      <p className="font-bold text-gray-800 text-lg">Tổng: <span className="text-red-600">{o.totalPrice.toLocaleString()}đ</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KHO XEM LẠI BÀI VIẾT ĐÃ LƯU */}
        {currentUser?.id === userId && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2">
              <Bookmark size={20} className="text-bme-primary fill-bme-primary" /> Kho bài viết đã lưu ({savedPosts.length})
            </h3>
            {savedPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">
                <Bookmark size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Chưa có bài viết nào được lưu trữ.</p>
                <p className="text-sm mt-1">Hãy bấm nút "Lưu bài viết" trên các bài đăng bạn muốn xem lại.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedPosts.map((p: any) => (
                  <div key={p.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-bme-primary transition">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800">{p.author}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold">{p.category}</span>
                        <span className="text-xs text-gray-400">{p.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{p.content}</p>
                    {p.attachment && p.attachment.typeLabel !== 'Image' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-bme-primary font-semibold">
                        <FileText size={14} /> {p.attachment.name}
                      </div>
                    )}
                    {p.images && p.images.length > 0 && (
                      <img src={p.images[0]} alt="post" className="mt-2 rounded-lg max-h-32 object-cover border border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Đánh giá Kỹ sư / Chuyên gia */}
        {isTechOrExpert && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-end mb-4 border-b pb-2">
              <h3 className="font-bold text-lg flex items-center gap-2"><Star size={20} className="text-yellow-500 fill-yellow-500"/> Đánh giá Chuyên gia / Kỹ sư</h3>
              {userFeedbacks.length > 0 && <span className="font-bold text-xl text-yellow-600">{avgRating}/5 ({userFeedbacks.length} lượt)</span>}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center mb-6">
              <select value={ratingVal} onChange={e=>setRatingVal(Number(e.target.value))} className="p-2.5 border border-gray-300 rounded-lg outline-none font-bold text-gray-700 focus:border-bme-primary bg-white w-full sm:w-auto">
                {[5,4,3,2,1].map(n=>(<option key={n} value={n}>{n} Sao</option>))}
              </select>
              <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Nhập nhận xét của bạn về kỹ năng, thái độ phục vụ..." className="flex-1 w-full sm:w-auto p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" />
              <button onClick={handleLeaveFeedback} className="w-full sm:w-auto px-6 py-2.5 bg-bme-primary text-white font-bold rounded-lg hover:bg-bme-secondary transition shadow-sm whitespace-nowrap flex items-center justify-center gap-2"><Send size={18}/> Gửi đánh giá</button>
            </div>

            <div className="space-y-4">
              {userFeedbacks.length === 0 ? <p className="text-center text-gray-500 py-4 italic">Chưa có đánh giá nào cho chuyên gia này.</p> : 
                userFeedbacks.map((f:any) => (
                  <div key={f.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4 items-start">
                    <Avatar src={f.avatar} name={f.author} size={40} userId={f.userId} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-800">{f.author}</p>
                        <p className="text-xs text-gray-500 font-medium">{f.date}</p>
                      </div>
                      <div className="flex my-1">
                        {[...Array(5)].map((_,i)=>(<Star key={i} size={14} className={i<f.rating? 'fill-yellow-400 text-yellow-400':'text-gray-300'} />))}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{f.comment}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* KHU VỰC BÊN PHẢI: CẬP NHẬT THÔNG TIN BẢO MẬT */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
          <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2">
            <Lock size={20} className="text-orange-500" /> Yêu cầu thay đổi bảo mật
          </h3>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Thông tin tài khoản bảo mật</p>
            <p className="text-sm text-gray-700">SĐT: <strong>{user?.phone || 'N/A'}</strong></p>
            <p className="text-sm text-gray-700">CCCD: <strong>{user?.cccd || 'Chưa cập nhật'}</strong></p>
            <p className="text-sm text-gray-700">MST: <strong>{user?.taxId || 'Chưa cập nhật'}</strong></p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Mật khẩu: <strong className="font-mono tracking-widest">{showPassword ? (user?.password || 'N/A') : '••••••••'}</strong></span>
              <button onClick={() => setShowPassword(v => !v)} className="text-xs font-bold text-bme-primary hover:underline px-2 py-0.5 bg-blue-50 border border-blue-200 rounded flex items-center gap-1">
                <Eye size={12} /> {showPassword ? 'Ẩn đi' : 'Hiển thị'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
              <input 
                type="password"
                value={securityForm.password} 
                onChange={e => setSecurityForm({...securityForm, password: e.target.value})} 
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" 
                placeholder="Để trống nếu không đổi"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CCCD</label>
              <input 
                value={securityForm.cccd} 
                onChange={e => setSecurityForm({...securityForm, cccd: e.target.value})} 
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mã số thuế (nếu có)</label>
              <input 
                value={securityForm.taxId} 
                onChange={e => setSecurityForm({...securityForm, taxId: e.target.value})} 
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" 
              />
            </div>
            <button 
              onClick={handleSubmitUpdateRequest} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center items-center gap-2">
              <Send size={18}/> Gửi yêu cầu
            </button>
            <p className="text-xs text-gray-500 text-center">Lưu ý: Yêu cầu sẽ ở trạng thái PENDING cho đến khi Admin bấm PHÊ DUYỆT.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------ Role-based Dashboard ------------------
export const AdminDashboard = ({ currentUser }: { currentUser: any }) => {
  // Phân quyền Tab hiển thị dựa trên vai trò
  const role = currentUser?.role;
  const isSupervisor = role === 'supervisor';
  const isAdmin = role === 'admin';
  // Supervisor: chỉ có tab kiểm tra chéo. Admin: tập trung hỗ trợ người dùng + mật khẩu
  const defaultTab = isAdmin ? 'admin_support' : 'supervisor_inspection';
  const [tab, setTab] = useState(defaultTab);
  const [users, setUsers] = useState(()=> safeGet('bme_users', []));
  const [posts, setPosts] = useState(()=> safeGet('bme_posts', []));
  const [communities, setCommunities] = useState(()=> safeGet('bme_communities', []));
  const [logs, setLogs] = useState(()=> safeGet('bme_audit_logs', []));
  const [changeRequests, setChangeRequests] = useState(()=> safeGet('adminChangeRequests', safeGet('bme_admin_change_requests', [])));
  const [adminNotifs, setAdminNotifs] = useState(()=> safeGet('adminNotifications', safeGet('bme_admin_notifications', [])));
  const [supportMessages, setSupportMessages] = useState(()=> safeGet('bme_support_messages', []));
  const [stores, setStores] = useState(()=> safeGet('bme_stores', safeGet('stores', [])));
  const [orders, setOrders] = useState(()=> safeGet('bme_orders', safeGet('orders', [])));
  const [activeAnalytics, setActiveAnalytics] = useState<string | null>(null);
  const [supervisorView, setSupervisorView] = useState<'ANALYTICS' | 'TRANSACTIONS'>('ANALYTICS');

  const normalizePhone = (value: any) => String(value || '').replace(/\D/g, '');
  const maskPhone = (value: any) => {
    const digits = normalizePhone(value);
    if (!digits) return 'Ẩn danh';
    if (digits.length <= 6) return `${digits.slice(0, 2)}****`;
    return `${digits.slice(0, 2)}****${digits.slice(-3)}`;
  };
  const formatMonitoringTime = (value: any) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString('vi-VN');
    return String(value);
  };

  useEffect(() => {
    const fetchAdminData = () => {
      setUsers(safeGet('bme_users', []));
      setPosts(safeGet('bme_posts', []));
      setCommunities(safeGet('bme_communities', []));
      setLogs(safeGet('bme_audit_logs', []));
      setChangeRequests(safeGet('adminChangeRequests', safeGet('bme_admin_change_requests', [])));
      setAdminNotifs(safeGet('adminNotifications', safeGet('bme_admin_notifications', [])));
      setSupportMessages(safeGet('bme_support_messages', []));
      setStores(safeGet('bme_stores', safeGet('stores', [])));
      setOrders(safeGet('bme_orders', safeGet('orders', [])));
    };
    const interval = setInterval(fetchAdminData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hàm tiện ích tạo Log
  const writeLog = (action: string) => {
    const newLog = { id: Date.now(), user: currentUser.name, role: currentUser.role, action, time: new Date().toLocaleString() };
    setLogs(prev => { const next = [newLog, ...prev]; safeSet('bme_audit_logs', next); return next; });
  };

  // Supervisor actions (chỉ xóa bài/nhóm/user vi phạm)
  const deletePost = (id:string) => { const next = posts.filter((p:any)=>p.id!==id); setPosts(next); safeSet('bme_posts', next); writeLog(`Supervisor xóa bài viết vi phạm ID: ${id}`); showToast('Đã xóa bài viết vi phạm', 'success'); };

  // Coordinator actions
  // Account Change Request actions
  const approveAccountRequest = (req: any) => {
    const currentUsers = safeGet('bme_users', []);
    const uIndex = currentUsers.findIndex((u:any) => u.id === req.userId);
    if(uIndex > -1) {
      currentUsers[uIndex] = { ...currentUsers[uIndex], ...req.newData };
      safeSet('bme_users', currentUsers);
    }
    const nextReqs = changeRequests.map((r:any) => r.id === req.id ? {...r, status: 'APPROVED'} : r);
    setChangeRequests(nextReqs);
    safeSet('adminChangeRequests', nextReqs);
    safeSet('bme_admin_change_requests', nextReqs);
    writeLog(`Phê duyệt thay đổi thông tin SĐT: ${req.userPhone}`);
    showToast('Đã phê duyệt và cập nhật thông tin tài khoản!', 'success');
  };

  const rejectAccountRequest = (reqId: string) => {
    const nextReqs = changeRequests.map((r:any) => r.id === reqId ? {...r, status: 'REJECTED'} : r);
    setChangeRequests(nextReqs);
    safeSet('adminChangeRequests', nextReqs);
    safeSet('bme_admin_change_requests', nextReqs);
    writeLog(`Từ chối yêu cầu thay đổi thông tin Request ID: ${reqId}`);
    showToast('Đã từ chối yêu cầu cập nhật', 'info');
  };

  const communitiesArray = Array.isArray(communities) ? communities : [];
  const postsArray = Array.isArray(posts) ? posts : [];
  const usersArray = Array.isArray(users) ? users : [];
  const activeGroupsCount = communitiesArray.filter((c: any) => ['APPROVED', 'Approved', 'active', 'ACTIVE', undefined, null].includes(c?.status)).length;
  const pendingGroupsCount = communitiesArray.filter((c: any) => c?.status === 'PENDING_APPROVAL').length;
  const rejectedGroupsCount = communitiesArray.filter((c: any) => String(c?.status || '').toUpperCase() === 'REJECTED').length;
  const topGroup = communitiesArray
    .map((c: any) => ({ ...c, memberCount: Array.isArray(c?.members) ? c.members.length : Number(c?.membersCount || 0) }))
    .sort((a: any, b: any) => Number(b?.memberCount || 0) - Number(a?.memberCount || 0))[0];
  const activeEngineersCount = usersArray.filter((u: any) => String(u?.role || '').toLowerCase() === 'business' && String(u?.businessType || '').toLowerCase() === 'engineer' && String(u?.status || '').toLowerCase() === 'active').length;
  const activeMerchantsCount = usersArray.filter((u: any) => String(u?.role || '').toLowerCase() === 'business' && String(u?.businessType || '').toLowerCase() === 'merchant' && String(u?.status || '').toLowerCase() === 'active').length;
  const totalBusinessCount = activeEngineersCount + activeMerchantsCount;

  const postCategoryMap = postsArray.reduce((acc: Record<string, number>, post: any) => {
    const category = String(post?.category || 'Khác').trim() || 'Khác';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  const postCategoryData = Object.keys(postCategoryMap)
    .map((name) => ({ name, value: postCategoryMap[name] }))
    .sort((a, b) => b.value - a.value);

  const topGroupsData = [...communitiesArray]
    .map((group: any) => ({
      id: group?.id,
      name: String(group?.name || 'Nhóm chưa đặt tên'),
      members: Array.isArray(group?.members) ? group.members.length : Number(group?.membersCount || 0)
    }))
    .sort((a, b) => b.members - a.members)
    .slice(0, 5);

  const storesArray = Array.isArray(stores) ? stores : [];
  const ordersArray = Array.isArray(orders) ? orders : [];
  const monitoredOrders = ordersArray
    .filter((order: any) => {
      const status = String(order?.status || '').toUpperCase();
      return status === 'SHIPPED' || status === 'CONFIRMED';
    })
    .map((order: any) => {
      const storeName = storesArray?.find((store: any) => store?.id === order?.storeId)?.name || order?.storeName || 'Không xác định';
      const matchedBuyer = usersArray?.find((user: any) => normalizePhone(user?.phone) === normalizePhone(order?.buyerPhone));
      const customerLabel = matchedBuyer?.name || maskPhone(order?.buyerPhone);
      const itemsSummary = Array.isArray(order?.items) && order.items.length > 0
        ? order.items
          .map((item: any) => `${item?.name || item?.productName || 'Sản phẩm'} x${Number(item?.qty ?? item?.quantity ?? 1)}`)
          .join(', ')
        : `${order?.productName || 'Sản phẩm'} x${Number(order?.quantity ?? 1)}`;
      const confirmedTime = formatMonitoringTime(order?.confirmedAt || order?.updatedAt || order?.timestamp);

      return {
        id: order?.id,
        itemsSummary,
        storeName,
        customerLabel,
        confirmedTime,
        sortValue: Date.parse(order?.confirmedAt || order?.updatedAt || order?.timestamp || '') || 0
      };
    })
    .sort((a: any, b: any) => b.sortValue - a.sortValue);

  // =========================================================
  // ADMIN DASHBOARD - Tập trung hỗ trợ người dùng + mật khẩu
  // SUPERVISOR DASHBOARD - Tập trung kiểm tra chéo toàn sàn
  // =========================================================
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap bg-white p-2 rounded shadow-sm border border-gray-200">
        {isAdmin && <button onClick={()=>setTab('admin_support')} className={`px-4 py-2 rounded font-bold transition flex items-center gap-2 ${tab==='admin_support'?'bg-red-600 text-white shadow-lg':'hover:bg-gray-100 text-gray-700'}`}><Bell size={18}/> Hỗ trợ & Cấp lại Mật khẩu {adminNotifs.filter((n:any)=>n.status==='NEW').length>0 && <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">{adminNotifs.filter((n:any)=>n.status==='NEW').length}</span>}</button>}
        {isAdmin && <button onClick={()=>setTab('account_requests')} className={`px-4 py-2 rounded font-bold transition flex items-center gap-2 ${tab==='account_requests'?'bg-blue-600 text-white shadow-lg':'hover:bg-gray-100 text-gray-700'}`}><User size={18}/> Duyệt Sửa Tài Khoản {changeRequests.filter((r:any)=>r.status==='PENDING').length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">{changeRequests.filter((r:any)=>r.status==='PENDING').length}</span>}</button>}
        {isAdmin && <button onClick={()=>setTab('logs')} className={`px-4 py-2 rounded font-bold transition flex items-center gap-2 ${tab==='logs'?'bg-bme-primary text-white':'hover:bg-gray-100 text-gray-700'}`}><FileText size={18}/> System Logs</button>}
        {isSupervisor && <button onClick={()=>setTab('supervisor_inspection')} className={`px-4 py-2 rounded font-bold transition flex items-center gap-2 ${tab==='supervisor_inspection'?'bg-indigo-600 text-white shadow':'hover:bg-gray-100 text-gray-700'}`}><Shield size={18}/> Kiểm Tra Chéo Toàn Sàn</button>}
      </div>

      {/* ====== ADMIN: HỖ TRỢ NGƯỜI DÙNG + CẤP LẠI MẬT KHẨU ====== */}
      {tab === 'admin_support' && isAdmin && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Tổng Users</p><p className="text-3xl font-black text-bme-primary mt-1">{users.length}</p></div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Chờ duyệt TK</p><p className="text-3xl font-black text-yellow-600 mt-1">{changeRequests.filter((r:any)=>r.status==='PENDING').length}</p></div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Thông báo mới</p><p className="text-3xl font-black text-red-600 mt-1">{adminNotifs.filter((n:any)=>n.status==='NEW').length}</p></div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Tin hỗ trợ</p><p className="text-3xl font-black text-green-600 mt-1">{supportMessages.length}</p></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500">
            <h4 className="font-bold text-lg text-red-800 mb-4 flex items-center gap-2"><Bell size={20} className="text-red-500"/> Trung tâm Thông báo Cấp lại Mật khẩu (Real-time)</h4>
            <div className="space-y-3 max-h-72 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
              {adminNotifs.length === 0 && <p className="text-gray-500 text-sm italic text-center py-6">Chưa có yêu cầu quên mật khẩu nào.</p>}
              {adminNotifs.map((n:any) => (
                <div key={n.id} className={`flex items-start justify-between p-3 bg-white border rounded-lg shadow-sm ${n.status==='NEW'?'border-red-200 bg-red-50/30':'border-gray-100'}`}>
                  <div><p className="font-semibold text-gray-800 text-sm">{n.message}</p><span className="text-xs text-gray-400 font-mono mt-1 block">{n.time}</span></div>
                  {n.status==='NEW' && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">MỚI</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
            <h4 className="font-bold text-lg text-blue-800 mb-4 flex items-center gap-2"><MessageSquare size={20}/> Hộp thư Tin nhắn Hỗ trợ</h4>
            {supportMessages.length === 0 ? <p className="text-gray-500 italic text-center py-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl">Chưa có tin nhắn hỗ trợ nào.</p> : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {supportMessages.map((msg: any) => (
                  <div key={msg.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start mb-1"><p className="font-bold text-gray-800">{msg.senderName||msg.senderPhone}</p><span className="text-xs text-gray-400">{msg.time}</span></div>
                    <p className="text-sm text-gray-700">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500">
            <h4 className="font-bold text-lg text-purple-800 mb-4 flex items-center gap-2"><Users size={20}/> Danh sách người dùng hệ thống</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b"><tr><th className="p-3 font-bold">Tên</th><th className="p-3 font-bold">SĐT</th><th className="p-3 font-bold">Vai trò</th><th className="p-3 font-bold">Trạng thái</th></tr></thead>
                <tbody>
                  {users.filter((u:any)=>u.role!=='admin').map((u:any)=>(
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-semibold text-gray-800">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.phone}</td>
                      <td className="p-3"><span className="text-xs font-bold bg-gray-100 border px-2 py-0.5 rounded">{u.role}{u.businessType?` / ${u.businessType}`:''}</span></td>
                      <td className="p-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.status==='Banned'?'bg-red-100 text-red-700':u.status==='active'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{u.status==='Banned'?'BỊ CẤM':u.status==='active'?'Hoạt động':'Chờ duyệt'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====== ADMIN: DUYỆT SỬA TÀI KHOẢN OTP ====== */}
      {tab==='account_requests' && isAdmin && (
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600 animate-fade-in">
          <h4 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-2">
            <User size={24} className="text-blue-600"/> TRUNG TÂM PHÊ DUYỆT YÊU CẦU THAY ĐỔI BẢO MẬT — Đang chờ: {changeRequests.filter((r:any)=>r.status==='PENDING').length}
          </h4>
          <div className="space-y-4">
            {changeRequests.filter((r:any)=>r.status==='PENDING').length===0 && <p className="text-gray-500 italic py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">Không có yêu cầu cập nhật tài khoản nào đang chờ.</p>}
            {changeRequests.filter((r:any)=>r.status==='PENDING').map((req:any)=>(
              <div key={req.id} className="border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex justify-between items-center">
                  <span className="font-bold text-blue-800">Yêu cầu từ SĐT: {req.userPhone}</span>
                  <span className="text-xs font-semibold text-gray-500">{req.createdAt}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 p-0">
                  <div className="p-4 border-r border-gray-200 bg-gray-50/50">
                    <h5 className="font-bold text-gray-600 mb-3 text-sm uppercase">Thông tin Cũ</h5>
                    <ul className="text-sm space-y-1.5 text-gray-600">
                      <li>SĐT: <strong>{req.oldData?.phone || 'N/A'}</strong></li>
                      <li>Mật khẩu: <strong>••••••••</strong></li>
                      <li>CCCD: <strong>{req.oldData?.cccd||'Trống'}</strong></li>
                      <li>MST: <strong>{req.oldData?.taxId||'Trống'}</strong></li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white">
                    <h5 className="font-bold text-blue-600 mb-3 text-sm uppercase">Thông tin bảo mật mới đề xuất</h5>
                    <ul className="text-sm space-y-1.5 text-gray-800 mb-4">
                      <li>Mật khẩu: <strong className={req.newData?.password!==req.oldData?.password?'text-red-600 bg-red-50 px-1 rounded':''}>{req.newData?.password ? 'Đã thay đổi' : 'Giữ nguyên'}</strong></li>
                      <li>CCCD: <strong className={req.newData?.cccd!==req.oldData?.cccd?'text-red-600 bg-red-50 px-1 rounded':''}>{req.newData?.cccd||'Trống'}</strong></li>
                      <li>MST: <strong className={req.newData?.taxId!==req.oldData?.taxId?'text-red-600 bg-red-50 px-1 rounded':''}>{req.newData?.taxId||'Trống'}</strong></li>
                    </ul>
                    <div className="flex gap-2">
                      <button onClick={()=>approveAccountRequest(req)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 rounded shadow-sm text-sm">PHÊ DUYỆT</button>
                      <button onClick={()=>rejectAccountRequest(req.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 rounded shadow-sm text-sm">TỪ CHỐI</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== ADMIN: SYSTEM LOGS ====== */}
      {tab==='logs' && isAdmin && (
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500">
          <h4 className="font-bold text-lg mb-4">Nhật ký Hệ thống (Audit Logs)</h4>
          <div className="bg-slate-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs text-green-400 space-y-2">
            {logs.length===0 && <p className="text-gray-500">Chưa có log hoạt động.</p>}
            {logs.map((l:any)=>(
              <div key={l.id} className="border-b border-slate-800 pb-2">
                <span className="text-gray-400">[{l.time}]</span> <span className="text-blue-400">[{String(l.role||'').toUpperCase()}]</span> <span className="text-yellow-400">{l.user}</span>: <span className="text-white">{l.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== SUPERVISOR: KIỂM TRA CHÉO TOÀN SÀN ====== */}
      {tab==='supervisor_inspection' && isSupervisor && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <h4 className="font-bold text-indigo-800 text-lg flex items-center gap-2"><Shield size={22}/> Công Cụ Kiểm Tra Chéo Toàn Sàn — Thanh tra & Bảo vệ hệ thống</h4>
            <p className="text-indigo-600 text-sm mt-1">Supervisor có quyền xóa tối cao: xóa bài vi phạm, giải tán nhóm, xóa tài khoản vi phạm khỏi hệ thống.</p>
          </div>
          <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-gray-100 w-fit">
            <button
              onClick={() => setSupervisorView('ANALYTICS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${supervisorView === 'ANALYTICS' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Phân tích hệ thống
            </button>
            <button
              onClick={() => setSupervisorView('TRANSACTIONS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${supervisorView === 'TRANSACTIONS' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Kiểm soát Đơn hàng
            </button>
          </div>

          {supervisorView === 'ANALYTICS' && (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div onClick={() => setActiveAnalytics('GROUPS')} className={`bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'GROUPS' ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-xs font-bold text-indigo-600 uppercase">Nhóm cộng đồng</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{activeGroupsCount}</p>
              <p className="text-xs text-gray-500 mt-1">Đang hoạt động • {pendingGroupsCount} nhóm chờ duyệt</p>
            </div>
            <div onClick={() => setActiveAnalytics('POSTS')} className={`bg-white rounded-2xl p-5 border border-blue-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'POSTS' ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-xs font-bold text-blue-600 uppercase">Tần suất bài đăng</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{postsArray.length}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng số bài trên toàn hệ thống</p>
            </div>
            <div onClick={() => setActiveAnalytics('TOP_GROUPS')} className={`bg-white rounded-2xl p-5 border border-amber-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'TOP_GROUPS' ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-xs font-bold text-amber-600 uppercase">Top nhóm nổi bật</p>
              <p className="text-base font-black text-gray-800 mt-1 truncate">{topGroup?.name || 'Chưa có dữ liệu'}</p>
              <p className="text-xs text-gray-500 mt-1">{Number(topGroup?.memberCount || 0)} thành viên</p>
            </div>
            <div onClick={() => setActiveAnalytics('BUSINESS')} className={`bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'BUSINESS' ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-xs font-bold text-emerald-600 uppercase">Business đang hoạt động</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{totalBusinessCount}</p>
              <p className="text-xs text-gray-500 mt-1">Kỹ sư: {activeEngineersCount} • Cửa hàng: {activeMerchantsCount}</p>
            </div>
          </div>

          {activeAnalytics !== null && (
            <div className="bg-white p-6 rounded-xl shadow-inner mt-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-gray-800 text-lg">Chi tiết phân tích dữ liệu</h5>
                <button onClick={() => setActiveAnalytics(null)} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold">Đóng phân tích ✕</button>
              </div>

              {activeAnalytics === 'GROUPS' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">So sánh số lượng nhóm theo trạng thái.</p>
                  {[
                    { label: 'Đang hoạt động', value: activeGroupsCount, color: 'bg-green-500' },
                    { label: 'Chờ duyệt', value: pendingGroupsCount, color: 'bg-yellow-500' },
                    { label: 'Bị từ chối', value: rejectedGroupsCount, color: 'bg-red-500' }
                  ].map((item) => {
                    const total = Math.max(activeGroupsCount + pendingGroupsCount + rejectedGroupsCount, 1);
                    const width = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">{item.label}</span><span className="font-bold text-gray-800">{item.value}</span></div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`${item.color} h-full`} style={{ width: `${width}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeAnalytics === 'POSTS' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Phân bố bài đăng theo danh mục.</p>
                  {postCategoryData.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Chưa có dữ liệu bài đăng.</p>
                  ) : (
                    postCategoryData.map((item) => {
                      const max = Math.max(...postCategoryData.map((d) => d.value), 1);
                      const width = Math.round((item.value / max) * 100);
                      return (
                        <div key={item.name}>
                          <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">{item.name}</span><span className="font-bold text-gray-800">{item.value}</span></div>
                          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${width}%` }} /></div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeAnalytics === 'TOP_GROUPS' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Top 5 nhóm có số lượng thành viên cao nhất.</p>
                  {topGroupsData.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Chưa có dữ liệu nhóm.</p>
                  ) : (
                    topGroupsData.map((item, idx) => {
                      const max = Math.max(...topGroupsData.map((d) => d.members), 1);
                      const width = Math.round((item.members / max) * 100);
                      return (
                        <div key={item.id || item.name}>
                          <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">#{idx + 1} {item.name}</span><span className="font-bold text-gray-800">{item.members} TV</span></div>
                          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: `${width}%` }} /></div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeAnalytics === 'BUSINESS' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Tỷ trọng Merchant và Engineer đang hoạt động.</p>
                  {[
                    { label: 'MERCHANT', value: activeMerchantsCount, color: 'bg-emerald-500' },
                    { label: 'ENGINEER', value: activeEngineersCount, color: 'bg-cyan-500' }
                  ].map((item) => {
                    const total = Math.max(totalBusinessCount, 1);
                    const percent = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">{item.label}</span><span className="font-bold text-gray-800">{item.value} ({percent}%)</span></div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`${item.color} h-full`} style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border border-red-100 rounded-xl p-4 bg-red-50/30 flex flex-col">
              <h5 className="font-bold text-sm mb-3 text-red-700 flex items-center gap-1"><Trash2 size={16}/> Bài đăng ({posts.length})</h5>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
                {posts.length===0 && <p className="text-xs text-gray-500 italic text-center py-4">Trống</p>}
                {posts.map((p:any)=>(
                  <div key={p.id} className="flex justify-between items-start bg-white p-2.5 rounded-lg shadow-sm border border-red-100 text-xs hover:border-red-300 transition">
                    <div className="flex-1 min-w-0 pr-2"><p className="font-bold text-gray-800 truncate">{p.author}</p><p className="text-gray-500 truncate mt-0.5">{p.content}</p></div>
                    <button onClick={()=>deletePost(p.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded transition shrink-0"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/30 flex flex-col">
              <h5 className="font-bold text-sm mb-3 text-orange-700 flex items-center gap-1"><Users size={16}/> Nhóm cộng đồng ({communities.length})</h5>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
                {communities.length===0 && <p className="text-xs text-gray-500 italic text-center py-4">Trống</p>}
                {communities.map((c:any)=>(
                  <div key={c.id} className="flex justify-between items-start bg-white p-2.5 rounded-lg shadow-sm border border-orange-100 text-xs hover:border-orange-300 transition">
                    <div className="flex-1 min-w-0 pr-2"><p className="font-bold text-gray-800 truncate">{c.name}</p><p className="text-gray-500">Trạng thái: {c.status}</p></div>
                    <button onClick={()=>{const next=communities.filter((cc:any)=>cc.id!==c.id);setCommunities(next);safeSet('bme_communities',next);writeLog(`Supervisor giải tán nhóm: ${c.name}`);showToast('Đã xóa nhóm vi phạm','success');}} className="text-orange-500 hover:text-white hover:bg-orange-500 p-1.5 rounded transition shrink-0"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-purple-100 rounded-xl p-4 bg-purple-50/30 flex flex-col">
              <h5 className="font-bold text-sm mb-3 text-purple-700 flex items-center gap-1"><User size={16}/> Tài khoản ({users.filter((u:any)=>u.role!=='admin').length})</h5>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
                {users.filter((u:any)=>u.role!=='admin').length===0 && <p className="text-xs text-gray-500 italic text-center py-4">Trống</p>}
                {users.filter((u:any)=>u.role!=='admin').map((u:any)=>(
                  <div key={u.id} className="flex justify-between items-start bg-white p-2.5 rounded-lg shadow-sm border border-purple-100 text-xs hover:border-purple-300 transition">
                    <div className="flex-1 min-w-0 pr-2"><p className="font-bold text-gray-800 truncate">{u.name}</p><p className="text-gray-500 truncate">{u.phone} • {u.role}</p></div>
                    <button onClick={()=>{const next=users.filter((uu:any)=>uu.id!==u.id);setUsers(next);safeSet('bme_users',next);writeLog(`Supervisor xóa tài khoản: ${u.phone}`);showToast('Đã xóa tài khoản vi phạm','success');}} className="text-purple-500 hover:text-white hover:bg-purple-500 p-1.5 rounded transition shrink-0"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </>
          )}

          {supervisorView === 'TRANSACTIONS' && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h4 className="font-bold text-gray-800">Bảng kiểm soát giao dịch đã xác nhận</h4>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">{monitoredOrders.length} đơn</span>
              </div>
              {monitoredOrders.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center border border-dashed border-gray-300 rounded-lg">Chưa có đơn hàng nào được xác nhận gần đây</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-700">Mã HĐ</th>
                        <th className="px-4 py-3 font-bold text-gray-700">Tên Sản phẩm &amp; Số lượng</th>
                        <th className="px-4 py-3 font-bold text-gray-700">Cửa hàng bán</th>
                        <th className="px-4 py-3 font-bold text-gray-700">Khách hàng</th>
                        <th className="px-4 py-3 font-bold text-gray-700">Thời gian xác nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoredOrders.map((order: any) => (
                        <tr key={order?.id} className="border-b border-gray-100 even:bg-gray-50 hover:bg-indigo-50/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-gray-700">{String(order?.id || 'N/A').slice(0, 8)}</td>
                          <td className="px-4 py-3 text-gray-700">{order?.itemsSummary}</td>
                          <td className="px-4 py-3 text-gray-700">{order?.storeName}</td>
                          <td className="px-4 py-3 text-gray-700">{order?.customerLabel}</td>
                          <td className="px-4 py-3 text-gray-700">{order?.confirmedTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminStoragePanel = ({ logs, writeLog }: any) => {
  const [storageData, setStorageData] = useState<any[]>(() => safeGet('bme_storage', []));
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    const int = setInterval(() => setStorageData(safeGet('bme_storage', [])), 3000);
    return () => clearInterval(int);
  }, []);

  const handleCleanup = () => {
    setIsCleaning(true);
    showToast('Đang quét và dọn dẹp các tệp mồ côi...', 'info');
    setTimeout(() => {
      setIsCleaning(false);
      showToast('Đã giải phóng dung lượng rác thành công!', 'success');
      writeLog('Thực thi dọn rác hệ thống Storage');
    }, 1500);
  };

  const handleConfigCDN = () => {
    showToast('Đã áp dụng quy tắc điều phối CDN cho thư mục Images.', 'success');
    writeLog('Cấu hình điều phối băng thông CDN Storage');
  };

  const getStats = (pathMatch: string) => {
    const files = storageData.filter(f => f.path?.includes(pathMatch));
    const count = files.length;
    const sizeBytes = files.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    return { count, sizeMB };
  };

  const imgStats = getStats('/images/');
  const pdfStats = getStats('/pdf/');
  const docStats = getStats('/docs/');
  const totalSizeMB = (Number(imgStats.sizeMB) + Number(pdfStats.sizeMB) + Number(docStats.sizeMB)).toFixed(2);

  return (
    <div className="bg-white p-6 rounded shadow border-t-4 border-emerald-500 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Database size={24} className="text-emerald-500" /> HỆ THỐNG QUẢN LÝ DUNG LƯỢNG BỘ NHỚ LƯU TRỮ (OBJECT STORAGE)</h4>
          <p className="text-sm text-gray-500 mt-1 font-medium">Giám sát tài nguyên tĩnh, file đính kèm và tài liệu người dùng tải lên LocalStorage mô phỏng cấu trúc thư mục.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleConfigCDN} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition flex items-center gap-2"><Server size={16}/> Cấu hình CDN</button>
          <button onClick={handleCleanup} disabled={isCleaning} className={`border px-5 py-2.5 rounded-lg font-bold text-sm transition flex items-center gap-2 ${isCleaning ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}><Trash2 size={16}/> Dọn rác bộ nhớ</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
          <p className="text-emerald-800 font-bold mb-1 uppercase text-xs tracking-wider">Tổng dung lượng</p>
          <p className="text-4xl font-black text-emerald-600">{totalSizeMB} MB</p>
          <p className="text-sm font-bold text-emerald-600 mt-2 bg-emerald-100 px-3 py-1 rounded-full">Tổng số tệp: {storageData.length}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col items-center justify-center shadow-sm">
          <ImageIcon size={40} className="text-blue-500 mb-3 opacity-80" />
          <p className="font-bold text-gray-800 bg-white px-3 py-1 rounded shadow-sm text-sm mb-2">/storage/images/</p>
          <p className="text-sm font-bold text-blue-600">{imgStats.count} tệp • {imgStats.sizeMB} MB</p>
        </div>
        <div className="bg-red-50 p-5 rounded-xl border border-red-100 flex flex-col items-center justify-center shadow-sm">
          <FileText size={40} className="text-red-500 mb-3 opacity-80" />
          <p className="font-bold text-gray-800 bg-white px-3 py-1 rounded shadow-sm text-sm mb-2">/documents/pdf/</p>
          <p className="text-sm font-bold text-red-600">{pdfStats.count} tệp • {pdfStats.sizeMB} MB</p>
        </div>
        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 flex flex-col items-center justify-center shadow-sm">
          <FileText size={40} className="text-indigo-500 mb-3 opacity-80" />
          <p className="font-bold text-gray-800 bg-white px-3 py-1 rounded shadow-sm text-sm mb-2">/documents/docs/</p>
          <p className="text-sm font-bold text-indigo-600">{docStats.count} tệp • {docStats.sizeMB} MB</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 font-bold text-sm text-gray-700 flex items-center gap-2"><Database size={16}/> Chi tiết tệp tin trong Object Storage</div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 font-bold text-gray-600 border-b border-gray-100">ID / File Name</th>
                <th className="p-4 font-bold text-gray-600 border-b border-gray-100">Phân vùng (Path)</th>
                <th className="p-4 font-bold text-gray-600 border-b border-gray-100">Định dạng</th>
                <th className="p-4 font-bold text-gray-600 border-b border-gray-100">Kích thước</th>
                <th className="p-4 font-bold text-gray-600 border-b border-gray-100">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {storageData.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic font-medium">Storage đang trống.</td></tr>}
              {storageData.map(f => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition group">
                  <td className="p-4 max-w-[250px] truncate" title={f.name}>
                    <span className="font-bold text-bme-primary">{f.id}</span><br/>
                    <span className="text-gray-500 text-xs font-medium">{f.name}</span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600 bg-gray-50">{f.path}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded text-xs font-bold ${f.typeLabel === 'PDF' ? 'bg-red-100 text-red-700' : f.typeLabel === 'Image' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>{f.typeLabel}</span></td>
                  <td className="p-4 text-gray-600 font-semibold">{(f.size / 1024).toFixed(1)} KB</td>
                  <td className="p-4">
                    <button onClick={() => {
                      const next = storageData.filter(item => item.id !== f.id);
                      setStorageData(next); safeSet('bme_storage', next);
                      showToast('Đã xóa tệp vĩnh viễn khỏi Storage', 'info');
                    }} className="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded text-xs font-bold transition opacity-0 group-hover:opacity-100">Xóa file</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ------------------ Chat Center (MỚI) ------------------
export const ChatCenter = ({ currentUser, initialTarget = null }: { currentUser: any, initialTarget?: any }) => {
  const [messages, setMessages] = useState<any[]>(() => safeGet('bme_messages', []));
  const [users, setUsers] = useState<any[]>(() => safeGet('bme_users', []));
  const [activeChat, setActiveChat] = useState<any>(initialTarget);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTarget) setActiveChat(initialTarget);
  }, [initialTarget]);

  useEffect(() => {
    const fetch = () => {
      const msgs = safeGet('bme_messages', []);
      const allUsers = safeGet('bme_users', []);
      setMessages(msgs);
      setUsers(allUsers);

      // Đánh dấu đã đọc (Mark as Read)
      if (activeChat && currentUser) {
        let updated = false;
        const nextMsgs = msgs.map((m: any) => {
          if (m.receiverPhone === currentUser.phone && m.senderPhone === activeChat.phone && !m.isRead) {
            updated = true;
            return { ...m, isRead: true };
          }
          return m;
        });
        if (updated) {
          safeSet('bme_messages', nextMsgs);
          setMessages(nextMsgs);
        }
      }
    };
    fetch();
    const int = setInterval(fetch, 2000);
    return () => clearInterval(int);
  }, [activeChat, currentUser]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeChat || !currentUser) return;
    const msg = {
      messageId: `msg_${Date.now()}`,
      senderPhone: currentUser.phone,
      receiverPhone: activeChat.phone,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    safeSet('bme_messages', nextMsgs);
    setNewMessage('');
  };

  if (!currentUser) return <div className="p-8 text-center text-gray-500 font-medium">Vui lòng đăng nhập để xem tin nhắn.</div>;

  // Phân tích và tạo Danh sách cuộc trò chuyện (Chat List)
  const chatPartnersMap = new Map();
  
  messages.forEach(m => {
    if (m.senderPhone === currentUser.phone) chatPartnersMap.set(m.receiverPhone, m);
    else if (m.receiverPhone === currentUser.phone) chatPartnersMap.set(m.senderPhone, m);
  });

  // Nhúng luôn target hiện tại vào danh sách nếu chưa có tin nhắn
  if (activeChat && !chatPartnersMap.has(activeChat.phone)) chatPartnersMap.set(activeChat.phone, null);

  const chatList = Array.from(chatPartnersMap.keys()).map(phone => {
    const u = users.find(user => user.phone === phone);
    const lastMsg = chatPartnersMap.get(phone);
    const unreadCount = messages.filter(m => m.senderPhone === phone && m.receiverPhone === currentUser.phone && !m.isRead).length;
    return { user: u, lastMsg, unreadCount };
  }).filter(item => item.user);

  // Sắp xếp các cuộc chat có tin nhắn mới nhất lên đầu
  chatList.sort((a, b) => {
    if (!a.lastMsg) return -1;
    if (!b.lastMsg) return 1;
    return b.lastMsg.messageId.localeCompare(a.lastMsg.messageId);
  });

  const currentThread = messages.filter(m => 
    (m.senderPhone === currentUser.phone && m.receiverPhone === activeChat?.phone) ||
    (m.senderPhone === activeChat?.phone && m.receiverPhone === currentUser.phone)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* LEFT COLUMN: DANH SÁCH CUỘC TRÒ CHUYỆN */}
      <div className={`md:col-span-4 border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-lg text-bme-primary flex items-center gap-2"><MessageSquare size={20} /> Tin nhắn</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatList.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">Chưa có cuộc trò chuyện nào.</p>}
          {chatList.map((item, idx) => (
            <div key={idx} onClick={() => setActiveChat(item.user)} className={`flex items-center gap-3 p-4 border-b cursor-pointer transition ${activeChat?.phone === item.user.phone ? 'bg-blue-50 border-l-4 border-l-bme-primary' : 'hover:bg-gray-50'}`}>
              <Avatar src={item.user.avatar} name={item.user.name} size={48} userId={item.user.id} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-bold text-gray-800 truncate pr-2">{item.user.name}</p>
                  {item.lastMsg && <span className="text-[10px] text-gray-400 whitespace-nowrap">{item.lastMsg.timestamp}</span>}
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm truncate pr-2 ${item.unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{item.lastMsg ? (item.lastMsg.senderPhone === currentUser.phone ? `Bạn: ${item.lastMsg.content}` : item.lastMsg.content) : 'Bắt đầu trò chuyện...'}</p>
                  {item.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.unreadCount}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: KHUNG CHAT CHI TIẾT */}
      <div className={`md:col-span-8 flex flex-col bg-gray-50/30 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Hãy chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
          </div>
        ) : (
          <>
            {/* Header Chat */}
            <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-500 hover:text-bme-primary"><X size={24} /></button>
                <Avatar src={activeChat.avatar} name={activeChat.name} size={40} userId={activeChat.id} />
                <div><p className="font-bold text-gray-800">{activeChat.name}</p><p className="text-xs text-gray-500">{activeChat.role}</p></div>
              </div>
              <button onClick={() => document.dispatchEvent(new CustomEvent('viewProfile', {detail: activeChat.id}))} className="text-sm font-semibold text-bme-primary hover:underline">Xem hồ sơ</button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {currentThread.length === 0 && <p className="text-center text-gray-400 text-sm mt-4">Chưa có tin nhắn nào. Gửi lời chào ngay!</p>}
              {currentThread.map(m => {
                const isMine = m.senderPhone === currentUser.phone;
                return (
                  <div key={m.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] lg:max-w-[60%] p-3 rounded-2xl ${isMine ? 'bg-bme-primary text-white rounded-br-sm shadow-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[10px] mt-1.5 ${isMine ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>{m.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2 bg-gray-100 p-1.5 rounded-full border border-gray-200 focus-within:border-bme-primary focus-within:ring-1 focus-within:ring-blue-100 transition">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Nhập tin nhắn..." className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-gray-800" />
                <button onClick={handleSend} disabled={!newMessage.trim()} className={`p-2.5 rounded-full flex items-center justify-center transition ${newMessage.trim() ? 'bg-bme-primary text-white shadow hover:bg-bme-secondary' : 'bg-gray-200 text-gray-400'}`}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ------------------ Services Marketplace (MỚI) ------------------
export const ServicesMarketplace = ({ currentUser }: { currentUser: any }) => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [requestText, setRequestText] = useState('');
  const [machineType, setMachineType] = useState('Máy X-Quang');
  const [address, setAddress] = useState('');
  const [emergencyCases, setEmergencyCases] = useState<any[]>(() => safeGet('bme_emergency_repairs', []));
  const [showEngineerReport, setShowEngineerReport] = useState(false);
  const [services, setServices] = useState<any[]>(() => safeGet('bme_engineer_services', []));
  const [engineerServices, setEngineerServices] = useState<any[]>(() => safeGet('engineerServices', safeGet('bme_engineer_services', [])));
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', machineTypes: 'Máy X-Quang', warranty: '3 tháng' });
  const [engineerProfile, setEngineerProfile] = useState({ engineerName: '', specialties: '', yearsExperience: '', supportArea: '', servicePrice: '', availability: 'Sẵn sàng cứu hộ' });

  const normalizedRole = String(currentUser?.role || '').toLowerCase();
  const rawBusinessType = String(currentUser?.businessType || '').toLowerCase();
  const normalizedBusinessType = rawBusinessType === 'technician' ? 'engineer' : rawBusinessType;
  const isStrictEngineer = String(currentUser?.role || '').toUpperCase() === 'BUSINESS' && (String(currentUser?.businessType || '').toUpperCase() === 'ENGINEER' || String(currentUser?.businessType || '').toUpperCase() === 'TECHNICIAN');
  const isEngineerBusiness = isStrictEngineer || (normalizedRole === 'business' && (normalizedBusinessType === 'engineer' || rawBusinessType === 'technician'));
  const engineerId = currentUser?.id;
  
  useEffect(() => {
    const syncData = () => {
      const users = safeGet('bme_users', []);
      const listUsers = Array.isArray(users) ? users : [];
      setTechnicians(listUsers.filter((u: any) => ((String(u?.businessType || '').toLowerCase() === 'engineer' || String(u?.businessType || '').toLowerCase() === 'technician') || u?.role === 'coordinator') && u?.status === 'active'));

      const rescueCases = safeGet('bme_emergency_repairs', []);
      setEmergencyCases(Array.isArray(rescueCases) ? rescueCases : []);

      const engineerServices = safeGet('bme_engineer_services', []);
      setServices(Array.isArray(engineerServices) ? engineerServices : []);

      const publicEngineerServices = safeGet('engineerServices', safeGet('bme_engineer_services', []));
      setEngineerServices(Array.isArray(publicEngineerServices) ? publicEngineerServices : []);
    };
    syncData();
    const interval = setInterval(syncData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser?.phone) return;
    const mine = engineerServices.find((item: any) => item?.engineerPhone === currentUser?.phone);
    if (mine) {
      const specialtiesText = Array.isArray(mine?.specialties) ? mine.specialties.join(', ') : String(mine?.specialties || '');
      setEngineerProfile({
        engineerName: String(mine?.engineerName || currentUser?.name || ''),
        specialties: specialtiesText,
        yearsExperience: String(mine?.yearsExperience || ''),
        supportArea: String(mine?.supportArea || ''),
        servicePrice: String(mine?.servicePrice || ''),
        availability: String(mine?.availability || 'Sẵn sàng cứu hộ')
      });
    } else {
      setEngineerProfile({
        engineerName: String(currentUser?.name || ''),
        specialties: '',
        yearsExperience: '',
        supportArea: '',
        servicePrice: '',
        availability: 'Sẵn sàng cứu hộ'
      });
    }
  }, [currentUser?.phone, currentUser?.name, engineerServices]);

  const handleCreateRequest = () => {
    if (!currentUser) return showToast('Vui lòng đăng nhập để tạo yêu cầu', 'error');
    if (!requestText.trim()) return showToast('Vui lòng nhập mô tả lỗi', 'error');
    if (!address.trim()) return showToast('Vui lòng nhập địa chỉ để kỹ sư hỗ trợ', 'error');

    const newPost = {
      id: `p_${Date.now()}`,
      authorId: currentUser.id,
      author: currentUser.name,
      avatar: currentUser.avatar,
      category: 'Cần sửa chữa',
      content: `[Cần sửa: ${machineType}]\n📍 Địa chỉ: ${address}\n\nChi tiết lỗi: ${requestText}`,
      time: new Date().toLocaleString(),
      likes: 0,
      comments: 0,
      replies: [],
      status: 'active'
    };

    const allPosts = safeGet('bme_posts', []);
    const nextPosts = [newPost, ...allPosts];
    safeSet('bme_posts', nextPosts);
    setRequestText('');
    setAddress('');
    showToast('Đã đăng yêu cầu sửa chữa thành công! Các kỹ sư sẽ liên hệ với bạn.', 'success');
  };

  const handleEmergencyRescue = () => {
    if (!currentUser?.phone) return showToast('Vui lòng đăng nhập để gửi yêu cầu khẩn cấp', 'error');
    if (!requestText.trim()) return showToast('Vui lòng nhập mô tả lỗi máy', 'error');
    if (!address.trim()) return showToast('Vui lòng nhập vị trí cần cứu hộ', 'error');

    const allCases = safeGet('bme_emergency_repairs', []);
    const rescueCases = Array.isArray(allCases) ? allCases : [];
    const newCase = {
      id: `rescue_${Date.now()}`,
      requesterId: currentUser?.id,
      requesterName: currentUser?.name || 'Người dùng',
      requesterPhone: currentUser?.phone,
      machineType,
      location: address,
      errorDetail: requestText,
      status: 'PENDING',
      acceptedById: null,
      acceptedByName: null,
      createdAt: new Date().toLocaleString(),
      acceptedAt: null
    };
    const nextCases = [newCase, ...rescueCases];
    safeSet('bme_emergency_repairs', nextCases);
    setEmergencyCases(nextCases);
    showToast('🚨 Đã gửi yêu cầu cứu hộ máy khẩn cấp tới không gian kỹ sư', 'success');
  };

  const handleAddService = () => {
    if (!isEngineerBusiness || !currentUser?.id) return showToast('Chỉ kỹ sư sửa chữa mới được đăng dịch vụ', 'error');
    if (!newService.name.trim() || !newService.price) return showToast('Vui lòng nhập tên và giá dịch vụ', 'error');
    
    const service = {
      id: `service_${Date.now()}`,
      engineerId: currentUser.id,
      engineerName: currentUser.name,
      engineerPhone: currentUser.phone,
      name: newService.name.trim(),
      description: newService.description.trim(),
      price: Number(newService.price),
      machineTypes: newService.machineTypes,
      warranty: newService.warranty,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toLocaleString()
    };
    
    const nextServices = [service, ...services];
    setServices(nextServices);
    safeSet('bme_engineer_services', nextServices);
    setNewService({ name: '', description: '', price: '', machineTypes: 'Máy X-Quang', warranty: '3 tháng' });
    setShowAddServiceForm(false);
    showToast('Đã thêm dịch vụ sửa chữa thành công!', 'success');
  };

  const handleDeleteService = (serviceId: string) => {
    if (!window.confirm('Xóa dịch vụ này?')) return;
    const nextServices = services.filter((s: any) => s.id !== serviceId);
    setServices(nextServices);
    safeSet('bme_engineer_services', nextServices);
    showToast('Đã xóa dịch vụ', 'info');
  };

  const handleUpdateEngineerService = () => {
    if (!isEngineerBusiness) {
      showToast('Chỉ BUSINESS ENGINEER mới sở hữu mục Quản lý dịch vụ kỹ sư', 'error');
      return;
    }
    if (!currentUser?.phone) {
      showToast('Thiếu thông tin định danh kỹ sư', 'error');
      return;
    }
    if (!engineerProfile.engineerName.trim() || !engineerProfile.specialties.trim() || !engineerProfile.yearsExperience || !engineerProfile.supportArea.trim() || !engineerProfile.servicePrice) {
      showToast('Vui lòng nhập đầy đủ hồ sơ dịch vụ kỹ sư', 'error');
      return;
    }
    const specialties = engineerProfile.specialties.split(',').map((item) => item.trim()).filter((item) => !!item);
    const profileData = {
      id: `eng_profile_${currentUser?.phone}`,
      engineerPhone: currentUser?.phone,
      engineerId: currentUser?.id,
      engineerName: engineerProfile.engineerName.trim(),
      specialties,
      yearsExperience: Number(engineerProfile.yearsExperience),
      supportArea: engineerProfile.supportArea.trim(),
      servicePrice: Number(engineerProfile.servicePrice),
      availability: engineerProfile.availability,
      updatedAt: new Date().toLocaleString()
    };
    const nextProfiles = engineerServices.filter((item: any) => item?.engineerPhone !== currentUser?.phone);
    nextProfiles.unshift(profileData);
    setEngineerServices(nextProfiles);
    safeSet('engineerServices', nextProfiles);
    safeSet('bme_engineer_services', nextProfiles);
    showToast('Đã cập nhật dịch vụ kỹ sư vào Không gian Dịch vụ công khai', 'success');
  };

  const handleAcceptEmergencyCase = (caseId: string) => {
    if (!isEngineerBusiness || !engineerId) {
      showToast('Chỉ kỹ sư Business mới được tiếp nhận ca khẩn cấp', 'error');
      return;
    }
    const nextCases = emergencyCases.map((item: any) => {
      if (item?.id !== caseId || item?.status !== 'PENDING') return item;
      return {
        ...item,
        status: 'ACCEPTED',
        acceptedById: engineerId,
        acceptedByName: currentUser?.name || 'Kỹ sư',
        acceptedAt: new Date().toLocaleString()
      };
    });
    setEmergencyCases(nextCases);
    safeSet('bme_emergency_repairs', nextCases);
    showToast('Đã tiếp nhận ca bệnh máy. Vui lòng liên hệ ngay khách hàng!', 'success');
  };

  const handleOpenRealtimeChat = (target: any) => {
    if (!currentUser?.phone) {
      showToast('Vui lòng đăng nhập để nhắn tin trao đổi', 'error');
      return;
    }
    if (!target?.phone) {
      showToast('Không tìm thấy thông tin liên hệ để mở chat', 'error');
      return;
    }
    if (target?.phone === currentUser?.phone) {
      showToast('Bạn đang xem hồ sơ của chính mình', 'info');
      return;
    }
    document.dispatchEvent(new CustomEvent('openChat', { detail: target }));
  };

  const pendingEmergencyCases = emergencyCases.filter((item: any) => item?.status === 'PENDING');
  const myAcceptedCases = emergencyCases.filter((item: any) => item?.acceptedById === engineerId);
  const monthCases = myAcceptedCases.filter((item: any) => {
    const t = new Date(item?.acceptedAt || item?.createdAt || Date.now());
    const n = new Date();
    return t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear();
  });
  const estimatedRevenue = monthCases.length * 500000;
  const machineIssueCounter: Record<string, number> = {};
  emergencyCases.forEach((item: any) => {
    const machine = item?.machineType || 'Khác';
    machineIssueCounter[machine] = (machineIssueCounter[machine] || 0) + 1;
  });
  const topIssueMachine = Object.keys(machineIssueCounter).sort((a, b) => machineIssueCounter[b] - machineIssueCounter[a])[0] || 'Chưa có';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Wrench size={24} className="text-orange-500" /> Đặt lịch sửa chữa</h2>
          <p className="text-sm text-gray-600 mb-4">Mô tả tình trạng lỗi của thiết bị để các kỹ sư chuyên môn báo giá và hỗ trợ bạn nhanh nhất.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại thiết bị</label>
              <select value={machineType} onChange={e=>setMachineType(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary text-sm bg-gray-50">
                <option value="Máy X-Quang">Máy X-Quang</option>
                <option value="Máy Siêu Âm">Máy Siêu Âm</option>
                <option value="Máy Thở">Máy Thở</option>
                <option value="Máy Xét Nghiệm">Máy Xét Nghiệm</option>
                <option value="Thiết bị Nha khoa">Thiết bị Nha khoa</option>
                <option value="Khác">Thiết bị y tế khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ của bạn</label>
              <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Nhập bệnh viện / phòng khám..." className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết lỗi</label>
              <textarea value={requestText} onChange={e=>setRequestText(e.target.value)} rows={4} placeholder="Máy báo lỗi gì? Tình trạng hiện tại ra sao..." className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary text-sm resize-none" />
            </div>
            <button onClick={handleCreateRequest} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center items-center gap-2"><Send size={18}/> Đăng yêu cầu lên Bảng tin</button>
            <button onClick={handleEmergencyRescue} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center items-center gap-2 animate-pulse">🚨 YÊU CẦU CỨU HỘ MÁY KHẨN CẤP</button>

            {isEngineerBusiness && (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-black text-blue-800">Quản lý dịch vụ kỹ sư (chỉ BUSINESS ENGINEER)</p>
                  <input value={engineerProfile.engineerName} onChange={e => setEngineerProfile({ ...engineerProfile, engineerName: e.target.value })} placeholder="Tên kỹ sư" className="w-full p-2 border rounded text-sm" />
                  <input value={engineerProfile.specialties} onChange={e => setEngineerProfile({ ...engineerProfile, specialties: e.target.value })} placeholder="Mảng chuyên môn (VD: Máy siêu âm, Máy X-Quang...)" className="w-full p-2 border rounded text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={engineerProfile.yearsExperience} onChange={e => setEngineerProfile({ ...engineerProfile, yearsExperience: e.target.value })} placeholder="Số năm kinh nghiệm" className="p-2 border rounded text-sm" />
                    <input type="number" value={engineerProfile.servicePrice} onChange={e => setEngineerProfile({ ...engineerProfile, servicePrice: e.target.value })} placeholder="Giá dịch vụ dự kiến" className="p-2 border rounded text-sm" />
                  </div>
                  <input value={engineerProfile.supportArea} onChange={e => setEngineerProfile({ ...engineerProfile, supportArea: e.target.value })} placeholder="Khu vực hỗ trợ" className="w-full p-2 border rounded text-sm" />
                  <select value={engineerProfile.availability} onChange={e => setEngineerProfile({ ...engineerProfile, availability: e.target.value })} className="w-full p-2 border rounded text-sm">
                    <option value="Sẵn sàng cứu hộ">Sẵn sàng cứu hộ</option>
                    <option value="Bận">Bận</option>
                  </select>
                  <button onClick={handleUpdateEngineerService} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm">Cập nhật dịch vụ</button>
                </div>
                <button onClick={() => setShowAddServiceForm(!showAddServiceForm)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition">Thêm dịch vụ sửa chữa</button>
                {showAddServiceForm && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg space-y-2">
                    <input type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder="Tên dịch vụ (VD: Bảo dưỡng định kỳ)" className="w-full p-2 border rounded text-sm" />
                    <textarea value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} placeholder="Mô tả dịch vụ..." rows={2} className="w-full p-2 border rounded text-sm resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} placeholder="Giá (VND)" className="p-2 border rounded text-sm" />
                      <select value={newService.machineTypes} onChange={e => setNewService({...newService, machineTypes: e.target.value})} className="p-2 border rounded text-sm">
                        <option value="Máy X-Quang">Máy X-Quang</option>
                        <option value="Máy Siêu Âm">Máy Siêu Âm</option>
                        <option value="Máy Thở">Máy Thở</option>
                        <option value="Máy Xét Nghiệm">Máy Xét Nghiệm</option>
                        <option value="Đa dạng">Đa loại thiết bị</option>
                      </select>
                    </div>
                    <select value={newService.warranty} onChange={e => setNewService({...newService, warranty: e.target.value})} className="w-full p-2 border rounded text-sm">
                      <option value="1 tháng">Bảo hành 1 tháng</option>
                      <option value="3 tháng">Bảo hành 3 tháng</option>
                      <option value="6 tháng">Bảo hành 6 tháng</option>
                      <option value="1 năm">Bảo hành 1 năm</option>
                    </select>
                    <button onClick={handleAddService} className="w-full bg-green-600 text-white font-bold py-2 rounded text-sm">Lưu dịch vụ</button>
                  </div>
                )}
                <button onClick={() => setShowEngineerReport(!showEngineerReport)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition">Xuất báo cáo thông minh</button>
                {showEngineerReport && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                      <p className="text-xs text-indigo-700 font-bold uppercase">Doanh thu ca sửa tháng này (ước tính)</p>
                      <p className="text-xl font-black text-indigo-700 mt-1">{estimatedRevenue.toLocaleString()}đ</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-xs text-amber-700 font-bold uppercase">Loại máy hay hỏng nhất</p>
                      <p className="text-sm font-bold text-amber-800 mt-1">{topIssueMachine} ({machineIssueCounter[topIssueMachine] || 0} ca)</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-xs text-emerald-700 font-bold uppercase">Ca đã tiếp nhận</p>
                      <p className="text-lg font-black text-emerald-700 mt-1">{myAcceptedCases.length} ca</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isEngineerBusiness && (
              <div className="pt-3 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm font-bold text-yellow-800">Truy cập bị từ chối: mục Quản lý dịch vụ kỹ sư chỉ dành cho BUSINESS ENGINEER.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className={`mb-4 p-4 rounded-xl border ${isEngineerBusiness && pendingEmergencyCases.length > 0 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold text-gray-800">Không gian kỹ sư cứu hộ máy khẩn cấp</h3>
          <p className="text-sm text-gray-600 mt-1">Các ca khẩn cấp mới sẽ nhấp nháy đỏ để kỹ sư gần nhất tiếp nhận nhanh.</p>
          <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
            {emergencyCases.length === 0 && <p className="text-sm text-gray-500">Chưa có ca cứu hộ nào.</p>}
            {emergencyCases.map((item: any) => (
              <div key={item?.id} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{item?.machineType} • {item?.location}</p>
                  <p className="text-xs text-gray-600 mt-1">Lỗi: {item?.errorDetail}</p>
                  <p className="text-xs text-gray-500 mt-1">Khởi tạo: {item?.createdAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${item?.status === 'PENDING' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item?.status}</span>
                  {isEngineerBusiness && item?.status === 'PENDING' && (
                    <button onClick={() => handleAcceptEmergencyCase(item?.id)} className="text-xs font-bold px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white">TIẾP NHẬN CA BỆNH MÁY</button>
                  )}
                  {item?.status === 'ACCEPTED' && (
                    <span className="text-xs text-gray-600 font-semibold">Kỹ sư: {item?.acceptedByName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Không gian Dịch vụ công khai</h2>
        {engineerServices.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500 mb-6">Chưa có hồ sơ kỹ sư nào được công bố.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {engineerServices.map((svc: any) => (
              <div key={svc.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-bme-primary transition">
                <div className="flex justify-between items-start gap-3">
                  <h4 className="font-bold text-gray-800">{svc?.engineerName || 'Kỹ sư'}</h4>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${svc?.availability === 'Sẵn sàng cứu hộ' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{svc?.availability || 'Đang cập nhật'}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Chuyên môn: {Array.isArray(svc?.specialties) ? svc.specialties.join(', ') : String(svc?.specialties || 'Chưa cập nhật')}</p>
                <p className="text-sm text-gray-600 mt-1">Kinh nghiệm: {Number(svc?.yearsExperience || 0)} năm</p>
                <p className="text-sm text-gray-600 mt-1">Khu vực hỗ trợ: {svc?.supportArea || 'Chưa cập nhật'}</p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> {svc?.supportArea || 'Chưa cập nhật khu vực hoạt động'}</p>
                <p className="text-sm mt-2 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><span className="text-green-600 font-bold">Đang hoạt động</span></p>
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                  <p className="font-black text-bme-accent">{Number(svc?.servicePrice || 0).toLocaleString()}đ</p>
                  <button onClick={() => handleOpenRealtimeChat({ id: svc?.engineerId, name: svc?.engineerName, phone: svc?.engineerPhone, role: 'business', businessType: 'engineer' })} className="text-xs font-bold px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1"><MessageCircle size={14}/> Nhắn tin trao đổi</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Dịch vụ sửa chữa có sẵn</h2>
        {services.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500">Chưa có dịch vụ nào được đăng. Các kỹ sư sẽ cập nhật dịch vụ sớm.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {services.map((svc: any) => (
              <div key={svc.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-bme-primary transition">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 flex-1">{svc.name}</h4>
                  {isEngineerBusiness && svc.engineerId === currentUser?.id && (
                    <button onClick={() => handleDeleteService(svc.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{svc.description}</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{svc.machineTypes}</span>
                  <span className="text-xs text-gray-500">{svc.warranty}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <p className="text-bme-accent font-bold">{svc.price.toLocaleString()}đ</p>
                  <button onClick={() => handleOpenRealtimeChat({ id: svc?.engineerId, name: svc?.engineerName, phone: svc?.engineerPhone, role: 'business', businessType: 'engineer' })} className="text-xs font-bold px-3 py-1.5 rounded bg-blue-50 text-bme-primary hover:bg-bme-primary hover:text-white transition">Liên hệ</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <h2 className="text-xl font-bold text-gray-800 mb-4">Danh sách Kỹ sư / Chuyên gia Nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicians.length === 0 ? <p className="text-gray-500 italic p-6 bg-white rounded-xl border border-gray-200 col-span-2 text-center">Chưa có kỹ sư nào hoạt động trên hệ thống.</p> : 
            technicians.map((t: any) => (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-bme-primary transition flex flex-col group">
                <div className="flex items-start gap-4 mb-3 cursor-pointer" onClick={() => document.dispatchEvent(new CustomEvent('viewProfile', {detail: t.id}))}>
                  <Avatar src={t.avatar} name={t.name} size={56} userId={t.id} />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 group-hover:text-bme-primary transition text-lg leading-tight">{t.name}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${t.role === 'coordinator' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{t.role === 'coordinator' ? 'Chuyên gia' : 'Kỹ sư sửa chữa'}</span>
                    <p className="text-xs mt-2 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><span className="text-green-600 font-bold">Đang hoạt động</span></p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-4 flex-1">
                  <p className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> {t.location || 'Đang cập nhật'}</p>
                  <p className="flex items-center gap-1.5"><Star size={14} className="text-yellow-500 fill-yellow-500"/> Xem đánh giá tại hồ sơ</p>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => document.dispatchEvent(new CustomEvent('viewProfile', {detail: t.id}))} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-lg border border-gray-200 transition">Xem hồ sơ</button>
                  {currentUser?.id !== t.id && (
                    <button onClick={() => handleOpenRealtimeChat({ id: t?.id, name: t?.name, phone: t?.phone, role: t?.role, businessType: t?.businessType })} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-1"><MessageCircle size={14}/> Nhắn tin trao đổi</button>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ------------------ User Settings (MỚI) ------------------
export const UserSettings = ({ currentUser }: { currentUser: any }) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateName = () => {
    if (!name.trim()) return showToast('Tên không được để trống', 'error');
    const users = safeGet('bme_users', []);
    const nextUsers = users.map((u: any) => u.id === currentUser.id ? { ...u, name: name.trim() } : u);
    safeSet('bme_users', nextUsers);
    
    const nextUser = nextUsers.find((u: any) => u.id === currentUser.id);
    safeSet('bme_current_user', nextUser);
    window.dispatchEvent(new CustomEvent('bme-profile-updated', { detail: nextUser }));
    showToast('Đã cập nhật tên thành công', 'success');
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return showToast('Vui lòng điền đầy đủ thông tin mật khẩu', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showToast('Mật khẩu mới không khớp', 'error');
    }
    const users = safeGet('bme_users', []);
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
    if (userIndex === -1) return showToast('Lỗi xác thực', 'error');
    
    if (users[userIndex].password !== oldPassword) {
      return showToast('Mật khẩu cũ không chính xác', 'error');
    }
    
    users[userIndex].password = newPassword;
    safeSet('bme_users', users);
    
    const nextUser = users[userIndex];
    safeSet('bme_current_user', nextUser);
    window.dispatchEvent(new CustomEvent('bme-profile-updated', { detail: nextUser }));
    
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Đổi mật khẩu thành công', 'success');
  };

  if (!currentUser) return <div className="text-center p-10 text-gray-500">Vui lòng đăng nhập để xem cài đặt.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><User size={20} className="text-bme-primary" /> Thông tin cá nhân</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại (Tài khoản)</label>
            <input value={currentUser.phone} disabled className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-medium" />
            <p className="text-xs text-gray-500 mt-1">Số điện thoại không thể thay đổi.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" placeholder="Nhập họ và tên..." />
          </div>
          <button onClick={handleUpdateName} className="bg-bme-primary hover:bg-bme-secondary text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition">Lưu thay đổi tên</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><Lock size={20} className="text-orange-500" /> Đổi mật khẩu bảo mật</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" placeholder="Nhập mật khẩu hiện tại" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" placeholder="Nhập mật khẩu mới" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary" placeholder="Nhập lại mật khẩu mới" />
          </div>
          <button onClick={handleChangePassword} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition">Xác nhận đổi mật khẩu</button>
        </div>
      </div>
    </div>
  );
};
export default {};
