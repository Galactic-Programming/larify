# 📋 KẾ HOẠCH THIẾT KẾ LẠI TÍNH NĂNG CHAT

> **Ngày tạo:** 01/01/2026  
> **Trạng thái:** Đang lên kế hoạch  
> **Phiên bản:** 1.0

---

## 📌 TÓM TẮT QUYẾT ĐỊNH

| #   | Câu hỏi                    | Quyết định                                                         |
| --- | -------------------------- | ------------------------------------------------------------------ |
| 1   | Thời điểm tạo conversation | **A - Tự động** khi project có >= 2 members                        |
| 2   | Project solo (1 người)     | **B - Disable** + hiển thị message "Add members to start chatting" |
| 3   | Xử lý data cũ              | **A - Xóa hoàn toàn** (clean start)                                |
| 4   | Member rời project         | **A - Giữ history** (tin nhắn cũ vẫn hiển thị)                     |
| 5   | Tính năng Pro cho chat     | **A - Free hoàn toàn** (không giới hạn)                            |
| 6   | Direct Message             | **A - Bỏ** (chỉ có Group chat gắn với project)                     |
| 7   | Entry point                | **C - Cả hai** (trang conversations + trong project detail)        |

---

## 🏗️ KIẾN TRÚC MỚI

### Mô hình quan hệ

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PROJECT                                   │
│  ┌─────────────────┐           ┌─────────────────────────────┐      │
│  │ project_members │           │     conversation (1:1)      │      │
│  │ ┌─────────────┐ │   auto    │ ┌─────────────────────────┐ │      │
│  │ │ Owner       │ │   sync    │ │ participants            │ │      │
│  │ │ Member A    │ │ ◄───────► │ │ (= project_members)     │ │      │
│  │ │ Member B    │ │           │ │                         │ │      │
│  │ └─────────────┘ │           │ └─────────────────────────┘ │      │
│  └─────────────────┘           │           │                 │      │
│                                │           ▼                 │      │
│                                │ ┌─────────────────────────┐ │      │
│                                │ │ messages[]              │ │      │
│                                │ └─────────────────────────┘ │      │
│                                └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

Quy tắc:
• Mỗi project có TỐI ĐA 1 conversation (1:1 relationship)
• Conversation tự động tạo khi project có >= 2 members
• Tên conversation = Tên project (auto-sync khi rename project)
• Participants tự động sync với project members
• Free & Pro users đều có thể chat
• Chỉ có Group chat (không có Direct Message)
```

---

## 📂 PHÂN TÍCH CODE HIỆN TẠI

### Files cần XÓA (Clean up)

#### Backend - PHP

| File                                                                       | Lý do xóa                       |
| -------------------------------------------------------------------------- | ------------------------------- |
| `app/Enums/ConversationType.php`                                           | Không cần nữa (chỉ có 1 loại)   |
| `app/Enums/ParticipantRole.php`                                            | Có thể giữ hoặc bỏ (simplify)   |
| `app/Http/Controllers/Conversations/ConversationParticipantController.php` | Participants sync tự động       |
| `app/Http/Requests/Conversations/AddParticipantRequest.php`                | Không add thủ công nữa          |
| `app/Http/Requests/Conversations/StoreConversationRequest.php`             | Logic tạo conversation thay đổi |
| `app/Events/ConversationCreated.php`                                       | Có thể giữ hoặc refactor        |
| `app/Events/ParticipantAdded.php`                                          | Sync tự động                    |
| `app/Events/ParticipantRemoved.php`                                        | Sync tự động                    |
| `app/Events/ParticipantRoleChanged.php`                                    | Không có role change            |

#### Frontend - TypeScript/React

| File                                                                         | Lý do xóa              |
| ---------------------------------------------------------------------------- | ---------------------- |
| `resources/js/pages/conversations/components/create-conversation-dialog.tsx` | Không tạo thủ công nữa |
| `resources/js/components/chat/chat-sidebar.tsx`                              | Refactor hoàn toàn     |

### Files cần SỬA ĐỔI

#### Database - Migrations

| File                                         | Thay đổi                                                           |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `create_conversations_table.php`             | Thêm `project_id` (FK, unique), bỏ `type` hoặc set default 'group' |
| `create_conversation_participants_table.php` | Simplify (có thể bỏ `role`, `nickname`)                            |

#### Backend - Models

| File                                     | Thay đổi                                       |
| ---------------------------------------- | ---------------------------------------------- |
| `app/Models/Conversation.php`            | Thêm relationship `project()`, bỏ logic Direct |
| `app/Models/Project.php`                 | Thêm relationship `conversation()`, logic sync |
| `app/Models/User.php`                    | Bỏ/sửa `canUseChat()` logic                    |
| `app/Models/ConversationParticipant.php` | Simplify                                       |

#### Backend - Controllers

| File                                                            | Thay đổi                            |
| --------------------------------------------------------------- | ----------------------------------- |
| `app/Http/Controllers/Conversations/ConversationController.php` | Refactor hoàn toàn                  |
| `app/Http/Controllers/Conversations/MessageController.php`      | Giữ phần lớn, sửa permissions       |
| `app/Http/Controllers/Projects/ProjectMemberController.php`     | Thêm sync conversation participants |

#### Backend - Policies

| File                                  | Thay đổi                    |
| ------------------------------------- | --------------------------- |
| `app/Policies/ConversationPolicy.php` | Dựa trên project membership |

#### Backend - Enums

| File                     | Thay đổi                              |
| ------------------------ | ------------------------------------- |
| `app/Enums/UserPlan.php` | Bỏ `canUseChat()` (chat free cho all) |

#### Frontend - Pages

| File                                                            | Thay đổi                                 |
| --------------------------------------------------------------- | ---------------------------------------- |
| `resources/js/pages/conversations/index.tsx`                    | Hiển thị theo project, bỏ upgrade prompt |
| `resources/js/pages/conversations/show.tsx`                     | Simplify, link với project               |
| `resources/js/pages/projects/lists/components/lists-header.tsx` | Thêm "Chat" button                       |

#### Frontend - Hooks & Types

| File                                    | Thay đổi                 |
| --------------------------------------- | ------------------------ |
| `resources/js/hooks/use-plan-limits.ts` | Bỏ `canUseChat`          |
| `resources/js/types/index.d.ts`         | Bỏ `can_use_chat`        |
| `resources/js/types/chat.d.ts`          | Simplify, bỏ Direct type |

#### Routes

| File                  | Thay đổi                                |
| --------------------- | --------------------------------------- |
| `routes/web.php`      | Simplify conversation routes            |
| `routes/channels.php` | Giữ nguyên (đã có conversation channel) |

### Files GIỮ NGUYÊN (hoặc thay đổi nhỏ)

| File                                                       | Lý do                |
| ---------------------------------------------------------- | -------------------- |
| `app/Models/Message.php`                                   | Không thay đổi logic |
| `app/Models/MessageAttachment.php`                         | Không thay đổi       |
| `app/Http/Controllers/Conversations/MessageController.php` | Phần lớn giữ nguyên  |
| `app/Events/MessageSent.php`                               | Giữ nguyên           |
| `app/Events/MessageEdited.php`                             | Giữ nguyên           |
| `app/Events/MessageDeleted.php`                            | Giữ nguyên           |
| `app/Events/MessagesRead.php`                              | Giữ nguyên           |
| `app/Events/UserTyping.php`                                | Giữ nguyên           |
| `config/chat.php`                                          | Giữ nguyên           |
| `resources/js/components/ui/chat-message.tsx`              | Giữ nguyên           |
| `resources/js/components/ui/message-input.tsx`             | Giữ nguyên           |
| `resources/js/components/ui/message-list.tsx`              | Giữ nguyên           |

---

## 📝 CHI TIẾT THAY ĐỔI

### Phase 1: Database Migration

#### 1.1 Tạo migration mới cho conversations

```php
// Thêm project_id vào conversations
Schema::table('conversations', function (Blueprint $table) {
    $table->foreignId('project_id')
        ->nullable()
        ->unique()
        ->after('id')
        ->constrained()
        ->cascadeOnDelete();
});

// Xóa data cũ (theo quyết định #3)
DB::table('message_attachments')->truncate();
DB::table('messages')->truncate();
DB::table('conversation_participants')->truncate();
DB::table('conversations')->truncate();
```

#### 1.2 Simplify conversation_participants (optional)

```php
// Có thể bỏ các columns không cần:
// - role (không phân biệt owner/member trong chat)
// - nickname (không cần thiết)
// - archived_at (conversation gắn với project, không archive riêng)
```

### Phase 2: Backend Models

#### 2.1 Conversation Model

```php
// Thêm relationship
public function project(): BelongsTo
{
    return $this->belongsTo(Project::class);
}

// Bỏ các methods liên quan Direct message
// - isDirect()
// - getOtherParticipant()
// - findOrCreateDirect()
```

#### 2.2 Project Model

```php
// Thêm relationship
public function conversation(): HasOne
{
    return $this->hasOne(Conversation::class);
}

// Thêm method tạo/lấy conversation
public function getOrCreateConversation(): ?Conversation
{
    // Chỉ tạo nếu có >= 2 members
    $memberCount = $this->members()->count() + 1; // +1 for owner
    if ($memberCount < 2) {
        return null;
    }

    return $this->conversation ?? $this->createConversation();
}

// Thêm method sync participants
public function syncConversationParticipants(): void
{
    if (!$this->conversation) return;

    // Lấy tất cả member IDs (bao gồm owner)
    $memberIds = $this->members()->pluck('users.id')->toArray();
    $memberIds[] = $this->user_id; // owner

    // Sync participants
    $this->conversation->participants()->sync($memberIds);
}
```

### Phase 3: Backend Controllers

#### 3.1 ConversationController - Simplify

```php
// index() - Lấy conversations từ user's projects
public function index(Request $request): Response
{
    $conversations = $request->user()
        ->accessibleProjects() // projects user owns or is member of
        ->with('conversation.latestMessage')
        ->get()
        ->pluck('conversation')
        ->filter(); // remove nulls (projects without conversation)

    return Inertia::render('conversations/index', [
        'conversations' => $conversations,
    ]);
}

// show() - Hiển thị conversation của project
public function show(Conversation $conversation): Response
{
    // Authorization dựa trên project membership
    $this->authorize('view', $conversation);

    // Load messages...
}

// Bỏ store() - conversation tạo tự động
// Bỏ users() - không search users nữa
```

#### 3.2 ProjectMemberController - Thêm sync

```php
// Khi add member
public function store(...)
{
    // ... existing code ...

    // Sync conversation
    $project->syncConversationParticipants();

    // Tạo conversation nếu đây là member thứ 2
    if (!$project->conversation) {
        $project->getOrCreateConversation();
    }
}

// Khi remove member
public function destroy(...)
{
    // ... existing code ...

    // Sync conversation (member vẫn giữ history nhưng không còn trong participants)
    $project->syncConversationParticipants();
}
```

### Phase 4: Frontend

#### 4.1 Conversations Index - Redesign

```tsx
// Hiển thị danh sách project conversations
// Bỏ UpgradePrompt (chat free cho all)
// Bỏ CreateConversationDialog (tự động tạo)

function ConversationsList({ conversations }) {
    if (conversations.length === 0) {
        return (
            <EmptyState
                title="No conversations yet"
                description="Conversations are automatically created when you have team members in your projects."
            />
        );
    }

    return conversations.map((conv) => (
        <ConversationItem
            key={conv.id}
            conversation={conv}
            projectName={conv.project.name}
            projectColor={conv.project.color}
        />
    ));
}
```

#### 4.2 Project Lists Header - Thêm Chat button

```tsx
// Thêm button "Chat" bên cạnh "Members"
{
    project.conversation ? (
        <Button asChild>
            <Link href={`/conversations/${project.conversation.id}`}>
                <MessageSquare className="size-4" />
                Chat
            </Link>
        </Button>
    ) : (
        <Tooltip content="Add members to start chatting">
            <Button disabled>
                <MessageSquare className="size-4" />
                Chat
            </Button>
        </Tooltip>
    );
}
```

#### 4.3 Bỏ Pro checks

```tsx
// Xóa tất cả canUseChat checks
// Xóa UpgradePromptDialog cho chat
// Xóa Pro badge trên nav items
```

### Phase 5: Clean up

#### 5.1 Xóa files không cần

```
app/Enums/ConversationType.php
app/Http/Controllers/Conversations/ConversationParticipantController.php
app/Http/Requests/Conversations/AddParticipantRequest.php
app/Events/ParticipantAdded.php
app/Events/ParticipantRemoved.php
app/Events/ParticipantRoleChanged.php
resources/js/pages/conversations/components/create-conversation-dialog.tsx
```

#### 5.2 Xóa routes không cần

```php
// Bỏ:
Route::get('api/users/search', ...);
Route::post('conversations', ...); // tự động tạo
Route::post('conversations/{conversation}/participants', ...);
Route::patch('conversations/{conversation}/participants/{participant}', ...);
Route::delete('conversations/{conversation}/participants/{participant}', ...);
Route::post('conversations/{conversation}/participants/{participant}/transfer-ownership', ...);
```

#### 5.3 Update tests

```php
// Xóa tests liên quan Direct message
// Xóa tests liên quan canUseChat
// Thêm tests mới cho project-based chat
```

---

## 🔄 THỨ TỰ THỰC HIỆN

### Bước 1: Database & Backend Core

1. [ ] Tạo migration thêm `project_id` vào conversations
2. [ ] Tạo migration clean up data cũ
3. [ ] Update Conversation model (thêm project relationship)
4. [ ] Update Project model (thêm conversation relationship + sync methods)
5. [ ] Update User model (bỏ canUseChat logic nếu cần)

### Bước 2: Backend Controllers & Policies

6. [ ] Refactor ConversationController
7. [ ] Update ConversationPolicy (dựa trên project membership)
8. [ ] Update ProjectMemberController (sync conversation)
9. [ ] Simplify/Update MessageController permissions

### Bước 3: Backend Cleanup

10. [ ] Xóa ConversationParticipantController
11. [ ] Xóa AddParticipantRequest
12. [ ] Xóa/Update ConversationType enum
13. [ ] Xóa ParticipantRole enum (nếu không cần)
14. [ ] Xóa events không cần
15. [ ] Update UserPlan enum (bỏ canUseChat)
16. [ ] Update routes/web.php

### Bước 4: Frontend Core

17. [ ] Update types/chat.d.ts
18. [ ] Update types/index.d.ts (bỏ can_use_chat)
19. [ ] Update use-plan-limits.ts (bỏ canUseChat)
20. [ ] Refactor conversations/index.tsx
21. [ ] Refactor conversations/show.tsx
22. [ ] Update chat-sidebar.tsx

### Bước 5: Frontend Cleanup & Integration

23. [ ] Xóa create-conversation-dialog.tsx
24. [ ] Update lists-header.tsx (thêm Chat button)
25. [ ] Update nav-main.tsx (bỏ Pro lock)
26. [ ] Cleanup các components không dùng

### Bước 6: Testing

27. [ ] Chạy migration trên dev
28. [ ] Test tạo conversation tự động
29. [ ] Test sync members
30. [ ] Test chat functionality
31. [ ] Test permissions
32. [ ] Update/tạo mới tests

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup data** trước khi chạy migration (mặc dù quyết định xóa data cũ)
2. **Chạy migration trên dev** trước khi production
3. **Test kỹ** sync members giữa project và conversation
4. **Đảm bảo** real-time events vẫn hoạt động
5. **Kiểm tra** edge cases:
    - Project có 1 member → không có chat
    - Project có 2+ members → có chat
    - Member bị remove → vẫn giữ history nhưng không thể gửi tin
    - Project bị xóa → conversation cũng bị xóa (cascade)
    - Project rename → conversation name cũng đổi theo

---

## 📊 ESTIMATE THỜI GIAN

| Phase     | Công việc                      | Estimate      |
| --------- | ------------------------------ | ------------- |
| 1         | Database & Backend Core        | 2-3 giờ       |
| 2         | Backend Controllers & Policies | 2-3 giờ       |
| 3         | Backend Cleanup                | 1-2 giờ       |
| 4         | Frontend Core                  | 3-4 giờ       |
| 5         | Frontend Cleanup & Integration | 2-3 giờ       |
| 6         | Testing                        | 2-3 giờ       |
| **Total** |                                | **12-18 giờ** |

---

## ✅ CHECKLIST TRƯỚC KHI BẮT ĐẦU

- [ ] Đã review và approve kế hoạch này
- [ ] Đã backup database (nếu cần)
- [ ] Đã tạo branch mới cho feature
- [ ] Đã hiểu rõ tất cả thay đổi

---

_Kế hoạch này sẽ được cập nhật khi có thay đổi trong quá trình implement._
