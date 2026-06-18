'use client';
import React, { useState } from 'react';
import { Search, Mic, Camera, MapPin, Image as ImageIcon, CheckCircle, Upload, ShieldAlert, FileText, AlertTriangle, CloudRain, Star, Server, HardDrive } from 'lucide-react';
import { mockPosts, mockStores, mockCommunities, mockFiles, mockFeedbacks } from '@/lib/data';

// ==========================================
// MODALS
// ==========================================
export const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin?: (user: any) => void }) => {
  const [role, setRole] = useState('user');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState('store');
  const [taxId, setTaxId] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[450px] p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Xin chào,</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button onClick={() => setRole('user')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'user' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Cá nhân</button>
          <button onClick={() => setRole('business')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'business' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Doanh nghiệp</button>
          <button onClick={() => setRole('coordinator')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'coordinator' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Chuyên gia</button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <input type="text" placeholder="Nhập số điện thoại" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
            
            {role === 'business' && (
              <>
                <input type="text" placeholder="Mã số thuế (Hệ thống tự động check)" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={taxId} onChange={e => setTaxId(e.target.value)} />
                <select className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                  <option value="store">Chủ Cửa Hàng Vật Tư</option>
                  <option value="technician">Kỹ Sư Sửa Chữa Chuyên Ngành</option>
                </select>
              </>
            )}
            {role === 'coordinator' && (
              <label className="flex items-center space-x-2 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                <input type="checkbox" className="w-4 h-4 text-blue-600" />
                <span>Apply làm Quản trị viên cộng đồng (Cần Admin duyệt)</span>
              </label>
            )}

            <button onClick={() => {
               if (!phone) return;
               setStep(2);
            }} className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition">Tiếp tục</button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">hoặc</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex justify-center items-center gap-2 transition">
              <ShieldAlert size={20} /> Đăng nhập bằng VNeID
            </button>
            
            <div className="flex justify-center gap-4 mt-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">G</div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">F</div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">A</div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto" />
            <p className="text-lg font-medium text-gray-800">
              {role === 'business' ? "Hồ sơ Doanh nghiệp đang chờ duyệt Store." : "Đăng nhập thành công!"}
            </p>
            <button onClick={() => {
               if (onLogin) {
                  onLogin({
                    id: `u_${Date.now()}`,
                    phone,
                    role,
                    businessType: role === 'business' ? businessType : undefined,
                    name: role === 'business' ? (businessType === 'store' ? 'Cửa Hàng Mới' : 'Kỹ Sư Sửa Chữa') : 'Người Dùng Mới',
                    taxId: role === 'business' ? taxId : undefined
                  });
               } else {
                  onClose();
               }
            }} className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition">Vào hệ thống</button>
          </div>
        )}
      </div>
    </div>
  );
};

export const OcrSearchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);

  if (!isOpen) return null;

  const simulateUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[500px] p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
        <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2"><Camera /> Tìm kiếm bằng hình ảnh (AI OCR)</h2>
        
        {!analyzing && !result && (
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl p-10 text-center cursor-pointer hover:bg-blue-100 transition" onClick={simulateUpload}>
            <Upload className="mx-auto text-blue-500 mb-3" size={32} />
            <p className="text-gray-700 font-medium">Click để tải ảnh lên (Mã lỗi, board mạch...)</p>
          </div>
        )}

        {analyzing && (
          <div className="py-10 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 animate-pulse">AI đang quét và trích xuất dữ liệu (OCR)...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
              <p className="font-bold flex items-center gap-2"><CheckCircle size={18} /> Phân tích hoàn tất (Độ tin cậy: 95%)</p>
              <p className="mt-2 text-sm"><strong>Kết quả:</strong> Mã lỗi E-01 (Lỗi nguồn) / Cụm bo mạch chủ Máy thở PB840.</p>
            </div>
            <div className="space-y-2 mt-4">
              <h4 className="font-bold text-gray-700">Đề xuất xử lý:</h4>
              <button className="w-full text-left p-3 border rounded-lg hover:border-blue-500 bg-gray-50">📖 Đọc Service Manual cho lỗi E-01</button>
              <button className="w-full text-left p-3 border rounded-lg hover:border-blue-500 bg-gray-50">🛒 Mua linh kiện thay thế (3 Store đang bán)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// VIEWS
// ==========================================
export const HomeFeed = () => {
  const [postContent, setPostContent] = useState('');
  const [category, setCategory] = useState('');

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Banner / Menu */}
      <div className="flex gap-4 mb-6">
        <div className="w-1/4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-blue-800 border-b pb-2 mb-3">Danh mục</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="hover:text-blue-600 cursor-pointer font-medium">Thiết bị chẩn đoán H.A</li>
            <li className="hover:text-blue-600 cursor-pointer font-medium">Thiết bị hồi sức cấp cứu</li>
            <li className="hover:text-blue-600 cursor-pointer font-medium">Linh kiện thay thế</li>
            <li className="hover:text-blue-600 cursor-pointer font-medium">Tài liệu kỹ thuật</li>
          </ul>
        </div>
        <div className="w-3/4 bg-blue-700 rounded-xl p-8 text-white flex flex-col justify-center items-start shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full -mr-20 -mt-20 opacity-50"></div>
          <h2 className="text-3xl font-bold mb-2 relative z-10">Sale Linh Kiện Mùa Hè</h2>
          <p className="mb-4 relative z-10">Giảm giá lên đến 20% các dòng cảm biến máy thở.</p>
          <button className="bg-white text-blue-700 px-6 py-2 rounded-full font-bold relative z-10 shadow">Xem ngay</button>
        </div>
      </div>

      {/* Create Post */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={18} className="text-red-500"/> Tạo bài viết (+)</h3>
        <div className="flex gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-1/3 outline-none focus:ring-1 focus:ring-blue-500" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">-- Chọn phân loại --</option>
            <option value="Sửa chữa">Cần sửa chữa</option>
            <option value="Rao bán">Rao bán</option>
            <option value="Tìm mua">Tìm mua</option>
            <option value="Chia sẻ">Chia sẻ kiến thức</option>
          </select>
          <input type="text" placeholder="Bạn đang tìm kiếm linh kiện hay cần hỗ trợ gì?" className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-2/3 outline-none focus:ring-1 focus:ring-blue-500" value={postContent} onChange={e => setPostContent(e.target.value)} />
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-2 text-gray-500">
            <button className="flex items-center gap-1 text-sm hover:text-blue-600 bg-gray-50 px-3 py-1.5 rounded-lg"><ImageIcon size={16}/> Ảnh/Video</button>
            <button className="flex items-center gap-1 text-sm hover:text-blue-600 bg-gray-50 px-3 py-1.5 rounded-lg"><FileText size={16}/> Tài liệu</button>
          </div>
          <button disabled={!postContent || !category} className={`px-6 py-2 rounded-lg font-bold transition ${(!postContent || !category) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}>Đăng bài</button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {mockPosts.map(post => (
          <div key={post.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">{post.author.charAt(0)}</div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{post.author}</h4>
                  <span className="text-xs text-gray-400">{post.time}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${post.category === 'Cần sửa chữa' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{post.category}</span>
            </div>
            <p className="text-gray-700 text-sm mb-4 leading-relaxed">{post.content}</p>
            <div className="flex gap-6 text-sm text-gray-500 border-t pt-3">
              <button className="hover:text-blue-600 font-medium">👍 {post.likes} Thích</button>
              <button className="hover:text-blue-600 font-medium">💬 {post.comments} Bình luận</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MapView = () => {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><MapPin className="text-red-500"/> Chế độ Bản đồ Khẩn cấp</h2>
          <p className="text-sm text-gray-500">Đang hiển thị các kỹ thuật viên và Store trong bán kính 10km.</p>
        </div>
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-red-700 animate-pulse flex items-center gap-2"><AlertTriangle size={18}/> Ping thợ gần nhất</button>
      </div>
      
      {/* Mock Map View */}
      <div className="relative w-full h-[600px] bg-blue-50 border-2 border-blue-100 rounded-xl overflow-hidden flex items-center justify-center">
        {/* Background grid representing a map */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Center user */}
        <div className="absolute z-10 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg flex justify-center items-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-ping absolute"></div>
        </div>

        {/* Mock Stores around */}
        {mockStores.map((store, idx) => (
          <div key={store.id} className={`absolute z-10 cursor-pointer group flex flex-col items-center ${idx === 0 ? 'mt-[-150px] ml-[-200px]' : 'mt-[100px] ml-[300px]'}`}>
            <div className="bg-white text-xs font-bold px-2 py-1 rounded shadow text-gray-700 opacity-0 group-hover:opacity-100 transition whitespace-nowrap mb-1">
              {store.name} ({store.distance})
            </div>
            <MapPin size={32} className="text-red-500 drop-shadow-md" fill="white" />
          </div>
        ))}
        <span className="absolute bottom-4 right-4 bg-white px-3 py-1 text-xs rounded-md shadow text-gray-500">Dữ liệu bản đồ giả lập</span>
      </div>
    </div>
  );
};

export const TinyCommunity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Giả lập quét full-text search
  const filteredFiles = mockFiles.filter(f => 
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6 grid grid-cols-3 gap-6">
      <div className="col-span-1 space-y-4">
        <h2 className="font-bold text-lg text-gray-800">Cộng đồng của bạn</h2>
        {mockCommunities.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-500 transition">
            <h3 className="font-bold text-blue-800 mb-1">{c.name}</h3>
            <p className="text-xs text-gray-500 mb-2">{c.members} thành viên</p>
            <p className="text-sm text-gray-600">{c.description}</p>
          </div>
        ))}
      </div>
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2"><Server /> Kho tài liệu (File Center)</h2>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm sâu trong nội dung file (Full-text search)..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-3">
          {filteredFiles.map(f => (
            <div key={f.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-white ${f.type === 'PDF' ? 'bg-red-500' : 'bg-blue-500'}`}>{f.type}</div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{f.title}</h4>
                  <p className="text-xs text-gray-500">{f.size} - Tóm tắt: {f.content.substring(0, 50)}...</p>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-bold hover:underline">Tải xuống</button>
            </div>
          ))}
          {filteredFiles.length === 0 && <p className="text-center text-gray-500 py-4">Không tìm thấy tài liệu phù hợp.</p>}
        </div>
      </div>
    </div>
  );
};

export const StoreProfile = () => {
  const store = mockStores[0];
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-blue-800 w-full relative"></div>
        <div className="p-6 relative">
          <div className="absolute -top-12 left-6 w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-blue-800">
            {store.name.charAt(0)}
          </div>
          <div className="mt-12">
            <h1 className="text-2xl font-bold text-gray-800">{store.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1 text-yellow-500 font-bold"><Star size={16} fill="currentColor"/> {store.rating} ({store.reviews} đánh giá)</span>
              <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={16}/> Đã xác thực Store</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Sản phẩm & Dịch vụ</h3>
          <div className="space-y-3">
            {store.products.map(p => (
              <div key={p.id} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-800 font-medium">{p.name}</span>
                <span className="text-blue-600 font-bold">{p.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Đánh giá từ cộng đồng</h3>
          <div className="space-y-4">
            {mockFeedbacks.map(fb => (
              <div key={fb.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-gray-800">{fb.user}</span>
                  <div className="flex text-yellow-500">{[...Array(fb.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}</div>
                </div>
                <p className="text-sm text-gray-600">{fb.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Trang Quản Trị Cấp Cao</h2>
        <div className="flex gap-3">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"><CloudRain size={16}/> Cấu hình CDN</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"><HardDrive size={16}/> Backup DB 2h sáng</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Heatmap Mock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Bản đồ nhiệt (Nhu cầu sửa chữa)</h3>
          <div className="h-64 bg-gray-100 rounded-lg relative overflow-hidden flex flex-wrap">
            {/* Generating random colored blocks to simulate heatmap */}
            {[...Array(50)].map((_, i) => {
              const isRed = i === 12 || i === 13 || i === 22; // Vùng đỏ giả lập
              const isBlue = i === 35 || i === 36;
              return (
                <div key={i} className={`w-[10%] h-[20%] border border-white/10 ${isRed ? 'bg-red-500/60' : isBlue ? 'bg-blue-500/60' : 'bg-gray-200/50'}`}>
                  {isRed && <div className="w-full h-full animate-pulse bg-red-600/80 cursor-pointer" title="Vùng Đỏ: Nhu cầu cao - ít thợ"></div>}
                </div>
              )
            })}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-white/80 px-3 py-1 rounded text-sm font-bold text-gray-600">Bản đồ nhiệt</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-red-100 text-red-600 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-200">Gửi thông báo điều phối thợ đến vùng Đỏ</button>
        </div>

        {/* Trend Forecasting Mock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Trend Forecasting (Từ khóa)</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-red-600">"Hỏng bo mạch máy thở"</span>
                <span className="text-gray-500">+125% (Cảnh báo)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">"Sửa bóng X-Quang"</span>
                <span className="text-gray-500">Ổn định</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">"Cảm biến SpO2"</span>
                <span className="text-gray-500">Tăng nhẹ</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};