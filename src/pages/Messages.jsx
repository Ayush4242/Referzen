import { useEffect, useState, useRef } from "react";
import API from "../services/api.js";

// ─── HELPER COMPONENTS ─────────────────────────────────────────────────────────
function ChatBubble({ message, isMe }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-blue-900 text-white shadow-sm' : 'bg-white border border-gray-100 text-gray-800 shadow-sm'}`}>
        <p className="leading-relaxed font-medium">{message.content}</p>
        <p className={`text-[9px] mt-1 text-right font-bold uppercase tracking-widest ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.user._id);
    }
  }, [activeChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await API.get(`/messages/conversations?userId=${currentUser._id}`);
      setConversations(res.data || []);
      if (res.data.length > 0 && !activeChat) {
        setActiveChat(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    setThreadLoading(true);
    try {
      const res = await API.get(`/messages/thread/${otherUserId}?userId=${currentUser._id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load thread:", err);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const payload = {
      sender: currentUser._id,
      receiver: activeChat.user._id,
      content: newMessage,
    };

    try {
      const res = await API.post("/messages/send", payload);
      setMessages(prev => [...prev, { ...res.data, createdAt: new Date().toISOString() }]);
      setNewMessage("");
      // Refresh sidebar to update last message
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter',_sans-serif] selection:bg-blue-100 selection:text-blue-900">
      
      {/* CLEAN MINIMAL HEADER */}
      <div className="bg-white border-b border-gray-100 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white text-xl">💬</div>
             <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Collaboration Center</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect with your referral network</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{currentUser.role}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm font-bold border border-blue-800 shadow-sm">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full h-[calc(100vh-88px)] overflow-hidden">
        
        {/* LEFT SIDEBAR: CONVERSATIONS */}
        <aside className="w-80 md:w-96 border-r border-gray-100 bg-white flex flex-col">
          <div className="p-6 border-b border-gray-50">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loading ? (
              <div className="py-10 text-center space-y-4">
                 <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updating Inbox</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-10 px-6 text-center">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">No conversations found.</p>
                 <p className="text-[10px] text-gray-300 mt-2">Active referrals will appear here automatically.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user._id}
                  onClick={() => setActiveChat(conv)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeChat?.user?._id === conv.user._id ? 'bg-blue-50/50 ring-1 ring-blue-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 to-[#0f172a] text-white flex items-center justify-center font-bold text-lg shadow-md">
                      {conv.user.name[0]}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{conv.user.name}</p>
                      <span className="text-[9px] font-bold text-gray-300 uppercase shrink-0">
                        {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-blue-900 font-bold' : 'text-gray-400'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* RIGHT CONTENT: CHAT */}
        <main className="flex-1 flex flex-col bg-white">
          {activeChat ? (
            <>
              {/* CHAT HEADER */}
              <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-900 border border-gray-200">
                      {activeChat.user.name[0]}
                    </div>
                    <div>
                       <h3 className="font-black text-gray-900 tracking-tight">{activeChat.user.name}</h3>
                       <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mt-1">
                         {activeChat.user.role} • Active now
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                 </div>
              </div>

              {/* MESSAGE AREA */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 scroll-smooth">
                {threadLoading ? (
                  <div className="flex items-center justify-center h-full">
                     <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                     <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-3xl mb-4 border border-gray-100">👋</div>
                     <h4 className="font-black text-gray-900 tracking-tight">Start the conversation</h4>
                     <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                       Discuss referral details, interview tips, or just say hello to <strong>{activeChat.user.name}</strong>.
                     </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg, i) => (
                      <ChatBubble key={i} message={msg} isMe={msg.sender === currentUser._id} />
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* INPUT AREA */}
              <div className="p-6 bg-white border-t border-gray-100">
                 <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                    <div className="flex-1 relative">
                       <input 
                         value={newMessage}
                         onChange={(e) => setNewMessage(e.target.value)}
                         placeholder="Message..."
                         className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-6 pr-12 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                       />
                       <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </button>
                    </div>
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="h-[52px] px-8 bg-blue-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                    >
                      Send
                    </button>
                 </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white">
               <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-4xl mb-6 shadow-inner">📬</div>
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Inbox</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                 Select a conversation from the left to start collaborating on your referrals.
               </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
