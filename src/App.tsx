import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Copy, Check, RefreshCw, Smartphone, ChevronLeft, Filter, Home, List, Bell, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export default function App() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formValues, setFormValues] = useState({
    vin: '',
    temporaryPlate: '',
    intendedPlate: ''
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dummyItems = [
    { id: 1, submitNo: 'B3426JJ000085', dealer: 'XXX 대리점', date: '2024-06-01', plate: '181하3922', vin: 'KMTGB41CBVU340244', contractNo: 'B126HRG000094', company: '도원건설 주식회사', region: '인천', carModel: '제네시스 G80 (RG3 F/L) 가솔린 2.5 터보', manager: '박근', contact: '02-3476-5544' },
    { id: 2, submitNo: 'B3426JJ000084', dealer: 'XXX 대리점', date: '2024-06-02', plate: '186가1234', vin: 'KMHGB41CBMU123456', contractNo: 'C998ASD112233', company: '한성무역', region: '서울', carModel: '아이오닉 6', manager: '김철수', contact: '02-1234-5678' },
    { id: 3, submitNo: 'B3426JJ000083', dealer: 'XXX 대리점', date: '2024-06-03', plate: '187나5678', vin: 'KMTGB41CBNU789012', contractNo: 'D456FGH778899', company: '글로벌 물류', region: '부산', carModel: '스타리아', manager: '이영희', contact: '051-987-6543' },
  ];

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setFormValues({ ...formValues, vin: item.vin });
    setView('detail');
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const targetWidth = 800;
      const aspectRatio = video.videoHeight / video.videoWidth;
      const targetHeight = targetWidth * aspectRatio;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        performOCR(dataUrl);
        stopCamera();
      }
    }
  };

  const performOCR = async (base64Image: string) => {
    setIsLoading(true);
    try {
      const imageBase64 = base64Image.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            parts: [
              { text: "추출: 차대번호(VIN)만. 17자리 영숫자 위주. 설명 없이 텍스트만." },
              { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
            ]
          }
        ]
      });

      const cleanedText = response.text.trim().replace(/\s/g, '');
      if (cleanedText) {
        setFormValues(prev => ({ ...prev, vin: cleanedText }));
      }
    } catch (err) {
      console.error("OCR error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 border-x border-gray-200 max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {view === 'list' ? (
        <>
          {/* Header */}
          <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-tight">납품준비상황</h1>
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <Filter size={20} />
            </button>
          </header>

          {/* Main List Area */}
          <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 text-sm">
            <div className="grid grid-cols-3 gap-2 py-4 border-b border-gray-200 text-[#435585] font-medium bg-white -mx-4 px-4 sticky top-0 z-20">
              <div className="flex flex-col">
                <span className="text-[10px] opacity-70 uppercase tracking-wider">제출번호</span>
                <span className="text-[10px] opacity-70 uppercase tracking-wider">차량번호</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] opacity-70 uppercase tracking-wider">출고점</span>
                <span className="text-[10px] opacity-70 uppercase tracking-wider">차대번호</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] opacity-70 uppercase tracking-wider">등록예정일</span>
              </div>
            </div>

            {dummyItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleSelectItem(item)}
                className="bg-white border-b border-gray-100 py-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex gap-4">
                    <span className="font-mono text-gray-600">{item.submitNo}</span>
                    <span className="text-gray-400">{item.dealer}</span>
                    <span className="text-gray-400">{item.date}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="font-bold text-lg">{item.plate}</span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1 rounded uppercase tracking-tighter">{item.vin}</span>
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </main>
        </>
      ) : (
        /* Detail Page - Modal Style like screenshot */
        <div className="flex-1 flex flex-col bg-gray-900/10 h-full">
           <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-bold tracking-tight">납품준비상황</h1>
            </div>
          </header>

          <main className="flex-1 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <h3 className="font-bold text-gray-700">희망차량번호 등록</h3>
                <button onClick={() => setView('list')}><X size={20} className="text-gray-400" /></button>
              </div>

              <div className="p-4 space-y-px bg-blue-50/30">
                <DetailRow label="계약번호" value={selectedItem.contractNo} />
                <DetailRow label="상호" value={selectedItem.company} />
                <DetailRow label="등록지역" value={selectedItem.region} />
                <DetailRow label="차명" value={selectedItem.carModel} />
                <DetailRow label="제출번호" value={selectedItem.submitNo} />
                <DetailRow label="차량인수지" value={selectedItem.dealer} />
                <DetailRow label="담당자" value={selectedItem.manager} />
                <DetailRow label="출고 연락처" value={selectedItem.contact} />
              </div>

              <div className="p-4 space-y-3 bg-white border-t border-gray-100 mt-4">
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm font-bold text-blue-600">희망차량번호</label>
                  <input 
                    type="text" 
                    placeholder="(한글 10자)"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    value={formValues.intendedPlate}
                    onChange={(e) => setFormValues({...formValues, intendedPlate: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm font-bold text-blue-600">차대번호</label>
                  <div className="flex-1 flex gap-1">
                    <input 
                      type="text" 
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                      value={formValues.vin}
                      onChange={(e) => setFormValues({...formValues, vin: e.target.value.toUpperCase()})}
                    />
                    <button 
                      onClick={startCamera}
                      className="p-2 border border-blue-200 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm font-bold text-blue-600">임시차량번호</label>
                  <input 
                    type="text" 
                    placeholder="임시차량번호 입력"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    value={formValues.temporaryPlate}
                    onChange={(e) => setFormValues({...formValues, temporaryPlate: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 flex gap-3">
                <button className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-lg font-bold hover:bg-gray-200 transition-colors">수정</button>
                <button onClick={() => setView('list')} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">닫기</button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Bottom Nav */}
      <footer className="bg-white border-t border-gray-100 h-20 px-6 py-2 grid grid-cols-4 gap-4 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
          <Home size={24} />
          <span className="text-[10px]">홈</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 text-blue-600">
          <List size={24} />
          <span className="text-[10px] font-bold">납품준비</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
          <Bell size={24} />
          <span className="text-[10px]">알림</span>
        </div>
         <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
          <Settings size={24} />
          <span className="text-[10px]">설정</span>
        </div>
      </footer>

      {/* Scanner Modal overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Camera Header */}
            <header className="p-4 flex items-center justify-between text-white z-10">
              <button onClick={stopCamera} className="p-2 text-sm">취소</button>
              <h2 className="text-lg font-bold">차대번호 촬영</h2>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold">Flash</span>
                <div className="w-8 h-4 bg-gray-700 rounded-full relative flex items-center px-0.5">
                   <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </header>

            {/* Camera Viewport */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Scan Guide Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-white text-center mb-8 px-8">
                  <p className="text-sm font-medium drop-shadow-md">차대번호를 화면 안에 맞춰 촬영해주세요.</p>
                </div>
                
                <div className="relative w-72 h-20 border-2 border-white/40 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    
                    {/* Animated scanning line */}
                    <motion.div 
                      animate={{ top: ['15%', '85%', '15%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-1 right-1 h-[1px] bg-red-400 opacity-80 shadow-[0_0_8px_rgba(239,68,68,1)]"
                    />
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <footer className="p-8 flex items-center justify-between bg-black/80 backdrop-blur-md px-12">
              <div className="w-12"></div>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full"></div>
              </button>
              <button className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <Smartphone size={24} />
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
           <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-blue-600"
           >
            <RefreshCw size={40} />
           </motion.div>
           <p className="font-bold text-gray-600">텍스트 추출 중...</p>
        </div>
      )}

      {/* Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex bg-white items-center text-xs border border-blue-100 -mt-px first:rounded-t last:rounded-b">
      <div className="w-24 bg-blue-50/50 px-3 py-2 text-blue-800 font-medium border-r border-blue-100">{label}</div>
      <div className="flex-1 px-3 py-2 text-gray-600 break-all">{value}</div>
    </div>
  );
}

