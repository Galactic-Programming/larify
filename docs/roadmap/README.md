# 🗺️ LaraFlow Development Roadmap

Tài liệu này mô tả roadmap phát triển tính năng Pro cho LaraFlow, được chia thành các phase với hướng dẫn chi tiết cho từng tính năng.

## 📋 Mục lục

### Phase 1 - Quick Wins (1-2 tháng)

Các tính năng có effort thấp, ROI cao, tận dụng infrastructure có sẵn.

| #   | Tính năng                                                | File hướng dẫn                     | Effort    | Status     |
| --- | -------------------------------------------------------- | ---------------------------------- | --------- | ---------- |
| 1   | [Due Date Reminders](./phase-1/01-due-date-reminders.md) | `phase-1/01-due-date-reminders.md` | 🟢 Low    | ⏳ Pending |
| 2   | [Labels/Tags](./phase-1/02-labels-tags.md)               | `phase-1/02-labels-tags.md`        | 🟢 Low    | ⏳ Pending |
| 3   | [Task Comments](./phase-1/03-task-comments.md)           | `phase-1/03-task-comments.md`      | 🟡 Medium | ⏳ Pending |
| 4   | [File Attachments](./phase-1/04-file-attachments.md)     | `phase-1/04-file-attachments.md`   | 🟡 Medium | ⏳ Pending |

### Phase 2 - Core Pro Features (2-3 tháng)

Các tính năng nâng cao tạo giá trị rõ ràng cho Pro plan.

| #   | Tính năng                                                | File hướng dẫn                    | Effort    | Status     |
| --- | -------------------------------------------------------- | --------------------------------- | --------- | ---------- |
| 5   | [Calendar View](./phase-2/05-calendar-view.md)           | `phase-2/05-calendar-view.md`     | 🟡 Medium | ⏳ Pending |
| 6   | [Recurring Tasks](./phase-2/06-recurring-tasks.md)       | `phase-2/06-recurring-tasks.md`   | 🟡 Medium | ⏳ Pending |
| 7   | [Task Templates](./phase-2/07-task-templates.md)         | `phase-2/07-task-templates.md`    | 🟢 Low    | ⏳ Pending |
| 8   | [Reports & Analytics](./phase-2/08-reports-analytics.md) | `phase-2/08-reports-analytics.md` | 🔴 High   | ⏳ Pending |

### Phase 3 - Advanced Features (3-6 tháng)

Các tính năng phức tạp tạo competitive advantage.

| #   | Tính năng                                              | File hướng dẫn                   | Effort    | Status     |
| --- | ------------------------------------------------------ | -------------------------------- | --------- | ---------- |
| 9   | [Time Tracking](./phase-3/09-time-tracking.md)         | `phase-3/09-time-tracking.md`    | 🔴 High   | ⏳ Pending |
| 10  | [Goals & Milestones](./phase-3/10-goals-milestones.md) | `phase-3/10-goals-milestones.md` | 🟡 Medium | ⏳ Pending |
| 11  | [Integrations](./phase-3/11-integrations.md)           | `phase-3/11-integrations.md`     | 🔴 High   | ⏳ Pending |

---

## 🎯 Ưu tiên triển khai

### Recommended Order (Phase 1)

```
1. Due Date Reminders  ─── Đã có field canUseDueDateReminders, chỉ cần implement logic
         │
         ▼
2. Labels/Tags  ─────────── Database đã có bảng labels, label_task
         │
         ▼
3. Task Comments  ───────── Database đã có bảng comments
         │
         ▼
4. File Attachments  ────── Database đã có bảng attachments
```

### Tại sao Phase 1 quan trọng?

1. **Infrastructure sẵn sàng**: Database tables đã tồn tại
2. **Effort thấp**: 1-2 tuần/tính năng
3. **ROI cao**: Users thường xuyên yêu cầu
4. **Tạo khác biệt**: Rõ ràng Free vs Pro

---

## 📊 Current System Analysis

### Existing Pro Gates (UserPlan.php)

```php
// Hiện tại đã có:
canInviteMembers()      // ✅ Implemented - Pro only
canUseDueDateReminders() // ⏳ Field có, chưa implement
hasFullPalette()        // ✅ Implemented - Pro only
canUseChat()            // ✅ Available for all plans

// Limits:
maxProjects()           // Free: 3, Pro: unlimited
maxListsPerProject()    // Free: 5, Pro: unlimited
activityRetentionDays() // Free: 7, Pro: 30
```

### Database Tables (Ready to use)

```sql
-- Đã có, chưa sử dụng đầy đủ:
labels          -- For task labels/tags
label_task      -- Pivot table
comments        -- For task comments
attachments     -- For file attachments
```

---

## 🛠️ Technical Guidelines

### Khi implement tính năng mới:

1. **Backend First**: Tạo Migration → Model → Controller → Routes → Tests
2. **Plan Gate**: Thêm method vào `UserPlan.php` enum
3. **Frontend Gate**: Sử dụng `usePlanFeatures()` hook
4. **Real-time**: Broadcast events nếu cần (đã có Reverb)
5. **Testing**: Viết tests trước hoặc song song

### File Structure Convention

```
app/
├── Enums/
│   └── UserPlan.php          # Thêm can{Feature}() method
├── Models/
│   └── {Feature}.php         # Model mới
├── Http/Controllers/
│   └── {Feature}Controller.php
├── Notifications/
│   └── {Feature}Notification.php
└── Events/
    └── {Feature}Event.php

resources/js/
├── components/
│   └── {feature}/            # Feature-specific components
├── hooks/
│   └── use-{feature}.ts      # Custom hooks
└── pages/
    └── {feature}/            # Feature pages
```

---

## 📝 Status Legend

| Icon | Meaning                |
| ---- | ---------------------- |
| ⏳   | Pending - Chưa bắt đầu |
| 🚧   | In Progress - Đang làm |
| ✅   | Completed - Hoàn thành |
| ❌   | Cancelled - Hủy bỏ     |

---

## 🔗 Related Documents

- [Pro Plan Features](../features/pro-plan-features.md) - Mô tả các tính năng Pro hiện tại
- [Chat Redesign Plan](../features/chat-redesign-plan.md) - Kế hoạch redesign chat
- [Permissions](../features/permissions.md) - Ma trận quyền hạn

---

_Last updated: January 2026_
