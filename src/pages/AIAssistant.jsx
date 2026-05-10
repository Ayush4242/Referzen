import { useState, useRef, useEffect } from "react";
import API from "../services/api.js";

// ─── AI CHAT COMPONENT ─────────────────────────────────────────────────────────
function ChatMessage({ role, content, timestamp }) {
  const isAi = role === "ai";
  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-5 shadow-sm ${isAi ? 'bg-white border border-gray-100 text-gray-800' : 'bg-blue-950 text-white shadow-lg shadow-blue-900/10'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${isAi ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white'}`}>
            {isAi ? "AI" : "ME"}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isAi ? 'text-gray-400' : 'text-white/50'}`}>
            {isAi ? "Referral Concierge" : "User Request"}
          </span>
          <span className="text-[10px] text-gray-300 ml-auto">{timestamp}</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "👋 Hi! I'm your AI Referral Concierge. I can help you draft perfect referral requests or provide guidance on your application journey. What's on your mind?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = { 
      role: "user", 
      content: prompt, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);

    try {
      const res = await API.post("/ai/generate", { prompt: currentPrompt, tone });
      const aiMessage = { 
        role: "ai", 
        content: res.data.text, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { 
        role: "ai", 
        content: "⚠️ Sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900 pb-10">
      {/* PREMIUM HEADER */}
      <div className="bg-[#0f172a] pt-16 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-800 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-600 rounded-full mix-blend-overlay filter blur-[100px] opacity-30"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_0_4px_rgba(96,165,250,0.2)]" />
            <p className="text-blue-200 text-xs font-black uppercase tracking-[0.3em]">Next-Gen Intelligence</p>
          </div>
          <h1 className="text-white text-4xl md:text-6xl font-black tracking-tight mb-4">AI Referral Concierge</h1>
          <p className="text-blue-100/60 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
            Powered by Gemini 1.5 Flash. Draft perfect messages, get career guidance, and polish your professional outreach with one click.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[650px]">
          
          {/* Chat Controls */}
          <div className="px-8 py-4 border-b border-gray-50 flex items-center justify-between bg-white/50">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Systems Active</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Writing Tone:</span>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)}
                  className="text-xs font-bold bg-gray-50 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                >
                  <option value="professional">💼 Professional</option>
                  <option value="friendly">👋 Friendly</option>
                  <option value="bold">🚀 Persuasive / Bold</option>
                  <option value="humble">🙏 Humble</option>
                </select>
             </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-100">
            {messages.map((msg, i) => (
              <ChatMessage key={i} {...msg} />
            ))}
            {loading && (
              <div className="flex justify-start mb-6 animate-pulse">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-50">
            <form onSubmit={handleGenerate} className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate(e);
                  }
                }}
                placeholder="Ask me to draft a referral, polish a message, or for career tips..."
                className="w-full pl-6 pr-32 py-5 rounded-[2rem] bg-gray-50 border border-gray-100 text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none shadow-inner"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0f172a] text-white px-6 py-3 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 shadow-xl shadow-blue-900/10"
              >
                {loading ? "..." : "Send Request"}
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-400 mt-4 font-medium">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </div>
  );
}
