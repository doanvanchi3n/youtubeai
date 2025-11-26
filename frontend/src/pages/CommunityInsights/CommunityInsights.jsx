import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Panel from '../../components/Panel/Panel.jsx'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'
import { communityService } from '../../services/communityService'
import { dashboardService } from '../../services/dashboardService'
import styles from './CommunityInsights.module.css'

const SENTIMENT_COLORS = {
  positive: '#2ECFB9',
  negative: '#FF6D6D',
  neutral: '#9AA0B5'
}

const EMOTION_COLORS = {
  happy: '#2ECFB9',
  sad: '#9AA0B5',
  angry: '#FF6D6D',
  suggestion: '#4D7CFE',
  love: '#FFAD5B'
}

export default function CommunityInsights() {
  const [channelId, setChannelId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Data states
  const [totalComments, setTotalComments] = useState(0)
  const [videoTopics, setVideoTopics] = useState([])
  const [sentimentStats, setSentimentStats] = useState(null)
  const [keywords, setKeywords] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [topicComparison, setTopicComparison] = useState([])

  useEffect(() => {
    loadChannelId()
  }, [])

  useEffect(() => {
    if (channelId) {
      loadAllData()
    }
  }, [channelId])

  const loadChannelId = async () => {
    try {
      const metrics = await dashboardService.getMetrics()
      if (metrics?.youtubeChannelId) {
        setChannelId(metrics.youtubeChannelId)
        setError(null)
      } else {
        setError('Bạn chưa kết nối kênh YouTube nào. Vui lòng đồng bộ kênh trước.')
      }
    } catch (err) {
      console.error('Error loading channel:', err)
      setError(err.message || 'Không thể tải thông tin kênh')
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        total,
        topics,
        sentiment,
        keywordsData,
        suggestionsData,
        comparison
      ] = await Promise.all([
        communityService.getTotalComments(channelId),
        communityService.getVideoTopics(channelId),
        communityService.getSentimentDistribution(channelId),
        communityService.getTopKeywords(channelId, 10),
        communityService.getTopicSuggestions(channelId),
        communityService.getTopicComparison(channelId)
      ])
      
      setTotalComments(total)
      setVideoTopics(topics)
      setSentimentStats(sentiment)
      setKeywords(keywordsData)
      setSuggestions(suggestionsData)
      setTopicComparison(comparison)
    } catch (err) {
      console.error('Error loading community data:', err)
      setError(err.message || 'Không thể tải dữ liệu cộng đồng')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Prepare sentiment pie chart data
  const sentimentChartData = sentimentStats?.sentiment
    ? Object.entries(sentimentStats.sentiment)
        .map(([key, value]) => ({
          name: key === 'positive' ? 'Tích cực' : key === 'negative' ? 'Tiêu cực' : 'Trung lập',
          value: value || 0
        }))
        .filter(item => item.value > 0)
    : []

  // Prepare topic comparison bar chart data
  const barChartData = topicComparison.map(topic => ({
    topic: topic.topic || 'Unknown',
    views: topic.views || 0,
    likes: topic.likes || 0,
    comments: topic.comments || 0
  }))

  if (error && !channelId) {
    return (
      <div className={styles.screen}>
        <Panel variant="light" className={styles.panel}>
          <div className={styles.errorMessage}>{error}</div>
        </Panel>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topSection}>
        <div className={styles.column}>
          <Panel variant="light" className={styles.panel}>
            <div className={styles.title}>
              Tổng comment:
            </div>
            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : (
              <div className={styles.stat}>{formatNumber(totalComments)} comments</div>
            )}
          </Panel>

          <Panel variant="light" className={styles.panel}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>Danh sách các chủ đề video</span>
            </div>
            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : videoTopics.length === 0 ? (
              <div className={styles.emptyMessage}>Chưa có chủ đề nào</div>
            ) : (
              <div className={styles.list}>
                {videoTopics.map((topic, idx) => (
                  <div key={idx} className={styles.pill}>
                    {topic}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className={styles.column}>
          <Panel variant="light" className={styles.panel}>
            <div className={styles.sectionTitle}>
              <img src={chevronIcon} alt="" />
              <span>Thống kê từng loại cảm xúc (biểu đồ tròn của tích cực tiêu cực, trung lập)</span>
            </div>
            {loading ? (
              <div className={styles.placeholder} />
            ) : sentimentChartData.length === 0 ? (
              <div className={styles.emptyMessage}>Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SENTIMENT_COLORS[entry.name === 'Tích cực' ? 'positive' : entry.name === 'Tiêu cực' ? 'negative' : 'neutral'] || '#8884d8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>

      <div className={styles.middleSection}>
        <Panel variant="light" className={styles.panel}>
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Danh sách từ khoá được nhắc tới nhiều trong bình luận</span>
          </div>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : keywords.length === 0 ? (
            <div className={styles.emptyMessage}>Chưa có từ khóa nào</div>
          ) : (
            <div className={styles.list}>
              {keywords.map((keyword, idx) => (
                <div key={idx} className={styles.pill}>
                  {keyword}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel variant="light" className={styles.panel}>
          <div className={styles.sectionTitle}>
            <img src={chevronIcon} alt="" />
            <span>Gợi ý chủ đề</span>
          </div>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : suggestions.length === 0 ? (
            <div className={styles.emptyMessage}>Chưa có gợi ý nào</div>
          ) : (
            <div className={styles.list}>
              {suggestions.map((topic, idx) => (
                <div key={idx} className={styles.pill}>
                  {topic}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel variant="light" className={styles.fullWidthPanel}>
        <div className={styles.sectionTitle}>
          <img src={chevronIcon} alt="" />
          <span>Biểu đồ so sánh tương tác của các chủ đề (biểu đồ cột)</span>
        </div>
        {loading ? (
          <div className={styles.placeholder} />
        ) : barChartData.length === 0 ? (
          <div className={styles.emptyMessage}>Chưa có dữ liệu để so sánh</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="topic" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="views" fill="#2ECFB9" name="Views" />
              <Bar dataKey="likes" fill="#4D7CFE" name="Likes" />
              <Bar dataKey="comments" fill="#FFAD5B" name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  )
}
