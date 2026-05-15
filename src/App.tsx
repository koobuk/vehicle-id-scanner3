import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Copy, Check, RefreshCw, Smartphone, ChevronLeft, Filter, Home, List, Bell, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsScanning(true);
    setCapturedImage(null);
    setOcrResult(null);
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
      
      // Target a smaller size for faster processing
      // 800px is usually plenty for clear text reading
      const targetWidth = 800;
      const aspectRatio = video.videoHeight / video.videoWidth;
      const targetHeight = targetWidth * aspectRatio;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the video frame resized
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Lower quality slightly to reduce payload size further
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setCapturedImage(dataUrl);
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
        model: "gemini-2.0-flash", // Use 2.0 Flash for balanced speed and intelligence
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
      setOcrResult(cleanedText || "텍스트를 찾을 수 없습니다.");
    } catch (err) {
      console.error("OCR error:", err);
      setOcrResult("OCR 도중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 border-x border-gray-200 max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="bg-white border-bottom border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 text-sm">
        {/* Statistics Bar - Placeholder like the screenshot */}
        <div className="grid grid-cols-3 gap-2 py-4 border-b border-gray-200 text-[#435585] font-medium bg-white -mx-4 px-4 sticky top-14 z-20">
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

        {/* Dummy List to match UI style */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border-b border-gray-100 py-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 px-2 transition-colors">
            <div className="space-y-1">
              <div className="flex gap-4">
                <span className="font-mono text-gray-600">B3426JJ00008{5-i}</span>
                <span className="text-gray-400">XXX 대리점</span>
                <span className="text-gray-400">2024-06-0{i}</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-bold text-lg">18{i}하3922</span>
                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1 rounded uppercase tracking-tighter">KMTGB41CBVU34024{i}</span>
              </div>
            </div>
            <ChevronLeft size={20} className="rotate-180 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        ))}

        {/* Scan Button section */}
        <div className="pt-8">
          <button 
            onClick={startCamera}
            className="w-full bg-[#1A56DB] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700"
          >
            <Camera size={20} />
            차대번호 촬영 스캔하기
          </button>
        </div>

        {/* Result Area */}
        {ocrResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-white border border-blue-100 rounded-2xl shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">추출된 텍스트</h3>
              <button 
                onClick={() => copyToClipboard(ocrResult)}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-blue-600 transition-colors"
                id="copy-btn"
              >
                {showCopyToast ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {showCopyToast ? '복사됨' : '복사'}
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-base break-all border border-gray-100 select-all selection:bg-blue-100">
              {ocrResult}
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Nav */}
      <footer className="bg-white border-t border-gray-100 h-20 px-6 py-2 grid grid-cols-4 gap-4 sticky bottom-0 z-10">
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
              <button onClick={stopCamera} className="p-2">취소</button>
              <h2 className="text-lg font-bold">차대번호 촬영</h2>
              <div className="w-10"></div>
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
                <div className="text-white text-center mb-12 px-8">
                  <p className="text-sm font-medium drop-shadow-md">차대번호를 화면 안에 맞춰 촬영해주세요.</p>
                </div>
                
                <div className="relative w-72 h-20 border-2 border-white/50 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
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
            <footer className="p-8 flex items-center justify-center bg-black/80 backdrop-blur-md">
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
                id="shutter-btn"
              >
                <div className="w-full h-full bg-white rounded-full"></div>
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
