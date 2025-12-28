# ĐỀ XUẤT: So Sánh Metrics với Snapshot Trước Đó

## Vấn đề hiện tại

- Metrics chỉ hiển thị số liệu hiện tại, không so sánh với lần phân tích trước
- Người dùng không biết kênh đang tăng trưởng hay suy giảm
- Biểu đồ không trực quan khi khoảng cách giữa các lần phân tích lớn

## Giải pháp

Lưu snapshot mỗi lần phân tích và so sánh với snapshot trước để hiển thị:
- Thay đổi tuyệt đối (tăng/giảm bao nhiêu)
- Thay đổi phần trăm (%)
- Xu hướng (↑ tăng, ↓ giảm, → ổn định)
- Số ngày từ lần sync trước

## Implementation nhanh

### 1. Backend - Cập nhật DTO

Thêm vào `DashboardMetricsResponse.java`:
```java
private MetricsComparison viewsComparison;
private MetricsComparison likesComparison;
private MetricsComparison commentsComparison;
private MetricsComparison videosComparison;
private LocalDateTime previousSyncDate;
```

Tạo class mới `MetricsComparison.java`:
```java
@Data
@Builder
public class MetricsComparison {
    private Long previousValue;
    private Long currentValue;
    private Long change;  // có thể âm
    private Double changePercentage;
    private String trend;  // "up", "down", "stable"
    private Long daysSinceLastSync;
}
```

### 2. Backend - Cập nhật Service

Trong `DashboardService.getMetrics()`, sau khi tính metrics hiện tại:

```java
// Lấy snapshot gần nhất
Optional<Analytics> previousSnapshot = analyticsRepository
    .findTopByChannelIdAndDateBeforeOrderByDateDesc(
        channel.getId(), 
        LocalDate.now()
    );

// Tính toán comparison cho từng metric
MetricsComparison viewsComparison = calculateComparison(
    totalViews,
    previousSnapshot.map(Analytics::getViewCount).orElse(null),
    previousSnapshot.map(Analytics::getDate).orElse(null)
);
```

### 3. Backend - Thêm Repository method

Trong `AnalyticsRepository.java`:
```java
@Query("SELECT a FROM Analytics a WHERE a.channel.id = :channelId AND a.date < :date ORDER BY a.date DESC")
Optional<Analytics> findTopByChannelIdAndDateBeforeOrderByDateDesc(
    @Param("channelId") Long channelId, 
    @Param("date") LocalDate date
);
```

### 4. Frontend - Hiển thị so sánh

Trong `Dashboard.jsx`, thêm vào mỗi metric card:

```jsx
{metrics?.viewsComparison && (
  <div className={styles.comparison}>
    {metrics.viewsComparison.trend === 'up' && (
      <span className={styles.trendUp}>
        ↑ +{formatCompactNumber(Math.abs(metrics.viewsComparison.change))}
        ({metrics.viewsComparison.changePercentage > 0 ? '+' : ''}
        {metrics.viewsComparison.changePercentage.toFixed(1)}%)
      </span>
    )}
    {metrics.viewsComparison.trend === 'down' && (
      <span className={styles.trendDown}>
        ↓ {formatCompactNumber(metrics.viewsComparison.change)}
        ({metrics.viewsComparison.changePercentage.toFixed(1)}%)
      </span>
    )}
    {metrics.viewsComparison.daysSinceLastSync && (
      <span className={styles.syncInfo}>
        So với {metrics.viewsComparison.daysSinceLastSync} ngày trước
      </span>
    )}
  </div>
)}
```

### 5. CSS

Thêm vào `Dashboard.module.css`:
```css
.comparison {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trendUp {
  color: #2ECFB9;
  font-weight: 600;
}

.trendDown {
  color: #FF6D6D;
  font-weight: 600;
}

.syncInfo {
  color: #98a3b1;
  font-size: 11px;
}
```

## Kết quả mong đợi

Mỗi metric card sẽ hiển thị:
```
Total Views
50.2M
↑ +2.5M (+5.2%)
So với 7 ngày trước
```

Hoặc nếu giảm:
```
Total Likes
1.8M
↓ -150K (-7.7%)
So với 14 ngày trước
```

## Lưu ý

- Xử lý edge case: lần đầu phân tích (không có snapshot trước)
- Xử lý division by zero khi tính phần trăm
- Hiển thị rõ ràng khi snapshot quá cũ (> 90 ngày)

