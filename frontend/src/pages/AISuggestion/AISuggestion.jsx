import { useMemo, useState, useEffect } from 'react'
import Panel from '../../components/Panel/Panel.jsx'
import arrowRight from '../../assets/icons/arrow-right.svg'
import robotIcon from '../../assets/icons/robot-excited-outline.svg'
import pictureIcon from '../../assets/icons/picture-one.svg'
import styles from './AISuggestion.module.css'
import { aiService } from '../../services/aiService'

const parseKeywords = (value) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 25)

export default function AISuggestion() {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [submittedText, setSubmittedText] = useState('')
  
  // Chat state
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Xin chào! Tôi là trợ lý AI giúp bạn tạo nội dung YouTube. Bạn muốn làm video về chủ đề gì? Tôi có thể giúp bạn tạo tiêu đề, mô tả, hashtags và phân tích xu hướng.' 
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('form') // 'form' or 'chat'

  const keywords = useMemo(() => parseKeywords(inputValue), [inputValue])
  
  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_chat_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      } catch (e) {
        console.error('Failed to load chat history', e)
      }
    }
  }, [])
  
  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) { // Only save if there are actual conversations
      localStorage.setItem('ai_chat_history', JSON.stringify(messages))
    }
  }, [messages])

  const handleGenerate = async () => {
    if (!inputValue.trim()) {
      setError('Vui lòng nhập từ khóa hoặc mô tả trước khi gửi.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        keywords,
        description: inputValue.trim(),
        useChannelContext: true,
        fetchYouTubeContext: false,
        locale: 'vi-VN'
      }
      const data = await aiService.generateSuggestions(payload)
      setResult(data)
      setSubmittedText(inputValue.trim())
    } catch (err) {
      setError(err.message || 'Không thể tạo gợi ý. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleGenerate()
    }
  }
  
  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    setError(null)

    try {
      const context = {
        keywords,
        description: inputValue.trim(),
        locale: 'vi-VN'
      }
      const data = await aiService.chat(newMessages, context)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau hoặc kiểm tra kết nối.'
        }
      ])
      setError(err.message || 'Không thể kết nối với AI Chat.')
    } finally {
      setChatLoading(false)
    }
  }
  
  const handleChatKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }
  
  const clearChatHistory = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: 'Xin chào! Tôi là trợ lý AI giúp bạn tạo nội dung YouTube. Bạn muốn làm video về chủ đề gì?' 
      }
    ])
    localStorage.removeItem('ai_chat_history')
  }

  const renderList = (items, fallback) => {
    if (!items?.length) {
      return <p className={styles.placeholder}>{fallback}</p>
    }
    return (
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ol>
    )
  }

  return (
    <div className={styles.container}>
      {/* Tab selector */}
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'form' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('form')}
        >
          Tạo Gợi ý Nội Dung
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Chat Bot
        </button>
      </div>
      
      {activeTab === 'form' ? (
        <>
          <Panel className={styles.wrapper}>
            {result ? (
              <div className={styles.output}>
                <div className={styles.outputHeader}>
                  <span>Đầu vào gần nhất:</span>
                  <p>{submittedText}</p>
                </div>
                <div className={styles.section}>
                  <h3>10 tiêu đề gợi ý</h3>
                  {renderList(result.titles, 'Chưa có dữ liệu tiêu đề')}
                </div>
                <div className={styles.section}>
                  <h3>Mô tả 300 – 600 ký tự</h3>
                  {result.description ? (
                    <p className={styles.description}>{result.description}</p>
                  ) : (
                    <p className={styles.placeholder}>Chưa có mô tả, vui lòng thử lại.</p>
                  )}
                </div>
                <div className={styles.section}>
                  <h3>20 tags / hashtags</h3>
                  {result.hashtags?.length ? (
                    <div className={styles.tags}>
                      {result.hashtags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.placeholder}>Chưa có tags phù hợp.</p>
                  )}
                </div>
                <div className={styles.section}>
                  <h3>Chủ đề & trend gợi ý</h3>
                  {renderList(result.topics, 'Chưa có chủ đề nổi bật.')}
                  <div className={styles.trendRow}>
                    <div>
                      <strong>Google Trends</strong>
                      {renderList(result.trends?.google, 'Không có dữ liệu Google Trends.')}
                    </div>
                    <div>
                      <strong>YouTube Trends</strong>
                      {renderList(result.trends?.youtube, 'Không có dữ liệu YouTube Trends.')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Nhập từ khóa hoặc mô tả ở bên dưới để AI gợi ý nội dung ngay tại đây.</p>
              </div>
            )}
            {loading && <div className={styles.loader}>Đang tạo gợi ý...</div>}
            {error && <div className={styles.error}>{error}</div>}
          </Panel>
          <div className={styles.form}>
            <div className={styles.inputWrapper}>
              <div className={styles.iconGroup}>
                <img src={pictureIcon} alt="" className={styles.inputIcon} />
                <img src={robotIcon} alt="" className={`${styles.inputIcon} ${styles.robotIcon}`} />
              </div>
              <input
                className={styles.input}
                placeholder="Nhập từ khóa (cách nhau bằng dấu phẩy) hoặc mô tả video"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button type="button" className={styles.arrowButton} onClick={handleGenerate} disabled={loading}>
                <img src={arrowRight} alt="Generate" className={styles.arrowIcon} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <Panel className={styles.wrapper}>
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <h3>AI Content Chat</h3>
              <button 
                type="button" 
                className={styles.clearButton}
                onClick={clearChatHistory}
                title="Xóa lịch sử trò chuyện"
              >
                Xóa lịch sử
              </button>
            </div>
            <div className={styles.chatHistory}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.chatBubble} ${
                    msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant
                  }`}
                >
                  <div className={styles.chatBubbleContent}>
                    {msg.content.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className={`${styles.chatBubble} ${styles.chatBubbleAssistant}`}>
                  <div className={styles.chatTyping}>AI đang trả lời...</div>
                </div>
              )}
            </div>
            <div className={styles.chatInputRow}>
              <input
                className={styles.chatInput}
                placeholder="Hỏi AI về ý tưởng video, tiêu đề, mô tả, hashtags, xu hướng..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                disabled={chatLoading}
              />
              <button 
                type="button" 
                className={styles.chatSendButton}
                onClick={handleSendMessage} 
                disabled={chatLoading || !chatInput.trim()}
              >
                <img src={arrowRight} alt="Send" className={styles.arrowIcon} />
              </button>
            </div>
            {error && activeTab === 'chat' && (
              <div className={styles.error}>{error}</div>
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}

