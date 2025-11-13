import { useState } from 'react'
import bellIcon from '../../assets/icons/notifications.svg'
import videoIcon from '../../assets/icons/listvideo.svg'
import chevronIcon from '../../assets/icons/chevron-double-right.svg'

export default function VideoAnalytics() {
  const [activeTab, setActiveTab] = useState('View')
  const tabs = ['View', 'Like', 'Comment']

  return (
    <div className="video-analytics">
      <div className="panel panel-light va-channel">
        <div className="va-avatar" />
        <div className="va-info">
          <div className="va-name">Tên Kênh</div>
          <div className="va-meta">
            <span>
              <img src={bellIcon} alt="" />
              56K Subscribers
            </span>
            <span>
              <img src={videoIcon} alt="" />
              56K Video
            </span>
          </div>
        </div>
      </div>

      <div className="panel panel-light">
        <div className="panel-title">
          <img src={chevronIcon} alt="" />
          <span>Phân tích tốc độ tăng view (biểu đồ đường)</span>
        </div>
        <div className="va-placeholder" />
      </div>

      <div className="panel panel-light">
        <div className="panel-title">
          <img src={chevronIcon} alt="" />
          <span>Biểu đồ tương tác theo thời gian (biểu đồ đường)</span>
        </div>
        <div className="va-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`va-tab ${activeTab === tab ? 'va-tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="va-placeholder" />
      </div>

      <div className="panel panel-light">
        <div className="panel-title">
          <img src={chevronIcon} alt="" />
          <span>Gợi ý thời điểm tăng hiệu quả</span>
        </div>
        <div className="va-placeholder" />
      </div>
    </div>
  )
}
