'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Mic, Camera, LayoutGrid, MapPin, Users, Store, Settings, LogOut, Menu, X, Bell,
  ShoppingCart, ShoppingBag, Send, User as UserIcon, User, MessageSquare, MessageCircle, Bookmark, ChevronLeft, ChevronRight, Home, Wrench, CheckCircle, Check,
  AlertCircle, Package, Folder, FileText, Image as ImageIcon, Plus, Share2, FileDown, Star, ChevronDown, Filter, SlidersHorizontal, ArrowUpDown, ArrowLeft,
  FolderOpen, PlusCircle, Shield, Eye, Lock, Upload, Database, Trash2, AlertTriangle, BarChart, TrendingUp, Server, Tag 
} from 'lucide-react';
import {
  LoginModal, OcrSearchModal, HomeFeed, MapView, StoreProfile, AdminDashboard, UserSettings,
  ToastContainer, UserProfile, ChatCenter, ServicesMarketplace, Avatar, safeGet, safeSet, showToast
} from '@/components/UIComponents';

// ==========================================
// COMPONENT: HÀNH LANG & NỘI BỘ NHÓM
// ==========================================
const CommunityFeedCorridor = ({ currentUser, searchQuery }: { currentUser: any, searchQuery: string }) => {
  const [communities, setCommunities] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  const [newPostText, setNewPostText] = useState('');
  const [postAttachment, setPostAttachment] = useState<any>(null);
  const [postCategory, setPostCategory] = useState('Chẩn đoán');
  
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [commTab, setCommTab] = useState<'feed' | 'storage' | 'members'>('feed');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const [usersData, setUsersData] = useState<any[]>([]);
  const [expandedComments, setExpandedComments] = useState<any>({});
  const normalizePhone = (value: any) => String(value || '').replace(/\D/g, '');
  const normalizedCurrentPhone = normalizePhone(currentUser?.phone);
  const isCoordinatorAccount = normalizedCurrentPhone === '0977777777' || normalizedCurrentPhone === '84977777777' || String(currentUser?.role || '').toLowerCase() === 'coordinator';

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

  useEffect(() => {
    const handleOpenCommunity = (e: any) => {
      setActiveCommunityId(e.detail);
      setCommTab('storage');
    };
    window.addEventListener('openCommunity', handleOpenCommunity);
    return () => window.removeEventListener('openCommunity', handleOpenCommunity);
  }, []);

  const handleCreateCommunity = () => {
    if (!currentUser) return showToast('Vui lòng đăng nhập để tạo nhóm', 'error');
    if (!newCommName.trim()) return showToast('Vui lòng nhập tên hội nhóm', 'error');
    
    const newComm = { 
      id:`c_${Date.now()}`, 
      name: newCommName, 
      description: newCommDesc, 
      members: [currentUser.phone],
      pendingMembers: [],
      creatorPhone: currentUser.phone,
      creatorId: currentUser.id,
      status: 'PENDING_APPROVAL',
      icon: '👥'
    };
    
    const nextComms = [...(Array.isArray(communities) ? communities : []), newComm];
    setCommunities(nextComms);
    safeSet('bme_communities', nextComms);
    
    setNewCommName('');
    setNewCommDesc('');
    setIsCreateFormVisible(false);
    showToast('Tạo nhóm thành công! Đang chờ Ban quản trị duyệt.', 'success');
  };

  const handleJoin = (commId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return showToast('Vui lòng đăng nhập để tham gia nhóm', 'error');
    
    const next = communities.map(c => {
      if (c.id === commId) {
        const pMembers = Array.isArray(c.pendingMembers) ? c.pendingMembers : [];
        if (!pMembers.includes(currentUser.phone) && !c.members?.includes(currentUser.phone)) {
          return { ...c, pendingMembers: [...pMembers, currentUser.phone] };
        }
      }
      return c;
    });
    setCommunities(next);
    safeSet('bme_communities', next);
    showToast('Đã gửi yêu cầu tham gia, chờ Trưởng nhóm phê duyệt!', 'success');
  };

  const handleApproveMember = (commId: string, phone: string, isApproved: boolean) => {
    const next = communities.map(c => {
      if (c.id === commId) {
        const pMembers = (c.pendingMembers || []).filter((p: string) => p !== phone);
        const members = isApproved ? [...(c.members || []), phone] : c.members;
        return { ...c, pendingMembers: pMembers, members };
      }
      return c;
    });
    setCommunities(next);
    safeSet('bme_communities', next);
    showToast(isApproved ? `Đã phê duyệt thành viên ${phone}` : `Đã từ chối thành viên ${phone}`, 'success');
  };

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
      console.error('Lỗi khi tải ảnh bài viết:', error);
      showToast('Không thể xử lý ảnh. Vui lòng thử lại!', 'error');
      setPostAttachment(null);
    }
  };

  const createPost = () => {
    if (!currentUser) return showToast('Vui lòng đăng nhập!', 'error');
    if (!newPostText.trim() && !postAttachment) return showToast('Vui lòng nhập nội dung hoặc đính kèm file', 'error');
    
    const newPost = { 
      id: `p_${Date.now()}`, authorId: currentUser.id, author: currentUser.name, avatar: currentUser.avatar, 
      time: new Date().toLocaleString(), content: newPostText, attachment: postAttachment,
      images: postAttachment?.typeLabel === 'Image' ? [postAttachment.base64] : [], 
      category: postCategory, communityId: activeCommunityId, likes: 0, comments: 0, replies: [], status: 'active' 
    };
    
    const nextPosts = [newPost, ...(Array.isArray(posts) ? posts : [])]; 
    setPosts(nextPosts); 
    safeSet('bme_posts', nextPosts);
    setNewPostText(''); 
    setPostAttachment(null);
    showToast('Đăng bài thành công!', 'success');
  };

  if (activeCommunityId === null) {
    const visibleComms = Array.isArray(communities) ? communities.filter(c => 
      (isCoordinatorAccount || c.status === 'APPROVED' || c.status === 'Approved') && 
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
            {isCreateFormVisible ? 'Đóng Form' : '[+] Tạo nhóm mới'}
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
            const isPending = c.pendingMembers && currentUser && Array.isArray(c.pendingMembers) && c.pendingMembers.includes(currentUser.phone);
            return (
              <div key={c.id} onClick={() => { setActiveCommunityId(c.id); setCommTab('feed'); setCurrentFolder(null); }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-bme-primary transition cursor-pointer flex flex-col h-full group">
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
                  ) : isPending ? (
                    <div className="w-full text-center py-2 bg-yellow-50 text-yellow-700 font-bold rounded-lg text-sm border border-yellow-200">⏳ Đang chờ duyệt...</div>
                  ) : (
                    <button onClick={(e) => handleJoin(c.id, e)} className="w-full text-center py-2 bg-bme-primary hover:bg-bme-secondary text-white font-bold rounded-lg text-sm transition shadow-sm">THAM GIA</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeComm = Array.isArray(communities) ? communities.find(c => c.id === activeCommunityId) : null;
  if (!activeComm) {
    return <div className="text-center py-10"><p className="mb-4">Không tìm thấy cộng đồng.</p><button onClick={()=>setActiveCommunityId(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Quay lại</button></div>;
  }
  
  const activeCommunity = activeComm;
  const hasGroupAccess = isCoordinatorAccount || activeCommunity?.creatorPhone === currentUser?.phone || activeCommunity?.members?.includes(currentUser?.phone);
  const isPending = activeComm.pendingMembers && currentUser && Array.isArray(activeComm.pendingMembers) && activeComm.pendingMembers.includes(currentUser.phone);
  const canManageMembers = isCoordinatorAccount || activeCommunity?.creatorPhone === currentUser?.phone;
  
  const commPosts = Array.isArray(posts) ? posts.filter(post => post.communityId === activeCommunityId && (
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  )).filter(post => filterCategory === 'Tất cả' || post.category === filterCategory) : [];

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

  const addComment = (id: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    const allPosts = safeGet('bme_posts', []);
    const nextPosts = allPosts.map((p: any) => 
      p.id === id ? {
        ...p,
        comments: (p.comments || 0) + 1,
        replies: [...(p.replies || []), {
          id: `r_${Date.now()}`,
          author: currentUser.name || 'Ẩn danh',
          authorPhone: currentUser.phone,
          text,
          time: new Date().toLocaleString()
        }]
      } : p
    );
    setPosts(nextPosts);
    safeSet('bme_posts', nextPosts);
  };

  const handleDeletePostViolation = (postId: string) => {
    if (!isCoordinatorAccount) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết vi phạm này khỏi hệ thống không?')) return;
    const updatedPosts = (Array.isArray(posts) ? posts : []).filter((p: any) => p?.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    safeSet('bme_posts', updatedPosts);
    alert('Đã xóa bài viết vi phạm khỏi hệ thống!');
  };

  const handleDeleteCommunityViolation = (communityId: string) => {
    if (!isCoordinatorAccount) return;
    if (!window.confirm('HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn XÓA HOÀN TOÀN nhóm này cùng tất cả bài viết bên trong không?')) return;
    const updatedCommunities = (Array.isArray(communities) ? communities : []).filter((c: any) => c?.id !== communityId);
    const updatedPosts = (Array.isArray(posts) ? posts : []).filter((p: any) => p?.communityId !== communityId);
    setCommunities(updatedCommunities);
    setPosts(updatedPosts);
    localStorage.setItem('communities', JSON.stringify(updatedCommunities));
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    safeSet('bme_communities', updatedCommunities);
    safeSet('bme_posts', updatedPosts);
    setActiveCommunityId(null);
    setCommTab('feed');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bme-go-home'));
    }
    alert('Đã xóa sạch nhóm cộng đồng và các bài viết vi phạm!');
  };

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
        <button onClick={() => {if(setActiveCommunityId) setActiveCommunityId(null);}} className="absolute top-4 right-4 text-sm font-bold text-gray-500 hover:text-bme-primary flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg transition border border-gray-200"><ChevronLeft size={16}/> Quay lại danh sách nhóm</button>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-8 md:mt-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl shrink-0">{activeComm.icon || '👥'}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{activeComm.name}</h2>
              <p className="text-gray-500 mt-1">{Array.isArray(activeComm.members) ? activeComm.members.length : 0} thành viên</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isCoordinatorAccount && (
              <button onClick={() => handleDeleteCommunityViolation(activeComm.id)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 text-xs flex items-center gap-2">
                <AlertTriangle size={16} /> XÓA NHÓM VI PHẠM
              </button>
            )}
            {hasGroupAccess ? (
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm border border-green-200">Thành viên chính thức</span>
            ) : (
              <button onClick={(e) => handleJoin(activeComm.id, e)} className="px-6 py-2.5 bg-bme-primary hover:bg-bme-secondary text-white font-bold rounded-lg transition shadow-md whitespace-nowrap">THAM GIA CỘNG ĐỒNG</button>
            )}
          </div>
        </div>
      </div>

      {!hasGroupAccess ? (
        <div className="bg-yellow-50 p-8 rounded-xl border-2 border-dashed border-yellow-200 text-center">
          <h3 className="text-xl font-bold text-yellow-800">Đây là cộng đồng riêng tư</h3>
          <p className="text-yellow-700 mt-2 mb-6">Bạn cần tham gia để xem các bài viết thảo luận và kho tài liệu.</p>
          {isPending ? (
            <button disabled className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition opacity-70 cursor-not-allowed">ĐANG CHỜ DUYỆT...</button>
          ) : (
            <button onClick={(e) => handleJoin(activeComm.id, e)} className="bg-bme-primary hover:bg-bme-secondary text-white px-8 py-3 rounded-lg font-bold shadow-lg transition animate-pulse">THAM GIA CỘNG ĐỒNG</button>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-4 border-b border-gray-200">
            <button onClick={() => {setCommTab('feed'); setCurrentFolder(null);}} className={`pb-3 font-bold text-sm transition border-b-2 px-2 ${commTab === 'feed' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Bảng tin nhóm</button>
            <button onClick={() => setCommTab('storage')} className={`pb-3 font-bold text-sm transition border-b-2 px-2 flex items-center gap-2 ${commTab === 'storage' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Folder size={16}/> Kho tài liệu</button>
            {canManageMembers && (
              <button onClick={() => setCommTab('members')} className={`pb-3 font-bold text-sm transition border-b-2 px-2 flex items-center gap-2 ${commTab === 'members' ? 'border-bme-primary text-bme-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                Yêu cầu gia nhập {activeComm.pendingMembers?.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{activeComm.pendingMembers.length}</span>}
              </button>
            )}
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
                          <div className="flex items-center gap-3">
                            <img src={postAttachment.base64} alt="Preview ảnh bài viết" className="h-16 w-16 object-cover rounded" />
                            <span className="truncate max-w-[80%] font-semibold text-bme-primary">{postAttachment.name}</span>
                          </div>
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
                          <input type="file" accept="image/*" onChange={handleFileChange} className="p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-bme-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">{post.category}</span>
                          </div>
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
                      {isCoordinatorAccount && (
                        <button
                          onClick={() => handleDeletePostViolation(post.id)}
                          className="ml-auto text-red-600 hover:text-red-800 font-semibold p-2 bg-red-50 rounded-lg flex items-center gap-1 text-xs"
                        >
                          <Trash2 size={16} /> Xóa bài vi phạm
                        </button>
                      )}
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

          {commTab === 'members' && canManageMembers && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Danh sách thành viên & Yêu cầu gia nhập</h3>

              <div className="mb-6">
                <p className="font-bold text-gray-700 mb-3">Thành viên hiện tại</p>
                {(!activeComm.members || activeComm.members.length === 0) ? (
                  <p className="text-gray-500 italic">Nhóm chưa có thành viên.</p>
                ) : (
                  <div className="space-y-2">
                    {activeComm.members.map((phone: string, idx: number) => (
                      <div key={`member_${idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="font-bold text-gray-800">{phone}</p>
                        <span className="text-xs text-gray-500">Thành viên</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="font-bold text-gray-700 mb-3">Yêu cầu gia nhập</p>
              {(!activeComm.pendingMembers || activeComm.pendingMembers.length === 0) ? (
                 <p className="text-gray-500 italic">Hiện tại không có yêu cầu tham gia nào mới.</p>
              ) : (
                 <div className="space-y-3">
                    {activeComm.pendingMembers.map((phone: string, idx: number) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                          <div>
                             <p className="font-bold text-gray-800 flex items-center gap-2"><UserIcon size={18} className="text-bme-primary"/> Số điện thoại: {phone}</p>
                             <p className="text-xs text-gray-500 mt-1">Trạng thái: Đang chờ phê duyệt</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleApproveMember(activeComm.id, phone, true)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition">Chấp nhận</button>
                             <button onClick={() => handleApproveMember(activeComm.id, phone, false)} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition">Từ chối</button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ==========================================
// COMPONENT: TRANG CHỦ (HOME DASHBOARD)
// ==========================================
const HomeDashboard = ({ setCurrentTab, setViewingStoreId, currentUser, userRole }: { setCurrentTab: (tab: string) => void; setViewingStoreId: (id: string | null) => void; currentUser: any; userRole: string; }) => {
  const defaultBannerItems = [
    {
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop',
      title: 'Kiến thức Y khoa Chuyên sâu',
      desc: 'Khám phá các bài viết, tài liệu và hướng dẫn từ các chuyên gia hàng đầu.',
    },
    {
      image: 'https://images.unsplash.com/photo-1581092916376-0239b934915b?q=80&w=2070&auto=format&fit=crop',
      title: 'Linh kiện & Vật tư Y tế',
      desc: 'Tìm kiếm và mua sắm các linh kiện chính hãng từ những nhà cung cấp uy tín.',
    },
    {
      image: 'https://images.unsplash.com/photo-1629233834398-c34b404b8340?q=80&w=2070&auto=format&fit=crop',
      title: 'Kết nối Cộng đồng Kỹ sư',
      desc: 'Tham gia các nhóm chuyên môn, trao đổi kinh nghiệm và hỗ trợ lẫn nhau.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerItems, setBannerItems] = useState<any[]>([]);
  const [showAddBannerForm, setShowAddBannerForm] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', desc: '' });
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [myDevices, setMyDevices] = useState<any[]>([]);
  const [deviceForm, setDeviceForm] = useState({ machineName: '', brand: '', purchaseDate: '' });

  useEffect(() => {
    const feeds = safeGet('bme_global_medical_feeds', []);
    if (Array.isArray(feeds) && feeds.length > 0) {
      setBannerItems(feeds);
    } else {
      setBannerItems(defaultBannerItems);
      safeSet('bme_global_medical_feeds', defaultBannerItems);
    }
  }, []);

  useEffect(() => {
    const allDevices = safeGet('bme_device_journal', []);
    if (!Array.isArray(allDevices)) {
      setMyDevices([]);
      return;
    }
    if (!currentUser?.phone) {
      setMyDevices([]);
      return;
    }
    setMyDevices(allDevices.filter((d: any) => d?.ownerPhone === currentUser?.phone));
  }, [currentUser?.phone]);

  const handleAddDevice = () => {
    if (!currentUser?.phone) {
      showToast('Vui lòng đăng nhập để quản lý thiết bị', 'error');
      return;
    }
    if (!deviceForm.machineName.trim() || !deviceForm.brand.trim() || !deviceForm.purchaseDate) {
      showToast('Vui lòng nhập đủ Tên máy, Hãng và Ngày mua', 'error');
      return;
    }
    const allDevices = safeGet('bme_device_journal', []);
    const devices = Array.isArray(allDevices) ? allDevices : [];
    const newDevice = {
      id: `dev_${Date.now()}`,
      ownerPhone: currentUser?.phone,
      ownerName: currentUser?.name || 'Người dùng',
      machineName: deviceForm.machineName.trim(),
      brand: deviceForm.brand.trim(),
      purchaseDate: deviceForm.purchaseDate,
      createdAt: new Date().toISOString()
    };
    const nextDevices = [newDevice, ...devices];
    safeSet('bme_device_journal', nextDevices);
    setMyDevices(nextDevices.filter((d: any) => d?.ownerPhone === currentUser?.phone));
    setDeviceForm({ machineName: '', brand: '', purchaseDate: '' });
    showToast('Đã thêm thiết bị vào nhật ký số', 'success');
  };

  const getMaintenanceStatus = (purchaseDate: string) => {
    const buyDate = new Date(purchaseDate);
    if (Number.isNaN(buyDate.getTime())) {
      return { label: 'Chưa đủ dữ liệu', color: 'text-gray-700 bg-gray-100 border-gray-200', dueText: 'Không xác định' };
    }
    const maintenanceCycleDays = 180;
    const dueDate = new Date(buyDate);
    dueDate.setDate(dueDate.getDate() + maintenanceCycleDays);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        label: 'Cần kiểm tra khẩn cấp',
        color: 'text-red-700 bg-red-100 border-red-200',
        dueText: `Quá hạn ${Math.abs(daysLeft)} ngày`
      };
    }
    if (daysLeft <= 30) {
      return {
        label: 'Sắp đến ngày bảo dưỡng',
        color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
        dueText: `Còn ${daysLeft} ngày`
      };
    }
    return {
      label: 'An toàn',
      color: 'text-green-700 bg-green-100 border-green-200',
      dueText: `Còn ${daysLeft} ngày`
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        setMediaBase64(null);
        return;
      }

      if (file.size > 500 * 1024) {
        alert('Dung lượng ảnh quá lớn! Để hệ thống hoạt động ổn định, vui lòng chọn ảnh dưới 500KB.');
        e.target.value = '';
        return;
      }

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }
          reject(new Error('Kết quả đọc file không hợp lệ.'));
        };
        reader.onerror = () => {
          reject(new Error('Không thể đọc file.'));
        };
        reader.readAsDataURL(file);
      });

      setMediaBase64(base64String);
    } catch (error) {
      console.error('Lỗi khi tải file banner:', error);
      showToast('Không thể xử lý ảnh banner. Vui lòng thử lại!', 'error');
      setMediaBase64(null);
    }
  };

  const handleAddBanner = () => {
     if (!newBanner.title || !mediaBase64) {
       return showToast('Vui lòng nhập tiêu đề và tải ảnh banner!', 'error');
    }
    const newFeed = { id: Date.now(), title: newBanner.title, desc: newBanner.desc, image: mediaBase64 };
    const updatedFeeds = [newFeed, ...bannerItems];
    setBannerItems(updatedFeeds);
    safeSet('bme_global_medical_feeds', updatedFeeds);
    setShowAddBannerForm(false);
    setNewBanner({ title: '', desc: '' });
    setMediaBase64(null);
    showToast('Đăng bản tin thành công!', 'success');
    setCurrentSlide(0);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (bannerItems.length > 0 && prev === bannerItems.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (bannerItems.length > 0 && prev === 0 ? bannerItems.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (bannerItems.length === 0) return;
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [bannerItems.length]);

  // Các bảng điều khiển đặc biệt cho Admin/Coordinator/Supervisor
  const AdminPanel = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [resetPhone, setResetPhone] = useState('');
    const [resetPassword, setResetPassword] = useState('');

    useEffect(() => {
      const auditLogs = safeGet('bme_audit_logs', []);
      if (Array.isArray(auditLogs)) {
        setLogs(auditLogs.slice(0, 5));
      }
    }, []);

    const handleResetPassword = () => {
      if (!resetPhone.trim() || !resetPassword.trim()) {
        return showToast('Vui lòng nhập đầy đủ SĐT và mật khẩu mới!', 'error');
      }
      
      let users = safeGet('bme_users', []);
      if (!Array.isArray(users)) users = [];
      
      const userIndex = users.findIndex((u: any) => u.phone === resetPhone);
      if (userIndex === -1) {
        return showToast('Không tìm thấy người dùng với SĐT này!', 'error');
      }
      
      users[userIndex].password = resetPassword;
      safeSet('bme_users', users);
      
      const auditLogs = safeGet('bme_audit_logs', []);
      const logsArray = Array.isArray(auditLogs) ? auditLogs : [];
      logsArray.unshift({ id: Date.now(), user: currentUser?.name || 'Admin', role: currentUser?.role || 'admin', action: `Cấp lại mật khẩu cho SĐT: ${resetPhone}`, time: new Date().toLocaleString() });
      safeSet('bme_audit_logs', logsArray);
      setLogs(logsArray.slice(0, 5));
      
      showToast(`Đã cấp lại mật khẩu cho ${users[userIndex].name} thành công!`, 'success');
      setResetPhone('');
      setResetPassword('');
    };

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
        <h3 className="text-xl font-bold text-red-600 mb-4">Bảng điều khiển Admin</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h4 className="font-bold text-gray-800 mb-3">Cấp lại mật khẩu</h4>
            <input value={resetPhone} onChange={(e) => setResetPhone(e.target.value)} type="text" placeholder="Nhập SĐT người dùng..." className="w-full p-2 border border-gray-300 rounded-lg mb-2 outline-none focus:border-bme-primary" />
            <input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} type="text" placeholder="Nhập mật khẩu mới..." className="w-full p-2 border border-gray-300 rounded-lg mb-3 outline-none focus:border-bme-primary" />
            <button onClick={handleResetPassword} className="w-full bg-bme-primary hover:bg-bme-secondary transition text-white py-2 rounded-lg font-bold shadow-sm">Xác nhận đổi mật khẩu</button>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h4 className="font-bold text-gray-800 mb-3">System Logs (Gần nhất)</h4>
            <ul className="text-xs space-y-2 max-h-40 overflow-y-auto">
              {Array.isArray(logs) && logs.length > 0 ? logs.map((log: any) => (
                <li key={log.id} className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <span className="font-bold text-bme-primary">[{log.role}] {log.user}</span>: {log.action} <span className="text-gray-400 block mt-0.5">({log.time})</span>
                </li>
              )) : <p className="text-gray-500">Không có log nào.</p>}
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border md:col-span-2">
            <h4 className="font-bold text-gray-800 mb-3">Danh sách Đối tác Business (Phân loại)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm bg-white rounded-lg shadow-sm overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 font-bold text-gray-700">Tên đối tác</th>
                    <th className="p-3 font-bold text-gray-700">SĐT</th>
                    <th className="p-3 font-bold text-gray-700">Loại hình</th>
                  </tr>
                </thead>
                <tbody>
                  {safeGet('bme_users', []).filter((u:any) => u.role === 'business').map((u:any) => (
                    <tr key={u.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.phone}</td>
                      <td className="p-3">
                         <span className={`px-2 py-1 rounded text-xs font-bold border ${u.businessType === 'technician' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                           {u.businessType === 'technician' ? '👨‍🔧 Kỹ sư sửa chữa' : '🏪 Cửa hàng vật tư'}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {safeGet('bme_users', []).filter((u:any) => u.role === 'business').length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">Chưa có đối tác Business nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CoordinatorPanel = () => {
    const [communities, setCommunities] = useState<any[]>([]);

    useEffect(() => {
      const syncCommunities = () => {
        const rawCommunities = safeGet('communities', safeGet('bme_communities', []));
        setCommunities(Array.isArray(rawCommunities) ? rawCommunities : []);
      };
      syncCommunities();
      const interval = setInterval(syncCommunities, 3000);
      return () => clearInterval(interval);
    }, []);

    const handleCoordinatorApprove = (communityId: string, isApproved: boolean) => {
      const updatedComms = communities.map(c => {
        if (c.id === communityId) {
          return { ...c, status: isApproved ? 'APPROVED' : 'REJECTED' };
        }
        return c;
      });
      setCommunities(updatedComms);
      localStorage.setItem('communities', JSON.stringify(updatedComms));
      safeSet('bme_communities', updatedComms);
      alert(isApproved ? 'Phê duyệt nhóm thành công! Nhóm đã được kích hoạt.' : 'Đã từ chối cấp phép nhóm!');
    };

    const pendingComms = communities.filter(c => c.status === 'PENDING_APPROVAL');

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
        <h3 className="text-xl font-bold text-green-600 mb-4">TRUNG TÂM PHÊ DUYỆT KHỞI TẠO NHÓM</h3>
        {pendingComms.length === 0 ? (
          <p className="text-gray-500">Không có nhóm nào đang chờ duyệt.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-3 font-bold text-gray-700">Tên nhóm</th>
                  <th className="p-3 font-bold text-gray-700">Mô tả</th>
                  <th className="p-3 font-bold text-gray-700">SĐT người tạo</th>
                  <th className="p-3 font-bold text-gray-700 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingComms.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">{c.name}</td>
                    <td className="p-3 text-sm text-gray-600">{c.description || 'Không có mô tả'}</td>
                    <td className="p-3 text-sm text-gray-600">{c.creatorPhone || 'Chưa rõ'}</td>
                    <td className="p-3 text-center space-x-2 whitespace-nowrap">
                      <button onClick={() => handleCoordinatorApprove(c.id, true)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-bold">Phê duyệt</button>
                      <button onClick={() => handleCoordinatorApprove(c.id, false)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-bold">Từ chối</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const SupervisorPanel = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [comms, setComms] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [activeAnalytics, setActiveAnalytics] = useState<string | null>(null);

    useEffect(() => {
      setUsers(safeGet('bme_users', []));
      setPosts(safeGet('bme_posts', []));
      setComms(safeGet('bme_communities', []));
      setStores(safeGet('bme_stores', []));
      setOrders(safeGet('bme_orders', []));
    }, []);

    const handleDeletePost = (id: string) => {
      const next = posts.filter(p => p.id !== id);
      setPosts(next); safeSet('bme_posts', next); showToast('Đã xóa bài đăng vi phạm', 'success');
    };
    const handleDeleteComm = (id: string) => {
      const next = comms.filter(c => c.id !== id);
      setComms(next); safeSet('bme_communities', next); showToast('Đã xóa nhóm vi phạm', 'success');
    };
    const handleDeleteUser = (id: string) => {
      const next = users.filter(u => u.id !== id);
      setUsers(next); safeSet('bme_users', next); showToast('Đã xóa tài khoản vi phạm', 'success');
    };

    const largestComm = [...comms].sort((a,b) => (b.members?.length||0) - (a.members?.length||0))[0];
    const mostActiveComm = [...comms].sort((a,b) => (b.groupPosts?.length||0) - (a.groupPosts?.length||0))[0];
    const topStore = [...stores].sort((a,b) => (b.rating||0) - (a.rating||0))[0];
    
    const salesCount: Record<string, number> = orders.reduce((acc: any, o) => {
       acc[o.storeId] = (acc[o.storeId] || 0) + 1;
       return acc;
    }, {});
    const topSalesStoreId = Object.keys(salesCount).sort((a,b) => salesCount[b] - salesCount[a])[0];
    const topSalesStore = stores.find(s => s.id === topSalesStoreId);

    const activeGroupsCount = comms.filter((c: any) => {
      const status = String(c?.status || '').toUpperCase();
      return status === 'APPROVED' || status === 'ACTIVE' || status === '';
    }).length;
    const pendingGroupsCount = comms.filter((c: any) => String(c?.status || '').toUpperCase() === 'PENDING_APPROVAL').length;
    const rejectedGroupsCount = comms.filter((c: any) => String(c?.status || '').toUpperCase() === 'REJECTED').length;

    const postCategoryMap = posts.reduce((acc: Record<string, number>, p: any) => {
      const key = String(p?.category || 'Khác').trim() || 'Khác';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const postCategoryData = Object.keys(postCategoryMap)
      .map((name) => ({ name, count: postCategoryMap[name] }))
      .sort((a, b) => b.count - a.count);

    const topGroupsData = [...comms]
      .map((c: any) => ({
        id: c?.id,
        name: String(c?.name || 'Nhóm chưa đặt tên'),
        members: Array.isArray(c?.members) ? c.members.length : Number(c?.membersCount || 0)
      }))
      .sort((a, b) => b.members - a.members)
      .slice(0, 5);

    const merchantActiveCount = users.filter((u: any) => String(u?.role || '').toUpperCase() === 'BUSINESS' && String(u?.businessType || '').toUpperCase() === 'MERCHANT' && String(u?.status || '').toLowerCase() === 'active').length;
    const engineerActiveCount = users.filter((u: any) => String(u?.role || '').toUpperCase() === 'BUSINESS' && ['ENGINEER', 'TECHNICIAN'].includes(String(u?.businessType || '').toUpperCase()) && String(u?.status || '').toLowerCase() === 'active').length;
    const totalBusinessActive = merchantActiveCount + engineerActiveCount;

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 space-y-6">
        <h3 className="text-xl font-bold text-indigo-600 mb-4 flex items-center gap-2"><Shield size={24}/> Giám Sát Hệ Thống Tối Cao</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveAnalytics('GROUPS')}
            className={`bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'GROUPS' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <h4 className="font-bold text-indigo-800 text-sm uppercase">Nhóm cộng đồng</h4>
            <p className="text-3xl font-black text-indigo-700 mt-2">{activeGroupsCount}</p>
            <p className="text-xs text-indigo-600 mt-1">Chờ duyệt: {pendingGroupsCount} • Từ chối: {rejectedGroupsCount}</p>
          </div>
          <div
            onClick={() => setActiveAnalytics('POSTS')}
            className={`bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'POSTS' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <h4 className="font-bold text-blue-800 text-sm uppercase">Tần suất bài đăng</h4>
            <p className="text-3xl font-black text-blue-700 mt-2">{posts.length}</p>
            <p className="text-xs text-blue-600 mt-1">{postCategoryData.length} danh mục đang hoạt động</p>
          </div>
          <div
            onClick={() => setActiveAnalytics('TOP_GROUPS')}
            className={`bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'TOP_GROUPS' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <h4 className="font-bold text-amber-800 text-sm uppercase">Top nhóm nổi bật</h4>
            <p className="text-lg font-black text-amber-700 mt-2 truncate">{largestComm?.name || 'N/A'}</p>
            <p className="text-xs text-amber-600 mt-1">{largestComm?.members?.length || 0} thành viên</p>
          </div>
          <div
            onClick={() => setActiveAnalytics('BUSINESS')}
            className={`bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${activeAnalytics === 'BUSINESS' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <h4 className="font-bold text-emerald-800 text-sm uppercase">Business hoạt động</h4>
            <p className="text-3xl font-black text-emerald-700 mt-2">{totalBusinessActive}</p>
            <p className="text-xs text-emerald-600 mt-1">Merchant: {merchantActiveCount} • Engineer: {engineerActiveCount}</p>
          </div>
        </div>

        {activeAnalytics !== null && (
          <div className="bg-white p-6 rounded-xl shadow-inner mt-6 border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-gray-800 text-lg">Bảng phân tích chi tiết</h4>
              <button onClick={() => setActiveAnalytics(null)} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold">Đóng phân tích</button>
            </div>

            {activeAnalytics === 'GROUPS' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">So sánh số lượng nhóm theo trạng thái vận hành.</p>
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
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${item.color}`} style={{ width: `${width}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeAnalytics === 'POSTS' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Phân tích tổng số bài đăng theo từng danh mục.</p>
                {postCategoryData.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu bài đăng.</p>
                ) : (
                  postCategoryData.map((item) => {
                    const maxCount = Math.max(...postCategoryData.map((d) => d.count), 1);
                    const width = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={item.name}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">{item.name}</span><span className="font-bold text-gray-800">{item.count}</span></div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${width}%` }} /></div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeAnalytics === 'TOP_GROUPS' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Xếp hạng 5 nhóm có số lượng thành viên cao nhất.</p>
                {topGroupsData.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu cộng đồng.</p>
                ) : (
                  topGroupsData.map((item, idx) => {
                    const maxMembers = Math.max(...topGroupsData.map((d) => d.members), 1);
                    const width = Math.round((item.members / maxMembers) * 100);
                    return (
                      <div key={item.id || item.name}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">#{idx + 1} {item.name}</span><span className="font-bold text-gray-800">{item.members} TV</span></div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${width}%` }} /></div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeAnalytics === 'BUSINESS' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Tỷ trọng giữa Merchant và Engineer đang hoạt động.</p>
                {[
                  { label: 'MERCHANT', value: merchantActiveCount, color: 'bg-emerald-500' },
                  { label: 'ENGINEER', value: engineerActiveCount, color: 'bg-cyan-500' }
                ].map((item) => {
                  const total = Math.max(totalBusinessActive, 1);
                  const percent = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">{item.label}</span><span className="font-bold text-gray-800">{item.value} ({percent}%)</span></div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${item.color}`} style={{ width: `${percent}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div>
           <h4 className="font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2"><Settings size={20}/> Công Cụ Kiểm Tra Chéo Toàn Sàn</h4>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="border border-red-100 rounded-xl p-3 bg-red-50/30 h-72 flex flex-col">
                 <h5 className="font-bold text-sm mb-3 text-red-600">Bài đăng vi phạm</h5>
                 <div className="flex-1 overflow-y-auto space-y-2">
                   {posts.length === 0 && <p className="text-xs text-gray-500 italic">Trống</p>}
                   {posts.map(p => (
                     <div key={p.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg shadow-sm border border-red-100 text-xs hover:border-red-300 transition">
                       <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-gray-800 truncate">{p.author}</p>
                          <p className="text-gray-500 truncate" title={p.content}>{p.content}</p>
                       </div>
                       <button onClick={() => handleDeletePost(p.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded transition"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
              </div>
              <div className="border border-orange-100 rounded-xl p-3 bg-orange-50/30 h-72 flex flex-col">
                 <h5 className="font-bold text-sm mb-3 text-orange-600">Nhóm cộng đồng</h5>
                 <div className="flex-1 overflow-y-auto space-y-2">
                   {comms.length === 0 && <p className="text-xs text-gray-500 italic">Trống</p>}
                   {comms.map(c => (
                     <div key={c.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg shadow-sm border border-orange-100 text-xs hover:border-orange-300 transition">
                       <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-gray-800 truncate">{c.name}</p>
                          <p className="text-gray-500">Trạng thái: {c.status}</p>
                       </div>
                       <button onClick={() => handleDeleteComm(c.id)} className="text-orange-500 hover:text-white hover:bg-orange-500 p-1.5 rounded transition"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
              </div>
              <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/30 h-72 flex flex-col">
                 <h5 className="font-bold text-sm mb-3 text-purple-600">Tài khoản User / Đối tác</h5>
                 <div className="flex-1 overflow-y-auto space-y-2">
                   {users.length === 0 && <p className="text-xs text-gray-500 italic">Trống</p>}
                   {users.map(u => (
                     <div key={u.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg shadow-sm border border-purple-100 text-xs hover:border-purple-300 transition">
                       <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-gray-800 truncate">{u.name}</p>
                          <p className="text-gray-500 truncate">{u.phone} • {u.role}</p>
                       </div>
                       <button onClick={() => handleDeleteUser(u.id)} className="text-purple-500 hover:text-white hover:bg-purple-500 p-1.5 rounded transition"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderSpecialPanel = () => {
    if (!currentUser) return null;
    const normalizePhone = (value: any) => String(value || '').replace(/\D/g, '');
    const normalizedPhone = normalizePhone(currentUser.phone);
    const isCoordinatorAccount = normalizedPhone === '0977777777' || normalizedPhone === '84977777777' || String(currentUser.role || '').toLowerCase() === 'coordinator';
    switch (currentUser.phone) {
      case '0123456789': // Admin
        return <AdminPanel />;
      case '0977777777': // Coordinator
        return <CoordinatorPanel />;
      case '0988888888': // Supervisor
        return <SupervisorPanel />;
      default:
        if (isCoordinatorAccount) return <CoordinatorPanel />;
        return null;
    }
  };

  const normalizePhone = (value: any) => String(value || '').replace(/\D/g, '');
  const normalizedPhone = normalizePhone(currentUser?.phone);
  const roleNorm = String(userRole || currentUser?.role || '').toLowerCase();
  const isAdminRole = roleNorm === 'admin';
  const isSupervisorRole = roleNorm === 'supervisor';
  const isIsolatedRole = isAdminRole || isSupervisorRole;
  const isCoordinatorAccount = normalizedPhone === '0977777777' || normalizedPhone === '84977777777' || roleNorm === 'coordinator';
  const canPostBanner = currentUser && (normalizedPhone === '0123456789' || isCoordinatorAccount || ['admin', 'coordinator'].includes(roleNorm));
  const roleUpper = String(currentUser?.role || '').toUpperCase();
  const businessTypeUpperRaw = String(currentUser?.businessType || '').toUpperCase();
  const businessTypeUpper = businessTypeUpperRaw === 'TECHNICIAN' ? 'ENGINEER' : businessTypeUpperRaw;
  const isStrictMerchant = roleUpper === 'BUSINESS' && businessTypeUpper === 'MERCHANT';
  const isStrictEngineer = roleUpper === 'BUSINESS' && businessTypeUpper === 'ENGINEER';

  if (isIsolatedRole) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{isAdminRole ? 'Bảng điều khiển Admin' : 'Thanh tra Hệ thống'}</h2>
          <p className="text-gray-600 mt-1">Giao diện đã được cách ly, chỉ hiển thị dashboard quản trị và hồ sơ bảo mật.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentTab(isAdminRole ? 'ADMIN_DASHBOARD' : 'SUPERVISOR_DASHBOARD')}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-bme-primary hover:shadow-md transition"
          >
            <p className="text-lg font-bold text-gray-800">{isAdminRole ? 'Bảng điều khiển Admin' : 'Thanh tra Hệ thống'}</p>
            <p className="text-sm text-gray-600 mt-2">{isAdminRole ? 'Quản lý vận hành, tin nhắn và cấp lại mật khẩu.' : 'Thanh tra hệ thống, kiểm soát và xử lý vi phạm.'}</p>
          </button>
          <button
            onClick={() => setCurrentTab('PROFILE')}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-bme-primary hover:shadow-md transition"
          >
            <p className="text-lg font-bold text-gray-800">Hồ sơ bảo mật</p>
            <p className="text-sm text-gray-600 mt-2">Trang thông tin tài khoản quản trị và bảo mật cá nhân.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. BANNER NỔI BẬT LƯỚT NGANG */}
      <div>
        {canPostBanner && (
          <div className="mb-4">
            <button onClick={() => setShowAddBannerForm(!showAddBannerForm)} className="bg-bme-primary hover:bg-bme-secondary text-white font-bold px-4 py-2 rounded-lg shadow-sm transition">
              {showAddBannerForm ? '[-] Đóng form' : '[+] Đăng bản tin y tế'}
            </button>
          </div>
        )}
        {showAddBannerForm && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 animate-fade-in">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Tạo bản tin lướt ngang</h3>
            <input type="text" placeholder="Tiêu đề bản tin..." className="w-full p-2 border border-gray-300 rounded mb-3 outline-none focus:border-bme-primary" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} />
            <input type="text" placeholder="Mô tả ngắn..." className="w-full p-2 border border-gray-300 rounded mb-3 outline-none focus:border-bme-primary" value={newBanner.desc} onChange={e => setNewBanner({...newBanner, desc: e.target.value})} />
            <input type="file" accept="image/*" className="w-full p-2 border border-gray-300 rounded mb-4 outline-none focus:border-bme-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleFileUpload} />
            {mediaBase64 && (
              <div className="mb-4 border border-gray-200 rounded p-2 bg-gray-50">
                <img src={mediaBase64} alt="Preview banner" className="h-16 w-16 object-cover rounded" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleAddBanner} className="bg-green-600 hover:bg-green-700 transition text-white px-6 py-2 rounded font-bold">Đăng lên Banner</button>
              <button onClick={() => { setShowAddBannerForm(false); setMediaBase64(null); }} className="bg-gray-200 hover:bg-gray-300 transition text-gray-700 px-6 py-2 rounded font-bold">Hủy</button>
            </div>
          </div>
        )}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 w-full h-full flex overflow-hidden">
          {Array.isArray(bannerItems) && bannerItems.map((item, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8">
                <h2 className="text-white text-3xl md:text-4xl font-bold">{item.title}</h2>
                <p className="text-white/80 mt-2 max-w-lg">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={prevSlide} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100 z-10">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100 z-10">
          <ChevronRight size={24} />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {Array.isArray(bannerItems) && bannerItems.map((_, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${currentSlide === i ? 'bg-white w-6' : 'bg-white/50'}`} />
            ))}
        </div>
      </div>
      </div>

      {/* 2. LƯỚI KHỐI CHỨC NĂNG TRUNG TÂM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div onClick={() => setCurrentTab('FEED')} className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-bme-primary to-bme-secondary p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex flex-col justify-center text-white group h-full">
          <LayoutGrid size={40} className="mb-3 text-white/80 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold uppercase">CỘNG ĐỒNG Y SINH</h3>
          <p className="mt-1 opacity-80">Khám phá bài viết, thảo luận và chia sẻ tài liệu chuyên môn.</p>
        </div>
      {!isCoordinatorAccount && (
          <div onClick={() => { setViewingStoreId(null); setCurrentTab('MARKET'); }} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-center text-gray-800 border border-gray-200 group">
            <ShoppingCart size={40} className="mb-3 text-bme-primary group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold uppercase">CHỢ THIẾT BỊ Y TẾ</h3>
            <p className="mt-1 text-gray-600">Mua sắm thiết bị & linh kiện y tế từ các nhà cung cấp.</p>
          </div>
        )}
        <div onClick={() => setCurrentTab('EMERGENCY')} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-center text-gray-800 border border-gray-200 group">
          <AlertCircle size={40} className="mb-3 text-red-500 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold">Khẩn cấp</h3>
          <p className="mt-1 text-gray-600">Tìm kỹ thuật viên sửa chữa gần nhất.</p>
        </div>
      {!isCoordinatorAccount && !isStrictMerchant && (
        <div onClick={() => setCurrentTab('SERVICES')} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-center text-gray-800 border border-gray-200 group">
          <Wrench size={40} className="mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold uppercase">DỊCH VỤ SỬA CHỮA</h3>
          <p className="mt-1 text-gray-600">Tìm chuyên gia và kỹ sư sửa chữa chuyên nghiệp.</p>
        </div>
      )}
      {isStrictMerchant && (
        <div onClick={() => { setViewingStoreId(null); setCurrentTab('MERCHANT_PRIVATE_STORE'); }} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-center text-gray-800 border border-blue-200 group">
          <Store size={40} className="mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold uppercase">QUẢN LÝ GIAN HÀNG RIÊNG</h3>
          <p className="mt-1 text-gray-600">Khu vực độc quyền Merchant để quản lý kho và đơn hàng.</p>
        </div>
      )}
      {isStrictEngineer && (
        <div onClick={() => setCurrentTab('ENGINEER_SERVICE_MGMT')} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-center text-gray-800 border border-green-200 group">
          <Wrench size={40} className="mb-3 text-green-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold uppercase">QUẢN LÝ DỊCH VỤ KỸ SƯ</h3>
          <p className="mt-1 text-gray-600">Khai báo hồ sơ năng lực và xuất bản dịch vụ sửa chữa.</p>
        </div>
      )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <h3 className="text-xl font-bold text-gray-800">Quản lý thiết bị của tôi</h3>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">Số hóa nhật ký thiết bị</span>
        </div>

        {!currentUser?.phone ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <p className="text-gray-600 font-medium">Vui lòng đăng nhập để khai báo thiết bị và theo dõi lịch bảo dưỡng định kỳ.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <input
                value={deviceForm.machineName}
                onChange={(e) => setDeviceForm({ ...deviceForm, machineName: e.target.value })}
                placeholder="Tên máy y tế"
                className="p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary"
              />
              <input
                value={deviceForm.brand}
                onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })}
                placeholder="Hãng sản xuất"
                className="p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary"
              />
              <input
                type="date"
                value={deviceForm.purchaseDate}
                onChange={(e) => setDeviceForm({ ...deviceForm, purchaseDate: e.target.value })}
                className="p-2.5 border border-gray-300 rounded-lg outline-none focus:border-bme-primary"
              />
              <button
                onClick={handleAddDevice}
                className="bg-bme-primary hover:bg-bme-secondary text-white font-bold rounded-lg px-4 py-2.5 transition"
              >
                Lưu thiết bị
              </button>
            </div>

            <div className="space-y-3">
              {myDevices.length === 0 ? (
                <div className="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-xl">Chưa có thiết bị nào trong nhật ký.</div>
              ) : (
                myDevices.map((device: any) => {
                  const status = getMaintenanceStatus(device?.purchaseDate);
                  return (
                    <div key={device?.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-800">{device?.machineName}</p>
                        <p className="text-sm text-gray-600 mt-1">Hãng: {device?.brand} • Ngày mua: {device?.purchaseDate}</p>
                      </div>
                      <div className={`px-3 py-2 rounded-lg border text-sm font-bold ${status.color}`}>
                        {status.label} - {status.dueText}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* 3. KHU VỰC QUẢN TRỊ ĐẶC BIỆT */}
      {renderSpecialPanel()}
    </div>
  );
};

export default function BmeStationeryApp() {
  type ChatMessage = {
    id: string;
    senderPhone: string;
    receiverPhone: string;
    text: string;
    timestamp: number;
  };

  type ChatContact = {
    phone: string;
    name: string;
    role: string;
    avatar: string;
    preview: string;
    lastTimestamp: number;
  };

  // 1. STATE QUẢN LÝ ĐIỀU HƯỚNG MÀN HÌNH CHÍNH
  const [currentTab, setCurrentTab] = useState('HOME');
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const [floatingChatInput, setFloatingChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  
  // 2. STATE GIAO DIỆN & TÀI KHOẢN
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'user'|'business'|'coordinator'|'supervisor'|'admin'>('user');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const normalizeRoleForState = (value: any): 'user' | 'business' | 'coordinator' | 'supervisor' | 'admin' => {
    const role = String(value || 'user').toLowerCase();
    if (role === 'admin' || role === 'supervisor' || role === 'coordinator' || role === 'business' || role === 'user') {
      return role as 'user' | 'business' | 'coordinator' | 'supervisor' | 'admin';
    }
    return 'user';
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

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
  const cartRef = useRef<HTMLDivElement>(null);

  // State phục vụ tìm kiếm thông minh
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState({ linhKien: [] as any[], thietBi: [] as any[], files: [] as any[] });

  const getDefaultTabByRole = (user: any) => {
    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return 'ADMIN_DASHBOARD';
    if (role === 'SUPERVISOR') return 'SUPERVISOR_DASHBOARD';
    return 'HOME';
  };

  // 4. STATE CHO CHỢ THIẾT BỊ (MARKET) TÍCH HỢP TRỰC TIẾP ĐỂ TRÁNH LỖI UNDEFINED COMPONENT
  const [marketSearch, setMarketSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState('Tất cả');

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
        { id: 'u_coor', name: 'Coordinator', phone: '0977777777', password: 'admin', role: 'coordinator', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_biz', name: 'Cửa Hàng Thiết Bị Y Sinh Yvj8', phone: '0966666666', password: 'admin', role: 'business', businessType: 'merchant', taxId: 'MST_BIZ', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_tech', name: 'Kỹ Sư Sửa Chữa', phone: '0922222222', password: 'admin', role: 'business', businessType: 'engineer', taxId: 'MST_TECH', status: 'active', isOnline: false, lastActive: Date.now() },
        { id: 'u_user', name: 'Nguyễn Văn Người Dùng', phone: '0955555555', password: 'admin', role: 'user', status: 'active', isOnline: false, lastActive: Date.now() }
      ];

      // Hàm kiểm tra và nạp tự động (Tránh trống hệ thống)
      let currentUsers = safeGet('bme_users', []);
      if (!Array.isArray(currentUsers)) currentUsers = [];
      
      let isUsersUpdated = false;

      currentUsers = currentUsers.map((u: any) => {
        if (String(u?.role || '').toLowerCase() !== 'business') return u;
        const legacyType = String(u?.businessType || '').toLowerCase();
        let mappedType = legacyType;
        if (legacyType === 'technician' || legacyType === 'tech') mappedType = 'engineer';
        if (legacyType === 'seller' || legacyType === 'shop' || legacyType === 'store') mappedType = 'merchant';
        if (!legacyType) mappedType = 'merchant';
        if (mappedType !== legacyType) {
          isUsersUpdated = true;
          return { ...u, businessType: mappedType };
        }
        return u;
      });

      requiredUsers.forEach(ru => {
        const foundIndex = currentUsers.findIndex((u: any) => u.phone === ru.phone);
        if (foundIndex === -1) {
          currentUsers.push(ru);
          isUsersUpdated = true;
        } else {
              // Bắt buộc khôi phục tên, mật khẩu và quyền chuẩn nếu ai đó cố tình sửa sai
              if (currentUsers[foundIndex].password !== ru.password || currentUsers[foundIndex].role !== ru.role || currentUsers[foundIndex].name !== ru.name) {
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
          { id: 'p_1', authorId: 'u_coor', author: 'Coordinator', content: 'Chia sẻ: Cách reset lỗi E-04 trên máy siêu âm Mindray.', time: new Date().toLocaleString(), category: 'Chia sẻ kiến thức', likes: 12, comments: 0, replies: [], status: 'active' },
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
        safeSet('adminNotifications', []);
        safeSet('bme_admin_notifications', []);
        safeSet('adminChangeRequests', []);
        safeSet('bme_admin_change_requests', []);
        localStorage.setItem('bme_init_v3', 'true');
      }
      refreshUserState();
      
      const handleAddToCartEvent = (e: any) => handleAddToCart(e.detail);
      const handleOpenChatEvent = (e: any) => { setChatTarget(e.detail); setCurrentTab('MESSAGES'); setIsMenuOpen(false); };
      const handleViewProfileEvent = (e: any) => { setViewingUserId(e.detail); setCurrentTab('PROFILE'); setIsMenuOpen(false); };
      const handleOpenStoreEvent = (e: any) => { setViewingStoreId(e.detail); setCurrentTab('STORE'); setIsMenuOpen(false); };
      const handleProfileUpdate = (e: any) => setCurrentUser(e.detail);
      const handleGoHomeEvent = () => { setCurrentTab('HOME'); setIsMenuOpen(false); };

      document.addEventListener('addToCart', handleAddToCartEvent);
      document.addEventListener('openChat', handleOpenChatEvent);
      document.addEventListener('viewProfile', handleViewProfileEvent);
      document.addEventListener('openStore', handleOpenStoreEvent);
      window.addEventListener('bme-profile-updated', handleProfileUpdate);
      window.addEventListener('bme-go-home', handleGoHomeEvent);
      
      const interval = setInterval(() => {
        setCartItems(safeGet('bme_cart', []));
        
        // Tính toán số lượng mục đang chờ duyệt (Cộng đồng + Gian hàng) theo Real-time để gắn Badge đỏ
        const comms = safeGet('bme_communities', []);
        const storesList = safeGet('bme_stores', []);
        let pCount = 0;
        if (Array.isArray(comms)) pCount += comms.filter((c:any) => c.status === 'PENDING_APPROVAL').length;
        if (Array.isArray(storesList)) pCount += storesList.filter((s:any) => s.status === 'PENDING_APPROVAL').length;
        setPendingCommCount(pCount);

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
        window.removeEventListener('bme-profile-updated', handleProfileUpdate);
        window.removeEventListener('bme-go-home', handleGoHomeEvent);
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
        setUserRole(normalizeRoleForState(latestUser ? latestUser.role : cur.role)); 
        setCurrentUser(latestUser || cur);
        if (latestUser) {
          safeSet('bme_users', users.map((u:any) => u.id === cur.id ? {...u, isOnline: true, lastActive: Date.now()} : u));
        }
      }
    }
  };

  // Tự động đóng Menu Giỏ hàng (Sự kiện CLICK OUTSIDE an toàn)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const roleNorm = String(userRole || currentUser?.role || '').toLowerCase();
    if (roleNorm === 'admin') {
      const allowedAdminTabs = ['ADMIN_DASHBOARD', 'PROFILE', 'MY_PROFILE'];
      if (!allowedAdminTabs.includes(currentTab)) {
        setCurrentTab('ADMIN_DASHBOARD');
      }
      return;
    }
    if (roleNorm === 'supervisor') {
      const allowedSupervisorTabs = ['SUPERVISOR_DASHBOARD', 'PROFILE', 'MY_PROFILE'];
      if (!allowedSupervisorTabs.includes(currentTab)) {
        setCurrentTab('SUPERVISOR_DASHBOARD');
      }
    }
  }, [isLoggedIn, currentUser, userRole, currentTab]);


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
    setCurrentTab('HOME');
    setIsMenuOpen(false);
    setCartItems([]);
    setNotifications([]);
    setChatTarget(null);
    setIsChatBoxOpen(false);
    setActiveChat(null);
    setFloatingChatInput('');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('chatMessages');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        const normalized = parsed.filter((msg: any) => msg && msg.senderPhone && msg.receiverPhone && typeof msg.text === 'string').map((msg: any) => ({
          id: String(msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
          senderPhone: String(msg.senderPhone),
          receiverPhone: String(msg.receiverPhone),
          text: String(msg.text),
          timestamp: Number(msg.timestamp || Date.now())
        }));
        setChatMessages(normalized);
      } else {
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Không thể đọc chatMessages từ localStorage:', error);
      setChatMessages([]);
    }
  }, [currentUser?.phone]);

  const allUsersForChat = safeGet('bme_users', []);
  const usersForChat = Array.isArray(allUsersForChat) ? allUsersForChat : [];
  const currentPhone = String(currentUser?.phone || '');

  const chatContacts: ChatContact[] = (() => {
    if (!currentPhone) return [];

    const userByPhone = new Map<string, any>();
    usersForChat.forEach((user: any) => {
      if (user?.phone) userByPhone.set(String(user.phone), user);
    });

    const phoneSet = new Set<string>();
    chatMessages.forEach((msg) => {
      if (msg.senderPhone === currentPhone && msg.receiverPhone) {
        phoneSet.add(String(msg.receiverPhone));
      }
      if (msg.receiverPhone === currentPhone && msg.senderPhone) {
        phoneSet.add(String(msg.senderPhone));
      }
    });

    const contactsFromHistory = Array.from(phoneSet).filter((phone) => phone !== currentPhone).map((phone) => {
      const info = userByPhone.get(phone);
      const latestMsg = chatMessages
        .filter((msg) =>
          (msg.senderPhone === currentPhone && msg.receiverPhone === phone) ||
          (msg.senderPhone === phone && msg.receiverPhone === currentPhone)
        )
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      return {
        phone,
        name: String(info?.name || `Liên hệ ${phone}`),
        role: String(info?.role || 'user').toUpperCase(),
        avatar: `https://i.pravatar.cc/100?u=${phone}`,
        preview: latestMsg?.text || 'Bắt đầu cuộc trò chuyện',
        lastTimestamp: Number(latestMsg?.timestamp || 0)
      };
    });

    if (contactsFromHistory.length > 0) {
      return contactsFromHistory.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    }

    const businessSuggestions = usersForChat
      .filter((user: any) => String(user?.phone || '') !== currentPhone && String(user?.role || '').toLowerCase() === 'business')
      .slice(0, 3);

    const fallbackPool = usersForChat.filter((user: any) => String(user?.phone || '') !== currentPhone);
    const fallbackSuggestions = [...businessSuggestions];

    for (const user of fallbackPool) {
      if (fallbackSuggestions.length >= 3) break;
      const exists = fallbackSuggestions.some((item: any) => String(item?.phone || '') === String(user?.phone || ''));
      if (!exists) fallbackSuggestions.push(user);
    }

    return fallbackSuggestions.map((user: any) => {
      const phone = String(user?.phone || '');
      return {
        phone,
        name: String(user?.name || `Liên hệ ${phone}`),
        role: String(user?.role || 'user').toUpperCase(),
        avatar: `https://i.pravatar.cc/100?u=${phone}`,
        preview: 'Bắt đầu cuộc trò chuyện',
        lastTimestamp: 0
      };
    });
  })();

  useEffect(() => {
    if (!currentUser) {
      setActiveChat(null);
      return;
    }
    if (!Array.isArray(chatContacts) || chatContacts.length === 0) {
      setActiveChat(null);
      return;
    }
    const stillExists = activeChat && chatContacts.some((contact) => contact.phone === activeChat.phone);
    if (!stillExists) {
      setActiveChat(chatContacts[0]);
    }
  }, [currentUser, chatContacts, activeChat]);

  const activeConversationMessages: ChatMessage[] = (() => {
    if (!currentUser?.phone || !activeChat?.phone) return [];
    return chatMessages
      .filter((msg) =>
        (msg.senderPhone === currentUser.phone && msg.receiverPhone === activeChat.phone) ||
        (msg.senderPhone === activeChat.phone && msg.receiverPhone === currentUser.phone)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  })();

  const incomingChatCount = currentUser?.phone
    ? chatMessages.filter((msg) => msg.receiverPhone === currentUser.phone).length
    : 0;

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
      setCurrentTab('HOME');
    }
    setShowSearchDropdown(false);
  };

  const handleSendFloatingMessage = () => {
    const message = floatingChatInput.trim();
    if (!message || !currentUser?.phone || !activeChat?.phone) return;
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      senderPhone: String(currentUser.phone),
      receiverPhone: String(activeChat.phone),
      text: message,
      timestamp: Date.now()
    };
    const nextMessages = [...chatMessages, newMessage];
    setChatMessages(nextMessages);
    try {
      localStorage.setItem('chatMessages', JSON.stringify(nextMessages));
    } catch (error) {
      console.error('Không thể lưu chatMessages xuống localStorage:', error);
    }
    setFloatingChatInput('');
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
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition" onClick={() => { setShowSearchDropdown(false); setCurrentTab('HOME'); setTimeout(()=> {
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
                onClick={() => setCurrentTab('HOME')}
              >
                ⚕️ BME <span className="text-red-400">STATIONERY</span>
              </div>

              {/* NÚT QUAY LẠI THÔNG MINH */}
              {currentTab !== 'HOME' && !['ADMIN_DASHBOARD', 'SUPERVISOR_DASHBOARD'].includes(currentTab) ? (
                <button
                  onClick={() => {
                    if (currentTab === 'STORE' || currentTab === 'MARKET') {
                      if (viewingStoreId) setViewingStoreId(null);
                      else setCurrentTab('HOME');
                    } else if (currentTab === 'PROFILE' || currentTab === 'MY_PROFILE') {
                      if (viewingUserId) { setViewingUserId(null); setCurrentTab('HOME'); }
                      else setCurrentTab('HOME');
                    } else {
                      setCurrentTab('HOME');
                    }
                  }}
                  className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-full transition font-bold text-sm sm:text-base border border-white/20"
                  title="Quay lại"
                >
                  <ChevronLeft size={20} />
                  <span className="hidden sm:inline">Quay lại</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentTab('HOME')}
                  className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-full transition font-bold text-sm sm:text-base border border-white/20"
                  title="Trang chủ"
                >
                  <Home size={18} />
                  <span className="hidden sm:inline">Trang chủ</span>
                </button>
              )}
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

              {currentUser && (
                <button
                  onClick={() => setIsChatBoxOpen(!isChatBoxOpen)}
                  className="relative bg-white hover:bg-blue-100 text-gray-600 rounded-full p-2 transition-colors"
                  title="Tin nhắn nhanh"
                >
                  <MessageCircle size={20} />
                  {incomingChatCount > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                  )}
                </button>
              )}

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
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={() => {
                      setViewingUserId(currentUser?.id || null);
                      setCurrentTab('PROFILE');
                    }}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-full transition font-bold text-sm sm:text-base"
                  >
                    <Avatar src={currentUser?.avatar} name={currentUser?.name} size={24} userId={currentUser?.id} />
                    <span className="hidden sm:inline">Tài khoản</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-white hover:text-red-200 transition p-2"
                    title="Đăng xuất"
                  >
                    <LogOut size={20} />
                  </button>
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
            MAIN VIEW CONTENT
            ============================================= */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            {/* View Title (Hide on HOME) */}
            {currentTab !== 'HOME' && ( // Ẩn tiêu đề ở trang chủ để banner nổi bật hơn
            <div className="mb-6 animate-slide-in-down max-w-6xl mx-auto p-4 lg:p-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">
                {currentTab === 'ADMIN_DASHBOARD' && '🛡️ Bảng điều khiển Admin'}
                {currentTab === 'SUPERVISOR_DASHBOARD' && '🧭 Thanh tra Hệ thống'}
                {currentTab === 'FEED' && '📋 CỘNG ĐỒNG Y SINH'}
                {currentTab === 'MARKET' && '🛒 Chợ thiết bị y tế'}
                {currentTab === 'SERVICES' && '🛠️ Dịch vụ sửa chữa chuyên gia'}
                {currentTab === 'MERCHANT_PRIVATE_STORE' && '🏪 Quản lý gian hàng riêng'}
                {currentTab === 'ENGINEER_SERVICE_MGMT' && '🧰 Quản lý dịch vụ kỹ sư'}
                {currentTab === 'EMERGENCY' && '🚨 Tìm kiếm khẩn cấp'}
                {/* {currentTab === 'COMMUNITY' && '👥 Cộng đồng & Tài liệu'} */}
                {currentTab === 'STORE' && '🏪 CỬA HÀNG'}
                {currentTab === 'ADMIN' && '⚙️ Dashboard quản trị'}
                {currentTab === 'SAVED_POSTS' && '🔖 Mục đã lưu'}
                {currentTab === 'PROFILE' && '👤 Hồ sơ'}
                {currentTab === 'MY_PROFILE' && '👤 Hồ sơ'}
                {currentTab === 'SETTINGS' && '⚙️ Cài đặt tài khoản'}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentTab === 'ADMIN_DASHBOARD' && 'Khu vực điều hành quản trị, tin nhắn hệ thống và cấp lại mật khẩu.'}
                {currentTab === 'SUPERVISOR_DASHBOARD' && 'Khu vực thanh tra hệ thống, kiểm tra và xử lý vi phạm.'}
                {currentTab === 'FEED' && 'Khám phá bài viết mới, tin tức y sinh và cơ hội kinh doanh'}
                {currentTab === 'MARKET' && 'Tìm kiếm, so sánh và mua sắm các sản phẩm y tế'}
                {currentTab === 'SERVICES' && 'Duyệt các gói dịch vụ sửa chữa từ các kỹ sư chuyên nghiệp'}
                {currentTab === 'MERCHANT_PRIVATE_STORE' && 'Không gian độc quyền cho Business Merchant quản lý gian hàng và kho'}
                {currentTab === 'ENGINEER_SERVICE_MGMT' && 'Không gian độc quyền cho Business Engineer quản lý dịch vụ kỹ thuật'}
                {currentTab === 'EMERGENCY' && 'Tìm kỹ thuật viên & cửa hàng gần nhất để xử lý sự cố'}
                {currentTab === 'MESSAGES' && 'Trò chuyện trực tiếp với Khách hàng và Doanh nghiệp'}
                {currentTab === 'STORE' && 'Duyệt các cửa hàng và sản phẩm y tế'}
                {currentTab === 'ADMIN' && 'Bảng điều khiển dành riêng cho Quản trị viên và Chuyên gia'}
                {currentTab === 'COORDINATOR' && 'Khu vực xét duyệt và quản lý các cộng đồng y sinh'}
                {currentTab === 'SAVED_POSTS' && 'Danh sách các bài viết và tài liệu mà bạn đã lưu trữ'}
                {currentTab === 'PROFILE' && 'Trang thông tin cá nhân / Doanh nghiệp'}
                {currentTab === 'MY_PROFILE' && 'Trang thông tin cá nhân / Doanh nghiệp'}
                {currentTab === 'SETTINGS' && 'Quản lý thông tin cá nhân và bảo mật tài khoản'}
              </p>
            </div>
            )}

            {/* DÙNG SWITCH-CASE THÔNG MINH ĐỂ ĐIỀU HƯỚNG MÀN HÌNH CHÍNH */}
            <div className="animate-fade-in">
              {(() => {
                const normalizePhone = (value: any) => String(value || '').replace(/\D/g, '');
                const normalizedCurrentPhone = normalizePhone(currentUser?.phone);
                const roleNorm = String(userRole || currentUser?.role || '').toLowerCase();
                const isCoordinatorAccount = normalizedCurrentPhone === '0977777777' || normalizedCurrentPhone === '84977777777' || roleNorm === 'coordinator';
                switch(currentTab) {
                  case 'HOME':
                    return <HomeDashboard setCurrentTab={setCurrentTab} setViewingStoreId={setViewingStoreId} currentUser={currentUser} userRole={userRole} />;
                  case 'ADMIN_DASHBOARD':
                    if (roleNorm === 'admin') {
                      return <div className="max-w-6xl mx-auto p-4 lg:p-6"><AdminDashboard currentUser={currentUser} /></div>;
                    }
                    return (
                      <div className="max-w-6xl mx-auto p-4 lg:p-6"><div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                        <p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p>
                        <p className="text-yellow-700 mt-2">Mục này chỉ dành cho ADMIN.</p>
                      </div></div>
                    );
                  case 'SUPERVISOR_DASHBOARD':
                    if (roleNorm === 'supervisor') {
                      return <div className="max-w-6xl mx-auto p-4 lg:p-6"><AdminDashboard currentUser={currentUser} /></div>;
                    }
                    return (
                      <div className="max-w-6xl mx-auto p-4 lg:p-6"><div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                        <p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p>
                        <p className="text-yellow-700 mt-2">Mục này chỉ dành cho SUPERVISOR.</p>
                      </div></div>
                    );
                  case 'FEED': 
                    return <div className="max-w-6xl mx-auto p-4 lg:p-6"><CommunityFeedCorridor currentUser={currentUser} searchQuery={searchQuery} /></div>;
                  case 'MARKET':
                    return (
                      <div className="max-w-6xl mx-auto p-4 lg:p-6">
                        <StoreProfile currentUser={currentUser} viewingStoreId={viewingStoreId} setViewingStoreId={setViewingStoreId} mode="PUBLIC_MARKET" />
                      </div>
                    );
                  case 'STORE':
                    return (
                      <div className="max-w-6xl mx-auto p-4 lg:p-6">
                        <StoreProfile currentUser={currentUser} viewingStoreId={viewingStoreId} setViewingStoreId={setViewingStoreId} mode="PUBLIC_MARKET" />
                      </div>
                    );
              case 'MERCHANT_PRIVATE_STORE': {
                const strictMerchant = String(currentUser?.role || '').toUpperCase() === 'BUSINESS' && String(currentUser?.businessType || '').toUpperCase() === 'MERCHANT';
                if (!strictMerchant) {
                  return <div className="max-w-6xl mx-auto p-4 lg:p-6"><div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center"><p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p><p className="text-yellow-700 mt-2">Mục Quản lý gian hàng riêng chỉ dành cho BUSINESS MERCHANT.</p></div></div>;
                }
                return <div className="max-w-6xl mx-auto p-4 lg:p-6"><StoreProfile currentUser={currentUser} viewingStoreId={null} setViewingStoreId={setViewingStoreId} mode="MERCHANT_DASHBOARD" /></div>;
              }
              case 'SERVICES': {
                const isStrictMerchant = String(currentUser?.role || '').toUpperCase() === 'BUSINESS' && String(currentUser?.businessType || '').toUpperCase() === 'MERCHANT';
                if (isCoordinatorAccount) return <div className="max-w-6xl mx-auto p-10"><div className="bg-red-50 text-red-600 p-6 rounded-xl font-bold text-center border border-red-200">Khu vực này bị vô hiệu hóa đối với Điều phối viên.</div></div>;
                if (isStrictMerchant) {
                  return <div className="max-w-6xl mx-auto p-10"><div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl font-bold text-center border border-yellow-300">Tài khoản Merchant không sở hữu mục Quản lý dịch vụ kỹ sư.</div></div>;
                }
                    return <ServicesMarketplace currentUser={currentUser} />;
              }
              case 'ENGINEER_SERVICE_MGMT': {
                const strictEngineer = String(currentUser?.role || '').toUpperCase() === 'BUSINESS' && (String(currentUser?.businessType || '').toUpperCase() === 'ENGINEER' || String(currentUser?.businessType || '').toUpperCase() === 'TECHNICIAN');
                if (!strictEngineer) {
                  return <div className="max-w-6xl mx-auto p-4 lg:p-6"><div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center"><p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p><p className="text-yellow-700 mt-2">Mục Quản lý dịch vụ kỹ sư chỉ dành cho BUSINESS ENGINEER.</p></div></div>;
                }
                return <div className="max-w-6xl mx-auto p-4 lg:p-6"><ServicesMarketplace currentUser={currentUser} /></div>;
              }
                  case 'SAVED_POSTS': 
                    return <div className="max-w-6xl mx-auto p-4 lg:p-6"><HomeFeed searchQuery={searchQuery} currentUser={currentUser} savedOnly={true} /></div>;
                  case 'EMERGENCY': 
                    return <div className="max-w-6xl mx-auto p-4 lg:p-6"><MapView /></div>;
                  case 'MESSAGES':
                    return <div className="max-w-6xl mx-auto p-4 lg:p-6"><ChatCenter currentUser={currentUser} initialTarget={chatTarget} /></div>;
                  case 'PROFILE':
                  case 'MY_PROFILE': 
                    return viewingUserId ? <div className="max-w-6xl mx-auto p-4 lg:p-6"><UserProfile userId={viewingUserId} currentUser={currentUser} /></div> : null;
                  case 'SETTINGS':
                    return <div className="max-w-6xl mx-auto p-4 lg:p-6"><UserSettings currentUser={currentUser} /></div>;
                  case 'ADMIN': 
                    if (['admin', 'supervisor', 'coordinator'].includes(roleNorm)) {
                      return <div className="max-w-6xl mx-auto p-4 lg:p-6"><AdminDashboard currentUser={currentUser} /></div>;
                    } else {
                      return (
                        <div className="max-w-6xl mx-auto p-4 lg:p-6"><div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                          <p className="text-yellow-800 font-semibold text-lg">⚠️ Truy cập bị từ chối</p>
                          <p className="text-yellow-700 mt-2">Khu vực dành riêng cho ban Quản trị BME</p>
                        </div></div>
                      );
                    }
                  default: 
                    return <div className="max-w-6xl mx-auto p-4 lg:p-6"><HomeFeed searchQuery={searchQuery} currentUser={currentUser} /></div>;
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
          setUserRole(normalizeRoleForState(user.role || 'user'));
          setCurrentUser(user);
          setCurrentTab(getDefaultTabByRole(user));
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

      {currentUser && isChatBoxOpen && (
        <div className="fixed bottom-6 right-6 w-[700px] h-[550px] z-50 rounded-2xl shadow-2xl flex flex-row overflow-hidden border border-gray-200 bg-white">
          <aside className="w-[35%] border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-gray-800 text-lg">Đoạn chat</h3>
              <p className="text-xs text-gray-500 mt-1">Trao đổi nhanh với đối tác và kỹ sư</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {chatContacts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-4">
                  <p className="text-sm text-gray-500">Chưa có liên hệ phù hợp để trò chuyện.</p>
                </div>
              ) : (
                chatContacts.map((contact) => (
                  <button
                    key={contact.phone}
                    onClick={() => setActiveChat(contact)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      activeChat?.phone === contact.phone
                        ? 'bg-blue-100 border-l-4 border-blue-600 border-blue-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={contact.avatar} alt={contact.name} className="w-11 h-11 rounded-full object-cover border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm text-gray-800 truncate">{contact.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{contact.role}</p>
                        <p className="text-xs text-gray-600 truncate mt-1">{contact.preview}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex-1 flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <img
                  src={activeChat?.avatar || 'https://i.pravatar.cc/100?u=fallback_chat'}
                  alt={activeChat?.name || 'Đoạn chat'}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <p className="font-bold text-gray-800">{activeChat?.name || 'Đoạn chat'}</p>
                  <p className="text-xs text-gray-500">{activeChat?.role || 'Hỗ trợ nhanh'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatBoxOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition"
                title="Đóng hộp chat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {!activeChat ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-500">Hãy chọn một đoạn chat để bắt đầu</p>
                </div>
              ) : activeConversationMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-500">Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên.</p>
                </div>
              ) : (
                activeConversationMessages.map((msg) => {
                  const isMine = msg.senderPhone === currentUser.phone;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] px-4 py-2.5 text-sm shadow-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-bl-3xl rounded-tl-3xl rounded-tr-3xl'
                            : 'bg-gray-200 text-gray-800 rounded-br-3xl rounded-tr-3xl rounded-tl-3xl'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
              <input
                value={floatingChatInput}
                onChange={(e) => setFloatingChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendFloatingMessage();
                  }
                }}
                placeholder={activeChat ? 'Nhập tin nhắn...' : 'Chọn đoạn chat để bắt đầu'}
                disabled={!activeChat}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendFloatingMessage}
                disabled={!activeChat}
                className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </section>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
