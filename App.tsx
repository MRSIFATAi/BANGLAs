
import React, { useState, useCallback, useRef } from 'react';
import { transcribeAudio, generateContent, connectLiveTranscription, createBlob } from './services/gemini';
import { ContentType, ProcessingState } from './types';

// Components
const Header: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 py-4 px-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          সিফাতের বাংলা লেখক
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
          BANGLADESHI BANGLA AUDIO TRANSCRIBER
        </p>
      </div>
    </div>
    <div className="flex items-center gap-4">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
          title="সব কিছু রিসেট করুন"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          রিসেট
        </button>
        <span className="hidden md:inline text-sm text-slate-500 border-l border-slate-800 pl-4">Powered by Gemini AI</span>
    </div>
  </header>
);

const ThumbnailCard: React.FC<{ text: string; onCopy: (t: string) => void }> = ({ text, onCopy }) => (
  <div className="relative group bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Thumbnail Text</span>
        </div>
        <p className="text-slate-200 font-medium text-lg leading-snug">{text}</p>
      </div>
      <button 
        onClick={() => onCopy(text)}
        className="shrink-0 p-2 bg-slate-700/50 hover:bg-blue-600 rounded-lg text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        title="Copy text"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      </button>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <div className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">High Contrast</div>
      <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Viral Tip</div>
    </div>
  </div>
);

const ContentSection: React.FC<{ 
  title: string; 
  value: string; 
  isLoading: boolean; 
  progress: number;
  onGenerate: (type: ContentType) => void;
  type: ContentType;
  onCopy: (t: string) => void;
}> = ({ 
  title, 
  value, 
  isLoading, 
  progress,
  onGenerate, 
  type,
  onCopy
}) => {
  const parseItems = (text: string) => {
    return text
      .split(/\n+/)
      .map(item => item.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(item => item.length > 0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 group transition-all hover:border-blue-500/50 shadow-xl relative">
      {/* Dynamic Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden z-10">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
        <div className="flex items-center gap-3">
           <div className={`p-2 rounded-lg ${type === 'thumbnail' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {type === 'thumbnail' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
           </div>
           <h3 className="font-semibold text-lg text-slate-200">{title}</h3>
        </div>
        <button 
          onClick={() => onGenerate(type)}
          disabled={isLoading}
          className={`px-4 py-1.5 text-white text-sm font-medium rounded-md transition-all flex items-center gap-2 shadow-lg ${
            isLoading ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>প্রস্তুত হচ্ছে {progress}%...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
      <div className={`p-6 transition-opacity duration-500 ${isLoading ? 'opacity-40 select-none' : 'opacity-100'}`}>
        {value ? (
          type === 'thumbnail' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parseItems(value).map((item, idx) => (
                <ThumbnailCard key={idx} text={item} onCopy={onCopy} />
              ))}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed custom-scrollbar max-h-96 overflow-y-auto bg-slate-800/20 p-4 rounded-xl border border-slate-800/50">
              {value}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500/50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="italic text-center text-sm">No content generated yet. Click generate to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isActionBarVisible, setIsActionBarVisible] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(['title', 'thumbnail', 'facebook', 'youtube']);
  const [generatedData, setGeneratedData] = useState<Record<ContentType, string>>({
    title: '',
    thumbnail: '',
    facebook: '',
    youtube: ''
  });
  const [state, setState] = useState<ProcessingState>({
    isTranscribing: false,
    isGenerating: {
      title: false,
      thumbnail: false,
      facebook: false,
      youtube: false
    },
    generationProgress: {
      title: 0,
      thumbnail: 0,
      facebook: 0,
      youtube: 0
    },
    progress: 0
  });

  // Recording References
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (liveSessionPromiseRef.current) {
      const session = await liveSessionPromiseRef.current;
      session.close();
      liveSessionPromiseRef.current = null;
    }
  }, []);

  const startLiveRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const liveSessionPromise = connectLiveTranscription({
        onTranscript: (text) => {
          setTranscript(prev => prev + ' ' + text);
        },
        onOpen: () => {
          const source = audioContext.createMediaStreamSource(stream);
          const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            liveSessionPromise.then(session => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
        },
        onError: (err) => {
          console.error("Live transcription error:", err);
          stopRecording();
        },
        onClose: () => {
          setIsRecording(false);
        }
      });
      
      liveSessionPromiseRef.current = liveSessionPromise;
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Microphone access is required for live recording.");
      setIsRecording(false);
    }
  };

  const handleReset = useCallback(() => {
    if (confirm('আপনি কি নিশ্চিত যে আপনি সব কিছু রিসেট করতে চান?')) {
      stopRecording();
      setTranscript('');
      setGeneratedData({
        title: '',
        thumbnail: '',
        facebook: '',
        youtube: ''
      });
      setState({
        isTranscribing: false,
        isGenerating: {
          title: false,
          thumbnail: false,
          facebook: false,
          youtube: false
        },
        generationProgress: {
          title: 0,
          thumbnail: 0,
          facebook: 0,
          youtube: 0
        },
        progress: 0
      });
    }
  }, [stopRecording]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleTypeSelection = (type: ContentType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isTranscribing: true, progress: 10 }));
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        
        setState(prev => ({ ...prev, progress: 40 }));
        const text = await transcribeAudio(base64Data, file.type);
        setTranscript(text);
        setState(prev => ({ ...prev, isTranscribing: false, progress: 100 }));
        
        setTimeout(() => setState(prev => ({ ...prev, progress: 0 })), 1000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Transcription error:', error);
      setState(prev => ({ ...prev, isTranscribing: false, progress: 0 }));
      alert('Error transcribing audio. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerate = async (type: ContentType) => {
    if (!transcript) {
      alert('Please transcribe audio first.');
      return;
    }

    // Start simulation interval
    setState(prev => ({
      ...prev,
      isGenerating: { ...prev.isGenerating, [type]: true },
      generationProgress: { ...prev.generationProgress, [type]: 5 }
    }));

    const progressInterval = setInterval(() => {
      setState(prev => {
        const current = prev.generationProgress[type];
        // Asymptotic growth: faster at start, slows down near 90%
        let next = current + Math.max((90 - current) / 10, 1);
        if (next > 92) next = 92; 
        
        return {
          ...prev,
          generationProgress: {
            ...prev.generationProgress,
            [type]: Math.round(next)
          }
        };
      });
    }, 400);

    try {
      const result = await generateContent(transcript, type);
      
      // Stop interval and set to 100
      clearInterval(progressInterval);
      setState(prev => ({
        ...prev,
        generationProgress: { ...prev.generationProgress, [type]: 100 }
      }));
      
      // Short delay for the 100% to be visible before clearing
      setTimeout(() => {
        setGeneratedData(prev => ({ ...prev, [type]: result }));
        setState(prev => ({
          ...prev,
          isGenerating: { ...prev.isGenerating, [type]: false },
          generationProgress: { ...prev.generationProgress, [type]: 0 }
        }));
      }, 300);

    } catch (error) {
      clearInterval(progressInterval);
      console.error(`Error generating ${type}:`, error);
      alert(`Error generating ${type}. Please try again.`);
      setState(prev => ({
        ...prev,
        isGenerating: { ...prev.isGenerating, [type]: false },
        generationProgress: { ...prev.generationProgress, [type]: 0 }
      }));
    }
  };

  const handleGenerateSelected = () => {
    if (selectedTypes.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ক্যাটাগরি সিলেক্ট করুন।');
      return;
    }
    selectedTypes.forEach(type => handleGenerate(type));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <Header onReset={handleReset} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Transcription */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
              Input Options
            </h2>
            
            <div className="space-y-4">
              <label className="block">
                <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-4 text-slate-500 group-hover:text-indigo-500 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm font-semibold text-slate-400">UPLOAD AUDIO FILE</p>
                    <p className="text-xs text-slate-500 uppercase">MP3, WAV, AAC, MP4 (MAX 20MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="audio/*,video/*" onChange={handleFileUpload} disabled={state.isTranscribing || isRecording} />
                </div>
              </label>

              <button 
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border transition-all font-semibold ${
                  isRecording 
                  ? 'bg-red-500/10 border-red-500 text-red-500' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                }`}
                onClick={isRecording ? stopRecording : startLiveRecording}
                disabled={state.isTranscribing}
              >
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
                {isRecording ? 'Stop Live Recording' : 'Start Live Recording'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-grow flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-8 bg-purple-500 rounded-full inline-block"></span>
                Transcription Result
                {isRecording && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse ml-2 font-bold uppercase">REC</span>}
              </h2>
              {transcript && (
                <button 
                  onClick={() => copyToClipboard(transcript)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="লেখাটি কপি করুন"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              )}
            </div>

            {state.isTranscribing ? (
              <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                  <div 
                    className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '2s' }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-400">{state.progress}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">আডিও বিশ্লেষণ করা হচ্ছে...</h3>
                <p className="text-slate-400 text-sm max-w-xs uppercase tracking-tighter opacity-70">Please wait while the AI processes your audio</p>
              </div>
            ) : transcript ? (
              <div className="flex-grow">
                <div className="bg-slate-800/40 rounded-xl p-4 text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar whitespace-pre-wrap text-sm border border-slate-700/50">
                  {transcript}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-slate-500 opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p className="text-sm uppercase tracking-widest font-bold">নিষ্ক্রিয় অবস্থা</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Content Generation */}
        <div className="lg:col-span-7 space-y-2">
          <ContentSection 
            title="ভিডিওর জন্য সুন্দর টাইটেল"
            type="title"
            value={generatedData.title}
            isLoading={state.isGenerating.title}
            progress={state.generationProgress.title}
            onGenerate={handleGenerate}
            onCopy={copyToClipboard}
          />
          <ContentSection 
            title="থাম্বনেইলের জন্য লেখা"
            type="thumbnail"
            value={generatedData.thumbnail}
            isLoading={state.isGenerating.thumbnail}
            progress={state.generationProgress.thumbnail}
            onGenerate={handleGenerate}
            onCopy={copyToClipboard}
          />
          <ContentSection 
            title="ফেসবুক ক্যাপশন (Banglish)"
            type="facebook"
            value={generatedData.facebook}
            isLoading={state.isGenerating.facebook}
            progress={state.generationProgress.facebook}
            onGenerate={handleGenerate}
            onCopy={copyToClipboard}
          />
          <ContentSection 
            title="ইউটিউব ডেসক্রিপশন"
            type="youtube"
            value={generatedData.youtube}
            isLoading={state.isGenerating.youtube}
            progress={state.generationProgress.youtube}
            onGenerate={handleGenerate}
            onCopy={copyToClipboard}
          />
        </div>
      </main>

      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <button 
          onClick={() => setIsActionBarVisible(!isActionBarVisible)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${
            isActionBarVisible 
            ? 'bg-slate-800 border-indigo-500 text-indigo-400 rotate-180' 
            : 'bg-indigo-600 border-indigo-400 text-white hover:scale-110 active:scale-95'
          }`}
          title={isActionBarVisible ? "অ্যাকশন বার লুকান" : "অ্যাকশন বার দেখান"}
        >
          {isActionBarVisible ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          )}
        </button>
      </div>

      {/* Floating Action Bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-2xl md:rounded-full px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-6 z-50 transition-all duration-500 ease-in-out md:scale-100 scale-90 max-w-[95vw] ${
        isActionBarVisible ? 'translate-y-0 opacity-100 visible' : 'translate-y-32 opacity-0 invisible'
      }`}>
          
          {/* Scroll to top */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hidden md:block text-slate-400 hover:text-white transition-colors" title="উপরে যান">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          
          <div className="hidden md:block w-px h-6 bg-slate-800"></div>

          {/* Selection Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'title', label: 'টাইটেল' },
              { id: 'thumbnail', label: 'থাম্বনেইল' },
              { id: 'facebook', label: 'ফেসবুক' },
              { id: 'youtube', label: 'ইউটিউব' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => toggleTypeSelection(type.id as ContentType)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedTypes.includes(type.id as ContentType)
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500 grayscale'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

          {/* Batch Generate Button */}
          <button 
            disabled={!transcript || selectedTypes.length === 0} 
            onClick={handleGenerateSelected}
            className="group flex items-center gap-3 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm uppercase tracking-widest rounded-full transition-all shadow-xl shadow-indigo-600/20 disabled:shadow-none"
          >
            <span>Generate ({selectedTypes.length}) Items</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
      </div>
    </div>
  );
}
