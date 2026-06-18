'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Mic, Camera, LayoutGrid, MapPin, Users, Store, Settings, LogOut, Menu, X, Bell, ShoppingCart, Send,
  MessageSquare, Bookmark, ChevronLeft, Folder, FileText, Image as ImageIcon, User as UserIcon
} from 'lucide-react';
import {
  LoginModal, OcrSearchModal, HomeFeed, MapView, StoreProfile, AdminDashboard,
  ToastContainer, UserProfile, ChatCenter, Avatar
} from '@/components/UIComponents';
import { safeGet, safeSet, showToast } from '@/components/UIComponents';

const CommunityFeedCorridor = ({ currentUser, searchQuery }: { currentUser: any, searchQuery: string }) => {
  // 1. STATE QUẢN LÝ ĐIỀU HƯỚNG MÀN HÌNH CHÍNH
  
  // 2. STATE GIAO DIỆN & TÀI KHOẢN
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'user'|'business'|'coordinator'|'supervisor'|'admin'>('user');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // States for Community Corridor
  const [communities, setCommunities] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCommId, setActiveCommId] = useState<string | null>(null);
  
  // States for creating a new community
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  // States for creating a new post
  const [newPostText, setNewPostText] = useState('');
  const [postAttachment, setPostAttachment] = useState<any>(null);
  const [postCategory, setPostCategory] = useState('Chẩn đoán');
  
  // States for filtering and internal tabs
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [commTab, setCommTab] = useState<'feed' | 'storage'>('feed');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const [usersData, setUsersData] = useState<any[]>([]);
  const [expandedComments, setExpandedComments] = useState<any>({});

  useEffect(() => {
    const fetchData = () => {
      setCommunities(safeGet('bme_communities', []));
      setPosts(safeGet('bme_posts', []));
      setUsersData(safeGet('bme_users', []));
    };
    fetchData();
    const int = setInterval(fetchData, 3000);
    return () => clearInterval(int);
  }, []);

  const handleCreateCommunity = () => {
    if (!currentUser) return showToast('Vui lòng đăng nhập để tạo nhóm', 'error');
    if (!newCommName.trim()) return showToast('Vui lòng nhập tên hội nhóm', 'error');
    
    const newComm = { 
      id:`c_${Date.now()}`, 
      name: newCommName, 
      description: newCommDesc, 
      members: [currentUser.phone],
      creatorId: currentUser.id,
      status: 'Approved',
      icon: '👥'
    };
    
    const nextComms = [...(Array.isArray(communities) ? communities : []), newComm];
    setCommunities(nextComms);
    safeSet('bme_communities', nextComms);
    
    setNewCommName('');
    setNewCommDesc('');
    setIsCreateFormVisible(false);
    setActiveCommId(newComm.id);
    showToast('Tạo nhóm thành công!', 'success');
  };

  const handleJoin = (commId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return showToast('Vui lòng đăng nhập để tham gia nhóm', 'error');
    
    const next = communities.map(c => c.id === commId ? { ...c, members: [...(c.members || []), currentUser.phone] } : c);
    setCommunities(next);
    safeSet('bme_communities', next);
    showToast('Tham gia nhóm thành công!', 'success');
  };

  // 3. STATE GIỎ HÀNG, THÔNG BÁO & CHAT
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState<'cart' | 'history'>('cart');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [pendingCommCount, setPendingCommCount] = useState(0);
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '' });

  // Refs phục vụ đóng Dropdown khi click ra ngoài
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // State phục vụ tìm kiếm thông minh
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState({ linhKien: [] as any[], thietBi: [] as any[], files: [] as any[] });

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
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
      if (ev.target?.result) {
        setPostAttachment({
          id: `file_${Date.now()}`, name: file.name, size: file.size, ext, path, typeLabel,
          base64: ev.target.result, timestamp: new Date().toLocaleString()
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const createPost = () => {
    if (!currentUser) return showToast('Vui lòng đăng nhập!', 'error');
    if (!newPostText.trim() && !postAttachment) return showToast('Vui lòng nhập nội dung hoặc đính kèm file', 'error');
    
    const newPost = { 
      id: `p_${Date.now()}`, authorId: currentUser.id, author: currentUser.name, avatar: currentUser.avatar, 
      time: new Date().toLocaleString(), content: newPostText, attachment: postAttachment,
      images: postAttachment?.typeLabel === 'Image' ? [postAttachment.base64] : [], 
      category: postCategory, communityId: activeCommId, likes: 0, comments: 0, replies: [], status: 'active' 
    };
    
    const nextPosts = [newPost, ...(Array.isArray(posts) ? posts : [])]; 
    setPosts(nextPosts); 
    safeSet('bme_posts', nextPosts);
    setNewPostText(''); 
    setPostAttachment(null);
    showToast('Đăng bài thành công!', 'success');
  };

  if (!activeCommId) {
    const visibleComms = Array.isArray(communities) ? communities.filter(c => 
      c.status === 'Approved' && 
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())))
    ) : [];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-bme-primary mb-2 flex items-center gap-2"><Users size={28}/> Cộng đồng Y sinh</h2>
            <p className="text-gray-600">Khám phá, tham gia các cộng đồng chuyên môn để thảo luận và chia sẻ tài liệu kỹ thuật.</p>
          </div>
          <button onClick={() => setIsCreateFormVisible(!isCreateFormVisible)} className="bg-bme-primary hover:bg-bme-secondary text-white font-bold px-6 py-3 rounded-lg shadow-md transition whitespace-nowrap">
            {isCreateFormVisible ? 'Đóng Form' : '[+] Tạo cộng đồng mới'}
          </button>
        </div>

        {isCreateFormVisible && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 animate-fade-in">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Thông tin cộng đồng mới</h3>
            <div className="space-y-3">
              <input value={newCommName} onChange={e=>setNewCommName(e.target.value)} placeholder="Tên nhóm (VD: Hội kỹ sư máy thở)..." className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 outline-none focus:border-bme-primary" />
              <textarea value={newCommDesc} onChange={e=>setNewCommDesc(e.target.value)} placeholder="Mô tả ngắn về chuyên môn của nhóm..." rows={3} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 outline-none focus:border-bme-primary resize-none" />
              <div className="flex justify-end">
                <button onClick={handleCreateCommunity} className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg text-sm font-bold shadow-sm transition">Xác nhận tạo nhóm</button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleComms.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <span className="text-5xl block mb-4 opacity-50">🔍</span>
              <p className="text-gray-500 font-medium">Chưa có cộng đồng nào phù hợp hoặc hệ thống đang trống.</p>
            </div>
          )}
          {visibleComms.map((c: any) => {
            const isMember = c.members && currentUser && Array.isArray(c.members) && c.members.includes(currentUser.phone);
            return (
              <div key={c.id} onClick={() => { setActiveCommId(c.id); setCommTab('feed'); setCurrentFolder(null); }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-bme-primary transition cursor-pointer flex flex-col h-full group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">{c.icon || '👥'}</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{c.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{Array.isArray(c.members) ? c.members.length : 0} thành viên</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">{c.description || 'Chưa có mô tả'}</p>
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  {isMember ? (
                    <div className="w-full text-center py-2 bg-green-50 text-green-700 font-bold rounded-lg text-sm border border-green-200">Đã tham gia</div>
                  ) : (
                    <button onClick={(e) => handleJoin(c.id, e)} className="w-full text-center py-2 bg-bme-primary hover:bg-bme-secondary text-white font-bold rounded-lg text-sm transition shadow-sm">THAM GIA NHÓM</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeComm = Array.isArray(communities) ? communities.find(c => c.id === activeCommId) : null;
  if (!activeComm) {
    return <div className="text-center py-10"><p className="mb-4">Không tìm thấy cộng đồng.</p><button onClick={()=>setActiveCommId(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Quay lại</button></div>;
  }
  
  const isMember = activeComm.members && currentUser && Array.isArray(activeComm.members) && activeComm.members.includes(currentUser.phone);
  
  const commPosts = Array.isArray(posts) ? posts.filter(p => p.communityId === activeCommId && (
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.author.toLowerCase().includes(searchQuery.toLowerCase())
  )).filter(p => filterCategory === 'Tất cả' || p.category === filterCategory) : [];

  const commStorageFiles = commPosts.filter(p => p.attachment).map(p => ({
    ...p.attachment, postId: p.id, uploadedBy: p.author, date: p.time
  }));

  const renderStorageTab = () => {
    if (!currentFolder) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 animate-fade-in">
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
      );
    }

    const folderFiles = commStorageFiles.filter(f => f.path === currentFolder);

    return (
      <div className="animate-fade-in mt-4">
        <button onClick={() => setCurrentFolder(null)} className="mb-4 text-sm font-bold text-gray-500 hover:text-bme-primary flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 transition"><ChevronLeft size={16}/> Quay lại danh mục thư mục</button>
        <div className="grid gap-3">
          {folderFiles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <span className="text-4xl block mb-3 opacity-30">📂</span>
              <p className="text-gray-500 font-medium">Thư mục này hiện chưa có tài liệu nào được đăng tải.</p>
            </div>
          )}
          {folderFiles.map(f => (
            <div key={f.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-bme-primary transition group cursor-pointer">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${f.typeLabel === 'PDF' ? 'bg-red-50 text-red-500' : f.typeLabel === 'Image' ? 'bg-green-50 text-green-500' : 'bg-indigo-50 text-indigo-500'}`}>
                {f.typeLabel === 'Image' ? <ImageIcon size={24} /> : <FileText size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate text-base">{f.name}</p>
                <div className="flex gap-2 mt-1 text-xs font-semibold text-gray-500">
                  <span>Bởi: {f.uploadedBy}</span><span>•</span>
                  <span>{Math.round((f.size || 0)/1024)} KB</span><span>•</span>
                  <span>{f.date}</span>
                </div>
              </div>
              {f.typeLabel === 'Image' && <img src={f.base64} alt="thumb" className="w-12 h-12 object-cover rounded shadow-sm opacity-50 group-hover:opacity-100 transition" />}
              <button className="bg-blue-50 hover:bg-bme-primary hover:text-white text-bme-primary px-4 py-2 rounded-lg text-sm font-bold transition opacity-0 group-hover:opacity-100 ml-2 shadow-sm" onClick={() => {
                const link = document.createElement('a');
                link.href = f.base64;
                link.download = f.name;
                link.click();
              }}>Tải về</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative">
        <button onClick={() => setActiveCommId(null)} className="absolute top-4 right-4 text-sm font-bold text-gray-500 hover:text-bme-primary flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg transition border border-gray-200"><ChevronLeft size={16}/> Quay lại danh sách nhóm</button>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-8 md:mt-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl shrink-0">{activeComm.icon || '👥'}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{activeComm.name}</h2>
              <p className="text-gray-500 mt-1">{Array.isArray(activeComm.members) ? activeComm.members.length : 0} thành viên</p>
            </div>
          </div>
          {isMember ? (
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm border border-green-200">Thành viên chính thức</span>
          ) : (
            <button onClick={(e) => handleJoin(activeComm.id, e)} className="px-6 py-2.5 bg-bme-primary hover:bg-bme-secondary text-white font-bold rounded-lg transition shadow-md whitespace-nowrap">THAM GIA CỘNG ĐỒNG</button>
          )}
        </div>
      </div>

      {!isMember ? (
        <div className="bg-yellow-50 p-8 rounded-xl border-2 border-dashed border-yellow-200 text-center">
          <h3 className="text-xl font-bold text-yellow-800">Đây là cộng đồng riêng tư</h3>
          <p className="text-yellow-700 mt-2 mb-6">Bạn cần tham gia để xem các bài viết thảo luận và kho tài liệu.</p>
          <button onClick={(e) => handleJoin(activeComm.id, e)} className="bg-bme-primary hover:bg-bme-secondary text-white px-8 py-3 rounded-lg font-bold shadow-lg transition animate-pulse">THAM GIA CỘNG ĐỒNG</button>
        </div>
      ) : (
        <>
          <div className="flex gap-4 border-b border-gray-200">
            <button onClick={() => {setCommTab('feed'); setCurrentFolder(null);}} className={`pb-3 font-bold text-sm transition border-b-2 px-2 ${commTab === 'feed' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Bảng tin nhóm</button>
            <button onClick={() => setCommTab('storage')} className={`pb-3 font-bold text-sm transition border-b-2 px-2 flex items-center gap-2 ${commTab === 'storage' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Folder size={16}/> Kho tài liệu</button>
          </div>

          {commTab === 'feed' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <aside className="lg:col-span-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-20">
                  <h4 className="font-bold mb-3 text-gray-800">Danh mục</h4>
                  {['Tất cả', 'Chẩn đoán', 'Hồi sức', 'Linh kiện', 'X-ray'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => setFilterCategory(c)} 
                      className={`w-full text-left py-2 px-3 rounded-lg mb-1 transition font-medium text-sm ${filterCategory === c ? 'bg-bme-primary text-white shadow' : 'hover:bg-blue-50 text-gray-700'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </aside>
              
              <main className="lg:col-span-9 space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex gap-3">
                    <Avatar src={currentUser?.avatar} name={currentUser?.name} size={48} userId={currentUser?.id} />
                    <div className="flex-1">
                      <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-3 outline-none focus:border-bme-primary transition text-sm resize-none" rows={3} placeholder="Bạn muốn chia sẻ gì với cộng đồng này?" />
                      {postAttachment && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center text-sm shadow-sm animate-fade-in">
                          <span className="truncate max-w-[80%] font-semibold text-bme-primary flex items-center gap-2">{postAttachment.typeLabel === 'Image' ? <ImageIcon size={18}/> : <FileText size={18}/>} {postAttachment.name}</span>
                          <button onClick={() => setPostAttachment(null)} className="text-red-500 hover:text-red-700 font-bold bg-white px-2 py-1 rounded shadow-sm">Xóa file</button>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <select value={postCategory} onChange={e => setPostCategory(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-bme-primary">
                            <option value="Chẩn đoán">Chẩn đoán</option>
                            <option value="Hồi sức">Hồi sức</option>
                            <option value="Linh kiện">Linh kiện</option>
                            <option value="X-ray">X-ray</option>
                          </select>
                          <input type="file" id="comm-feed-upload" className="hidden" accept=".jpg,.png,.pdf,.doc,.docx" onChange={handleFileChange} />
                          <button onClick={() => document.getElementById('comm-feed-upload')?.click()} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-bme-primary bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg transition shadow-sm"><ImageIcon size={18}/> Đính kèm</button>
                        </div>
                        <button onClick={createPost} className="bg-bme-primary hover:bg-bme-secondary text-white px-6 py-2 rounded-lg font-bold shadow-md transition">Đăng bài</button>
                      </div>
                    </div>
                  </div>
                </div>

                {commPosts.length === 0 && (
                  <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
                    <span className="text-5xl block mb-4 opacity-30">💬</span>
                    <p className="font-bold text-gray-600 text-lg">Chưa có bài viết nào trong nhóm này hoặc trong danh mục đã chọn.</p>
                    <p className="text-sm text-gray-500 mt-2">Hãy là người đầu tiên chia sẻ kiến thức nhé!</p>
                  </div>
                )}

                {commPosts.map(post => (
                  <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5 flex items-start gap-4">
                      <Avatar src={post.avatar} name={post.author} size={48} userId={post.authorId} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-800 text-base">{post.author}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{post.time}</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">{post.category}</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        
                        {post.attachment && post.attachment.typeLabel !== 'Image' && (
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3 cursor-pointer hover:border-bme-primary hover:shadow-sm transition group" onClick={() => {
                            const link = document.createElement('a');
                            link.href = post.attachment.base64;
                            link.download = post.attachment.name;
                            link.click();
                          }}>
                            <div className={`p-3 rounded-lg ${post.attachment.typeLabel === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}><FileText size={24} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-800 group-hover:text-bme-primary transition truncate">{post.attachment.name}</p>
                              <p className="text-xs font-medium text-gray-500 mt-1">{post.attachment.typeLabel} • {Math.round((post.attachment.size || 0)/1024)} KB</p>
                            </div>
                            <button className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold group-hover:bg-bme-primary group-hover:text-white group-hover:border-bme-primary transition">Tải xuống</button>
                          </div>
                        )}
                        {post.images && post.images.length > 0 && (
                          <div className="mt-4"><img src={post.images[0]} alt="attachment" className="rounded-xl max-h-96 w-auto object-cover border border-gray-200" /></div>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-3 flex items-center gap-6 border-t border-gray-100 bg-gray-50/50">
                      <button 
                        onClick={() => toggleSave(post.id)} 
                        className={`flex items-center gap-2 text-sm font-semibold transition ${savedPostIds.includes(post.id) ? 'text-bme-primary' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        <Bookmark size={18} fill={savedPostIds.includes(post.id) ? 'currentColor' : 'none'} />
                        {savedPostIds.includes(post.id) ? 'Đã lưu' : 'Lưu bài viết'}
                      </button>
                      <button 
                        onClick={() => setExpandedComments((prev: any) => ({ ...prev, [post.id]: !prev[post.id] }))} 
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
                      >
                        <MessageSquare size={18} />
                        {post.comments || 0} Bình luận
                      </button>
                    </div>

                    {expandedComments[post.id] && (
                      <div className="p-5 bg-white border-t border-gray-100">
                        <div className="space-y-4 mb-4">
                          {(!post.replies || post.replies.length === 0) ? (
                            <p className="text-sm text-gray-500 italic text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                          ) : (
                            post.replies.map((reply: any) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-bme-primary font-bold flex-shrink-0 text-sm">
                                  {reply.author?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-gray-800 text-sm">{reply.author} <span className="text-xs text-gray-500 font-normal ml-1">({reply.authorPhone ? reply.authorPhone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2') : '***'})</span></p>
                                    <span className="text-[10px] text-gray-400">{reply.time}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{reply.text}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {currentUser && (
                          <form onSubmit={e => { e.preventDefault(); const input = e.currentTarget.elements.namedItem(`comment-${post.id}`) as HTMLInputElement; if (input && input.value) { addComment(post.id, input.value); input.value = ''; } }} className="flex gap-2">
                            <input name={`comment-${post.id}`} type="text" placeholder="Viết bình luận của bạn..." className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-bme-primary focus:bg-white transition" />
                            <button type="submit" className="bg-bme-primary hover:bg-bme-secondary text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 shadow-sm"><Send size={16} /> Gửi</button>
                          </form>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </main>
            </div>
          )}

          {commTab === 'storage' && renderStorageTab()}
        </>
      )}
    </div>
  );
};

export default function BmeStationeryApp() {
  const [currentTab, setCurrentTab] = useState('FEED');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'user'|'business'|'coordinator'|'supervisor'|'admin'>('user');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState<'cart' | 'history'>('cart');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [pendingCommCount, setPendingCommCount] = useState(0);
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '' });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState({ linhKien: [] as any[], thietBi: [] as any[], files: [] as any[] });

  // ==========================================
  // KHỞI TẠO HỆ THỐNG AN TOÀN TRONG USEEFFECT
  // ==========================================
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    try {
      const existing = localStorage.getItem('bme_init_v3');
      
      // DANH SÁCH 5 TÀI KHOẢN BẮT BUỘC
      const requiredUsers = [
        { id: 'u_admin', name: 'Trưởng Ban Quản Trị', phone: '0123456789', password: 'admin', role: 'admin', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_super', name: 'Thanh Tra Hệ Thống', phone: '0988888888', password: 'admin', role: 'supervisor', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_coor', name: 'Chuyên Gia Điều Phối', phone: '0977777777', password: 'admin', role: 'coordinator', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_biz', name: 'Cửa Hàng Thiết Bị Y Sinh Yvj8', phone: '0966666666', password: 'admin', role: 'business', taxId: 'MST_BIZ', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_user', name: 'Nguyễn Văn Người Dùng', phone: '0955555555', password: 'admin', role: 'user', status: 'active', isOnline: false, lastActive: Date.now() }
      ];

      // Hàm kiểm tra và nạp tự động (Tránh trống hệ thống)
      let currentUsers = safeGet('bme_users', []);
      if (!Array.isArray(currentUsers)) currentUsers = [];
      
      let isUsersUpdated = false;

      requiredUsers.forEach(ru => {
        const foundIndex = currentUsers.findIndex((u: any) => u.phone === ru.phone);
        if (foundIndex === -1) {
          currentUsers.push(ru);
          isUsersUpdated = true;
        } else {
          // Bắt buộc khôi phục mật khẩu và quyền chuẩn nếu ai đó cố tình sửa sai
          if (currentUsers[foundIndex].password !== ru.password || currentUsers[foundIndex].role !== ru.role) {
             currentUsers[foundIndex] = { ...currentUsers[foundIndex], password: ru.password, role: ru.role, name: ru.name };
             isUsersUpdated = true;
          }
        }
      });

      if (isUsersUpdated || currentUsers.length === 0) {
        safeSet('bme_users', currentUsers);
      }

      if (!existing) {
        const defaultPosts = [
          { id: 'p_1', authorId: 'u_coor', author: 'Chuyên Gia Điều Phối', content: 'Chia sẻ: Cách reset lỗi E-04 trên máy siêu âm Mindray.', time: new Date().toLocaleString(), category: 'Chia sẻ kiến thức', likes: 12, comments: 0, replies: [], status: 'active' },
        ];
        const defaultStores = [
          { id: 's_1', ownerId: 'u_biz', name: 'Cửa Hàng Thiết Bị Y Sinh Yvj8', description: 'Chuyên cung cấp vật tư, linh kiện y tế chính hãng', address: 'Quận 10, TP.HCM', phone: '0966666666', status: 'online', rating: 5, feedback_count: 0, products: [
            { id: 'prod_1', name: 'Bo mạch chủ máy thở PB840', price: 5500000, desc: 'Mainboard thay thế', cat: 'Linh kiện thay thế', stock: 10 },
            { id: 'prod_2', name: 'Máy siêu âm Mindray', price: 120000000, desc: 'Máy siêu âm xách tay', cat: 'Thiết bị chẩn đoán hình ảnh', stock: 2 }
          ] },
        ];

        safeSet('bme_posts', defaultPosts);
        safeSet('bme_communities', []);
        safeSet('bme_files', []);
        safeSet('bme_stores', defaultStores);
        safeSet('bme_feedbacks', []);
        safeSet('bme_cart', []);
        safeSet('bme_messages', []);
        safeSet('bme_orders', []);
        safeSet('bme_notifications', [
          {id: 1, receiverPhone: '0955555555', text: 'Chào mừng Người dùng đến với hệ thống BME!', time: 'Vừa xong'},
          {id: 2, receiverPhone: '0966666666', text: 'Chào mừng Doanh nghiệp đến với hệ thống BME!', time: 'Vừa xong'}
        ]);
        safeSet('bme_audit_logs', []);
        safeSet('bme_storage', []);
        localStorage.setItem('bme_init_v3', 'true');
      }
      refreshUserState();
      
      const handleAddToCartEvent = (e: any) => handleAddToCart(e.detail);
      const handleOpenChatEvent = (e: any) => { setChatTarget(e.detail); setCurrentTab('MESSAGES'); setIsMenuOpen(false); };
      const handleViewProfileEvent = (e: any) => { setViewingUserId(e.detail); setCurrentTab('MY_PROFILE'); setIsMenuOpen(false); };
      const handleOpenStoreEvent = (e: any) => { setViewingStoreId(e.detail); setCurrentTab('STORE'); setIsMenuOpen(false); };

      document.addEventListener('addToCart', handleAddToCartEvent);
      document.addEventListener('openChat', handleOpenChatEvent);
      document.addEventListener('viewProfile', handleViewProfileEvent);
      document.addEventListener('openStore', handleOpenStoreEvent);
      
      const interval = setInterval(() => {
        setCartItems(safeGet('bme_cart', []));
        
        // Tính toán số lượng nhóm đang chờ duyệt theo Real-time để gắn Badge đỏ
        const comms = safeGet('bme_communities', []);
        if (Array.isArray(comms)) {
          setPendingCommCount(comms.filter((c:any) => c.status === 'Pending_Approval').length);
        }

        const cur = safeGet('bme_current_user', null);
        // Tính toán số lượng tin nhắn chưa đọc
        const msgs = safeGet('bme_messages', []);
        if (Array.isArray(msgs) && cur) {
          setUnreadMsgCount(msgs.filter((m: any) => m.receiverPhone === cur.phone && !m.isRead).length);
        }
        
        if (cur) {
           const users = safeGet('bme_users', []);
           if (Array.isArray(users)) {
             const latestUser = users.find((u:any) => u.id === cur.id);
             if (latestUser && latestUser.status === 'Banned') {
               showToast('Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng', 'error');
               localStorage.removeItem('bme_current_user');
               window.location.reload(); 
             }
           }
        }
      }, 2000);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('addToCart', handleAddToCartEvent);
        document.removeEventListener('openChat', handleOpenChatEvent);
        document.removeEventListener('viewProfile', handleViewProfileEvent);
        document.removeEventListener('openStore', handleOpenStoreEvent);
      };
    } catch (e) {
      console.error('init error', e);
    }
  }, [chatTarget]);

  const refreshUserState = () => {
    const cur = safeGet('bme_current_user', null);
    if (cur) {
      const users = safeGet('bme_users', []);
      if (Array.isArray(users)) {
        const latestUser = users.find((u:any) => u.id === cur.id);
        
        if (latestUser && latestUser.status === 'Banned') {
          showToast('Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng', 'error');
          localStorage.removeItem('bme_current_user');
          return;
        }
        
        setIsLoggedIn(true); 
        setUserRole(latestUser ? latestUser.role : cur.role); 
        setCurrentUser(latestUser || cur);
        if (latestUser) {
          safeSet('bme_users', users.map((u:any) => u.id === cur.id ? {...u, isOnline: true, lastActive: Date.now()} : u));
        }
      }
    }
  };

  // Tự động đóng Menu tài khoản & Giỏ hàng (Sự kiện CLICK OUTSIDE an toàn)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Items
  const navItems = [
    { id: 'FEED', icon: <LayoutGrid size={20} />, label: 'Bảng tin', badge: null },
    { id: 'EMERGENCY', icon: <MapPin size={20} />, label: 'Khẩn cấp', badge: '🚨' },
    { id: 'MESSAGES', icon: <MessageSquare size={20} />, label: 'Tin nhắn', badge: unreadMsgCount > 0 ? unreadMsgCount : null },
    { id: 'STORE', icon: <Store size={20} />, label: 'Gian hàng', badge: null },
    { id: 'SAVED_POSTS', icon: <Bookmark size={20} />, label: 'Mục đã lưu', badge: null },
    ...(userRole === 'admin' ? [{ id: 'ADMIN', icon: <Settings size={20} />, label: 'Quản trị Admin', badge: pendingCommCount > 0 ? pendingCommCount : null }] : []),
    ...(['supervisor', 'coordinator'].includes(userRole) ? [{ id: 'ADMIN', icon: <Settings size={20} />, label: 'Bảng điều khiển Giám sát', badge: pendingCommCount > 0 ? pendingCommCount : null }] : []),
  ];

  const handleLogout = () => {
    if(currentUser) {
      const users = safeGet('bme_users', []);
      if (Array.isArray(users)) {
        safeSet('bme_users', users.map((u:any) => u.id === currentUser.id ? {...u, isOnline: false, lastActive: Date.now()} : u));
      }
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole('user');
    setCurrentTab('FEED');
    setIsMenuOpen(false);
    setCartItems([]);
    setNotifications([]);
    setChatTarget(null);
    setViewingUserId(null);
    setViewingStoreId(null);
    localStorage.removeItem('bme_current_user');
  };

  // ==========================================
  // XỬ LÝ CART & CHECKOUT
  // ==========================================
  const handleAddToCart = (product: any) => {
    let cart = safeGet('bme_cart', []);
    if (!Array.isArray(cart)) cart = [];
    const exist = cart.find((i:any) => i.id === product.id);
    if(exist) {
      if(exist.qty >= product.stock) return showToast('Vượt quá số lượng tồn kho!', 'error');
      exist.qty += 1;
    } else {
      if(product.stock < 1) return showToast('Sản phẩm đã hết hàng!', 'error');
      cart.push({...product, qty: 1});
    }
    safeSet('bme_cart', cart);
    setCartItems(cart);
    showToast('Đã thêm vào giỏ hàng', 'success');
  };

  const handleCheckoutClick = () => {
    if(!currentUser) return showToast('Vui lòng đăng nhập để đặt hàng', 'error');
    if(!Array.isArray(cartItems) || cartItems.length === 0) return showToast('Giỏ hàng trống!', 'error');
    setCheckoutForm({ name: currentUser.name || '', phone: currentUser.phone || '', address: '' });
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const processCheckout = () => {
    if(!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
       return showToast('Vui lòng nhập đầy đủ thông tin giao hàng', 'error');
    }

    let stores = safeGet('bme_stores', []);
    if (!Array.isArray(stores)) stores = [];
    let success = true;

    // VIỆC 1: Chỉ kiểm tra xem giỏ hàng còn đủ hàng để đặt không (KHÔNG TRỪ KHO TẠI BƯỚC NÀY)
    if (Array.isArray(cartItems)) {
      cartItems.forEach(item => {
        const store = stores.find((s:any) => s.id === item.storeId);
        const prod = store?.products?.find((p:any) => p.id === item.id);
        if (!prod || prod.stock < item.qty) success = false;
      });
    }

    if(!success) return showToast('Lỗi: Một số sản phẩm không đủ tồn kho lúc này!', 'error');
    
    // VIỆC 2: Tạo Object đơn hàng hoàn chỉnh và Đẩy vào mảng orders
    const existingOrders = safeGet('bme_orders', []);
    const ordersArray = Array.isArray(existingOrders) ? existingOrders : [];
    let users = safeGet('bme_users', []);
    if (!Array.isArray(users)) users = [];
    const newNotifs: any[] = [];
    
    const cartByStore = Array.isArray(cartItems) ? cartItems.reduce((acc: any, item) => {
      if(!acc[item.storeId]) acc[item.storeId] = [];
      acc[item.storeId].push(item);
      return acc;
    }, {}) : {};
    
    const newOrders = Object.keys(cartByStore).map(storeId => {
      const storeItems = cartByStore[storeId];
      const store = stores.find((s:any) => s.id === storeId);
      const seller = users.find((u:any) => u.id === store?.ownerId);
      
      const order = {
        id: `ORD_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*1000)}`,
        buyerId: currentUser.id,
        buyerName: checkoutForm.name,
        buyerPhone: currentUser.phone, // Bind chặt số điện thoại tài khoản
        shippingAddress: checkoutForm.address,
        storeId: storeId,
        storeName: store?.name || 'Gian hàng BME',
        sellerId: store?.ownerId,
        items: storeItems,
        totalPrice: storeItems.reduce((sum: number, item: any) => sum + (Number(item.price) * item.qty), 0),
        timestamp: new Date().toLocaleString(),
        status: 'Chờ xác nhận'
      };

      // Bắn thông báo ngay lập tức cho chủ gian hàng (Business)
      if (seller) {
        newNotifs.push({
          id: Date.now() + Math.random(),
          receiverPhone: seller.phone,
          text: `🛒 Có đơn hàng mới ${order.id} từ ${checkoutForm.name}! Hãy kiểm tra Gian hàng.`,
          time: new Date().toLocaleString()
        });
      }
      
      return order;
    });
    safeSet('bme_orders', [...newOrders, ...ordersArray]);

    // Ghi nhận đơn hàng vào Log hệ thống cho Admin theo dõi
    const logs = safeGet('bme_audit_logs', []);
    const logsArray = Array.isArray(logs) ? logs : [];
    const totalItems = Array.isArray(cartItems) ? cartItems.reduce((a,c)=>a+c.qty,0) : 0;
    const totalPrice = Array.isArray(cartItems) ? cartItems.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0) : 0;
    
    logsArray.unshift({ id: Date.now(), user: currentUser.name, role: currentUser.role, action: `Đã đặt mua ${totalItems} sản phẩm (Tổng: ${totalPrice.toLocaleString()}đ)`, time: new Date().toLocaleString() });
    safeSet('bme_audit_logs', logsArray);

    // Bắn thông báo xác nhận thành công cho chính người mua (User)
    newNotifs.push({
      id: Date.now() + Math.random(),
      receiverPhone: currentUser.phone,
      text: `✅ Đặt hàng thành công! Đơn hàng của bạn đã được chuyển tới nhà bán hàng.`,
      time: new Date().toLocaleString()
    });

    const existingNotifs = safeGet('bme_notifications', []);
    safeSet('bme_notifications', [...newNotifs, ...(Array.isArray(existingNotifs) ? existingNotifs : [])]);

    // VIỆC 3: Xóa sạch Giỏ hàng sau khi đã lưu Đơn hàng an toàn
    safeSet('bme_cart', []);
    setCartItems([]);
    setIsCheckoutModalOpen(false);
    setCartTab('history'); // Tự động chuyển qua tab Lịch sử để User nhìn thấy đơn vừa đặt
    
    showToast('Đặt hàng thành công! Đơn hàng của bạn đã được chuyển tới nhà bán hàng', 'success');
    window.dispatchEvent(new CustomEvent('bme-refresh-stores'));
  };

  const cartTotal = Array.isArray(cartItems) ? cartItems.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0) : 0;
  const cartGrouped = Array.isArray(cartItems) ? cartItems.reduce((acc: any, item) => {
    const cat = item.cat || 'Khác';
    if(!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}) : {};

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setShowSearchDropdown(false);
      return;
    }
    if (typeof window === 'undefined') return;
    
    const allStores = safeGet('bme_stores', []);
    const allFiles = safeGet('bme_files', []);
    const lowerQ = q.toLowerCase();

    const linhKien: any[] = [];
    const thietBi: any[] = [];
    
    if (Array.isArray(allStores)) {
      allStores.forEach((s: any) => {
        if (Array.isArray(s.products)) {
          s.products.forEach((p: any) => {
            if (p.name && p.name.toLowerCase().includes(lowerQ)) {
              const isLinhKien = p.cat?.toLowerCase().includes('linh kiện') || p.cat?.toLowerCase().includes('bo mạch') || p.cat?.toLowerCase().includes('cáp') || p.cat?.toLowerCase().includes('cảm biến');
              const enriched = { ...p, storeName: s.name, storeId: s.id };
              
              if (isLinhKien) linhKien.push(enriched);
              else thietBi.push(enriched);
            }
          });
        }
      });
    }
    
    const filesResult = Array.isArray(allFiles) ? allFiles.filter((f: any) => f.title && f.title.toLowerCase().includes(lowerQ)) : [];
    setSearchResults({ linhKien, thietBi, files: filesResult });
    setShowSearchDropdown(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Nhấn Enter -> Chuyển hướng thông minh
    if (searchResults.linhKien.length > 0 || searchResults.thietBi.length > 0) {
      setCurrentTab('STORE');
      const firstProd = searchResults.linhKien[0] || searchResults.thietBi[0];
      if (firstProd) setTimeout(() => { 
        if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('openStore', {detail: firstProd.storeId}));
      }, 200);
    } else if (searchResults.files.length > 0) {
      setCurrentTab('COMMUNITY');
    }
    setShowSearchDropdown(false);
  };

  // Render Dropdown Tìm kiếm
  const renderSearchDropdown = () => {
    if (!showSearchDropdown || !searchQuery) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto border border-gray-100 text-gray-800">
        <div className="p-4">
          {searchResults.linhKien.length === 0 && searchResults.thietBi.length === 0 && searchResults.files.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <span className="text-4xl block mb-2 opacity-50">🔍</span>
              Không tìm thấy sản phẩm/linh kiện y tế phù hợp, vui lòng thử lại từ khóa khác
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.linhKien.length > 0 && (
                <div>
                  <h4 className="font-bold text-bme-primary mb-2 border-b pb-1 flex items-center gap-2">🔌 Linh kiện thay thế</h4>
                  <div className="grid gap-2">
                    {searchResults.linhKien.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition" onClick={() => { setShowSearchDropdown(false); setCurrentTab('STORE'); setTimeout(()=> {
                        if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('openStore', {detail: p.storeId}));
                      }, 100); }}>
                        <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">Phân phối bởi: {p.storeName} • Danh mục: {p.cat}</p>
                        </div>
                        <span className="text-bme-accent font-bold text-sm bg-white px-2 py-1 rounded shadow-sm">{Number(p.price).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.thietBi.length > 0 && (
                <div>
                  <h4 className="font-bold text-bme-primary mb-2 border-b pb-1 flex items-center gap-2">🩺 Thiết bị y tế / Máy móc</h4>
                  <div className="grid gap-2">
                    {searchResults.thietBi.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition" onClick={() => { setShowSearchDropdown(false); setCurrentTab('STORE'); setTimeout(()=> {
                        if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('openStore', {detail: p.storeId}));
                      }, 100); }}>
                        <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">Phân phối bởi: {p.storeName}</p>
                        </div>
                        <span className="text-bme-accent font-bold text-sm bg-white px-2 py-1 rounded shadow-sm">{Number(p.price).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.files.length > 0 && (
                <div>
                  <h4 className="font-bold text-bme-primary mb-2 border-b pb-1">📄 Tài liệu kỹ thuật liên quan</h4>
                  <div className="grid gap-2">
                    {searchResults.files.map((f, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition" onClick={() => { setShowSearchDropdown(false); setCurrentTab('COMMUNITY'); setTimeout(()=> {
                        if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('openCommunity', {detail: f.communityId}));
                      }, 100); }}>
                        <p className="font-bold text-gray-800 flex-1">{f.title}</p>
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">{f.type.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-bme-primary font-bold text-xl animate-pulse">Đang tải nền tảng BME...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* =============================================
          HEADER - NAVBAR (Phong cách Long Châu)
          ============================================= */}
      <header className="bg-gradient-to-r from-bme-primary to-bme-secondary sticky top-0 z-40 shadow-lg">
        <div className="w-full px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Mobile Menu Toggle */}
            <div className="flex items-center gap-3 min-w-fit">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div
                className="text-white font-black text-xl lg:text-2xl tracking-wider cursor-pointer hover:opacity-80 transition"
                onClick={() => setCurrentTab('FEED')}
              >
                ⚕️ BME <span className="text-red-400">STATIONERY</span>
              </div>
            </div>

            {/* Search Bar (Desktop) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-2xl relative items-center"
            >
              <input
                type="text"
                placeholder="Tìm kiếm linh kiện, máy móc, mã lỗi..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full h-12 pl-4 pr-24 rounded-full border-none outline-none text-gray-800 shadow-inner focus:ring-2 focus:ring-white/30"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <button
                  type="button"
                  className="p-2.5 text-gray-500 hover:text-bme-primary bg-gray-100 hover:bg-white rounded-full transition"
                  title="Tìm bằng giọng nói"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOcrOpen(true)}
                  className="p-2.5 text-gray-500 hover:text-bme-primary bg-gray-100 hover:bg-white rounded-full transition"
                  title="Tìm bằng hình ảnh (AI)"
                >
                  <Camera size={18} />
                </button>
              </div>
              <button
                type="submit"
                className="absolute right-24 top-2 bottom-2 w-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center cursor-pointer transition"
              >
                <Search className="text-white" size={18} />
              </button>

              {renderSearchDropdown()}
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={() => setIsOcrOpen(true)}
                className="md:hidden text-white hover:bg-white/20 p-2 rounded-lg transition"
                title="Tìm bằng hình ảnh"
              >
                <Camera size={20} />
              </button>

              {/* NOTIFICATION POPUP */}
              <div className="relative">
                <button onClick={() => {setIsNotifOpen(!isNotifOpen); setIsCartOpen(false);}} className="relative text-white hover:bg-white/20 p-2 rounded-lg transition">
                <Bell size={20} />
                  {Array.isArray(notifications) && notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border border-bme-primary rounded-full animate-pulse"></span>}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800">
                    <div className="bg-gray-50 px-4 py-3 border-b font-bold text-sm flex justify-between"><span>Thông báo mới</span></div>
                    <div className="max-h-80 overflow-y-auto">
                      {!Array.isArray(notifications) || notifications.length === 0 ? <p className="p-6 text-center text-gray-500 text-sm">Chưa có thông báo nào</p> : 
                       notifications.map((n:any, i) => (
                         <div key={i} className="px-4 py-3 hover:bg-blue-50 border-b last:border-0 cursor-pointer transition">
                           <p className="text-sm font-medium">{n.text}</p>
                           <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CART DROPDOWN (LONG CHAU STYLE) */}
              <div className="relative" ref={cartRef}>
                <button onClick={() => {setIsCartOpen(!isCartOpen); setIsNotifOpen(false);}} className="relative text-white hover:bg-white/20 p-2 rounded-lg transition">
                  <ShoppingCart size={20} />
                  {Array.isArray(cartItems) && cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-bme-primary">
                    {cartItems.reduce((a,c)=>a+c.qty,0)}
                  </span>}
                </button>
                {isCartOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800 flex flex-col animate-fade-in">
                    <div className="bg-bme-primary text-white px-4 py-3 font-bold text-sm flex justify-between items-center">
                      <span>Trung tâm mua sắm</span>
                      <button onClick={() => setIsCartOpen(false)}><X size={16} /></button>
                    </div>
                    {/* TABS CHUYỂN ĐỔI */}
                    <div className="flex bg-gray-50 border-b border-gray-200">
                       <button onClick={() => setCartTab('cart')} className={`flex-1 py-3 text-sm font-bold transition ${cartTab === 'cart' ? 'text-bme-primary border-b-2 border-bme-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}>Giỏ hàng ({Array.isArray(cartItems) ? cartItems.reduce((a,c)=>a+c.qty,0) : 0})</button>
                       <button onClick={() => setCartTab('history')} className={`flex-1 py-3 text-sm font-bold transition ${cartTab === 'history' ? 'text-bme-primary border-b-2 border-bme-primary bg-white' : 'text-gray-500 hover:text-gray-700'}`}>Lịch sử đơn ({myOrders.length})</button>
                    </div>

                    {/* KHU VỰC 1: GIỎ HÀNG */}
                    {cartTab === 'cart' && (
                      <div className="flex flex-col max-h-[60vh]">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {!Array.isArray(cartItems) || cartItems.length === 0 ? <p className="text-center text-gray-500 py-8 italic font-medium">Giỏ hàng của bạn đang trống</p> : 
                            Object.keys(cartGrouped).map(cat => (
                              <div key={cat}>
                                <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b">{cat}</h5>
                                {cartGrouped[cat].map((item:any, i:number) => (
                                  <div key={i} className="flex justify-between items-center mb-3 bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="flex-1 pr-2">
                                      <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">{item.storeName} • Đơn giá: {Number(item.price).toLocaleString()}đ</p>
                                      <p className="text-sm font-bold text-bme-accent mt-1">Tổng: {(Number(item.price) * item.qty).toLocaleString()}đ</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">SL: {item.qty}</span>
                                      <button onClick={() => {
                                      const next = cartItems.filter(ci => ci.id !== item.id);
                                      setCartItems(next); safeSet('bme_cart', next);
                                      }} className="text-red-500 text-xs hover:underline font-bold bg-red-50 px-2 py-1 rounded">Xóa</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))
                          }
                        </div>
                        {Array.isArray(cartItems) && cartItems.length > 0 && (
                          <div className="bg-gray-50 p-4 border-t shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between font-bold text-lg mb-4 items-center"><span>Tổng thanh toán:</span><span className="text-red-600 text-xl">{cartTotal.toLocaleString()}đ</span></div>
                            <button onClick={handleCheckoutClick} className="w-full bg-bme-primary hover:bg-bme-secondary text-white font-bold py-3.5 rounded-lg shadow-md transition text-sm flex justify-center items-center gap-2"><ShoppingCart size={18}/> TIẾN HÀNH ĐẶT HÀNG</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* KHU VỰC 2: LỊCH SỬ ĐƠN HÀNG */}
                    {cartTab === 'history' && (
                      <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {myOrders.length === 0 ? <p className="text-center text-gray-500 py-8 italic font-medium">Bạn chưa có đơn hàng nào.</p> : 
                          myOrders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(o => (
                            <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-bme-primary transition">
                              <div className="flex justify-between items-start border-b pb-2 mb-2">
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{o.id}</p>
                                  <p className="text-xs text-gray-400 font-medium mt-0.5">{o.timestamp}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${o.status === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800' : o.status === 'Đang giao hàng' ? 'bg-blue-100 text-blue-800' : o.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{o.status}</span>
                              </div>
                              <p className="font-semibold text-sm text-bme-primary truncate mb-1" onClick={()=> {setIsCartOpen(false); document.dispatchEvent(new CustomEvent('openStore', {detail: o.storeId}));}}>{o.storeName}</p>
                              <div className="flex justify-between items-center mt-2 pt-2 text-sm">
                                 <span className="text-gray-600 font-medium">{o.items.length} món đồ</span>
                                 <span className="text-red-600 font-bold">{o.totalPrice.toLocaleString()}đ</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isLoggedIn ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold transition border border-white/30 whitespace-nowrap text-sm lg:text-base"
                >
                  Đăng nhập
                </button>
              ) : (
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full transition"
                  >
                    <span className="text-lg">👤</span>
                    <span className="hidden sm:inline text-sm">{currentUser?.name || 'Tài khoản'}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 min-w-[200px] overflow-hidden animate-fade-in">
                      <button onClick={() => {setViewingUserId(currentUser.id); setCurrentTab('MY_PROFILE'); setIsMenuOpen(false); setIsUserMenuOpen(false);}} className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-50 transition font-medium border-b border-gray-50">
                      👤 Hồ sơ
                    </button>
                      <button onClick={() => {setViewingUserId(currentUser.id); setCurrentTab('MY_PROFILE'); setIsMenuOpen(false); setIsUserMenuOpen(false);}} className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-50 transition font-medium border-b border-gray-50">
                      ⚙️ Cài đặt
                    </button>
                    <button
                      onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      Đăng xuất
                    </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar (Mobile) */}
          <form onSubmit={handleSearch} className="md:hidden mt-3 flex gap-2 relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 h-10 px-3 rounded-full outline-none text-sm"
            />
            <button type="submit" className="bg-white/30 text-white p-2 rounded-full">
              <Search size={18} />
            </button>
            {renderSearchDropdown()}
          </form>
        </div>
      </header>

      {/* =============================================
          MAIN CONTENT AREA
          ============================================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* =============================================
            SIDEBAR NAVIGATION (Desktop & Mobile)
            ============================================= */}
        <aside
          className={`${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative top-0 left-0 h-screen lg:h-auto bg-white shadow-lg lg:shadow-sm z-30 w-64 lg:w-auto lg:w-56 transition-transform duration-300 flex flex-col lg:flex-row border-r border-gray-200`}
        >
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 mt-12 lg:mt-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMenuOpen(false);
                  if (item.id === 'STORE') setViewingStoreId(null);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-semibold transition ${
                  currentTab === item.id
                    ? 'bg-gradient-to-r from-bme-primary to-bme-secondary text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && <span className="text-lg animate-pulse">{item.badge}</span>}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 lg:hidden">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsLoginOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full bg-bme-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-bme-secondary transition"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </aside>

        {/* =============================================
            MAIN VIEW CONTENT
            ============================================= */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 lg:p-6">
            {/* View Title */}
            <div className="mb-6 animate-slide-in-down">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">
                {currentTab === 'FEED' && '📋 Bảng tin'}
                {currentTab === 'EMERGENCY' && '🚨 Tìm kiếm khẩn cấp'}
                {currentTab === 'STORE' && '🏪 Gian hàng'}
                {currentTab === 'ADMIN' && '⚙️ Dashboard quản trị'}
                {currentTab === 'SAVED_POSTS' && '🔖 Mục đã lưu'}
                {currentTab === 'MY_PROFILE' && '👤 Hồ sơ'}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTab === 'FEED' && 'Khám phá bài viết mới, tin tức y sinh và cơ hội kinh doanh'}
                {currentTab === 'EMERGENCY' && 'Tìm kỹ thuật viên & cửa hàng gần nhất để xử lý sự cố'}
                {currentTab === 'MESSAGES' && 'Trò chuyện trực tiếp với Khách hàng và Doanh nghiệp'}
                {currentTab === 'STORE' && 'Duyệt các cửa hàng và sản phẩm y tế'}
                {currentTab === 'ADMIN' && 'Bảng điều khiển dành riêng cho Quản trị viên và Chuyên gia'}
                {currentTab === 'SAVED_POSTS' && 'Danh sách các bài viết và tài liệu mà bạn đã lưu trữ'}
                {currentTab === 'MY_PROFILE' && 'Trang thông tin cá nhân / Doanh nghiệp'}
              </p>
            </div>

            {/* DÙNG SWITCH-CASE THÔNG MINH ĐỂ ĐIỀU HƯỚNG MÀN HÌNH CHÍNH */}
            <div className="animate-fade-in">
              {(() => {
                switch(currentTab) {
                  case 'FEED':
                    return <CommunityFeedCorridor searchQuery={searchQuery} currentUser={currentUser} />;
                  case 'SAVED_POSTS': 
                    return <HomeFeed searchQuery={searchQuery} currentUser={currentUser} savedOnly={true} />;
                  case 'EMERGENCY': 
                    return <MapView />;
                  case 'MESSAGES':
                    return <ChatCenter currentUser={currentUser} initialTarget={chatTarget} />;
                  case 'STORE': 
                    return <StoreProfile currentUser={currentUser} searchQuery={searchQuery} viewingStoreId={viewingStoreId} setViewingStoreId={setViewingStoreId} />;
                  case 'MY_PROFILE': 
                    return viewingUserId ? <UserProfile userId={viewingUserId} currentUser={currentUser} /> : null;
                  case 'ADMIN': 
                    if (['admin', 'supervisor', 'coordinator'].includes(userRole)) {
                      return <AdminDashboard currentUser={currentUser} />;
                    } else {
                      return (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                          <p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p>
                          <p className="text-yellow-700 mt-2">Khu vực dành riêng cho ban Quản trị BME</p>
                        </div>
                      );
                    }
                  default: 
                    return <HomeFeed searchQuery={searchQuery} currentUser={currentUser} />;
                }
              })()}
            </div>

            {/* Developer Info */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
              <p>✨ BME Stationery Platform v1.0 | Xây dựng cho Y sinh</p>
              <p className="mt-1">Mạng xã hội & Thương mại điện tử cho các chuyên gia y tế</p>
            </div>
          </div>
        </main>
      </div>

      {/* =============================================
          MODALS
          ============================================= */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={(user: any) => {
          setIsLoginOpen(false);
          setIsLoggedIn(true);
          setUserRole(user.role || 'user');
          setCurrentUser(user);
          try { localStorage.setItem('bme_current_user', JSON.stringify(user)); } catch (e) {}
        }}
      />

      <OcrSearchModal isOpen={isOcrOpen} onClose={() => setIsOcrOpen(false)} />

      {/* Overlay for Mobile Menu */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      
      {/* CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24}/></button>
            <h3 className="text-xl font-bold text-bme-primary mb-2">Xác nhận thông tin giao hàng</h3>
            <p className="text-sm text-gray-500 mb-6">Vui lòng điền thông tin để nhà bán hàng có thể liên hệ với bạn.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
                <input value={checkoutForm.name} onChange={e=>setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-bme-primary" placeholder="Nhập họ tên người nhận" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input value={checkoutForm.phone} onChange={e=>setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-bme-primary" placeholder="Nhập SĐT liên hệ" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ giao hàng</label>
                <textarea value={checkoutForm.address} onChange={e=>setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-bme-primary resize-none" rows={3} placeholder="Nhập địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện...)" />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center mt-2">
                <span className="text-sm font-semibold text-blue-800">Tổng cộng ({Array.isArray(cartItems) ? cartItems.reduce((a,c)=>a+c.qty,0) : 0} SP):</span>
                <span className="font-bold text-lg text-red-600">{cartTotal.toLocaleString()}đ</span>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">Hủy bỏ</button>
                <button onClick={processCheckout} className="flex-1 py-3 bg-bme-primary text-white font-bold rounded-lg hover:bg-bme-secondary shadow-md transition">XÁC NHẬN ĐẶT ĐƠN</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
