<?php

namespace App\Enums;

enum UserPlan: string
{
    case Free = 'free';
    case Pro = 'pro';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Free',
            self::Pro => 'Pro',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Free => 'Personal use with full features',
            self::Pro => 'Team collaboration + premium features',
        };
    }

    /**
     * Check if this plan allows team collaboration.
     */
    public function canInviteMembers(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan has access to premium features.
     */
    public function isPremium(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Get maximum number of projects allowed.
     * Returns null for unlimited.
     */
    public function maxProjects(): ?int
    {
        return match ($this) {
            self::Free => 3,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Get maximum number of task lists per project.
     * Returns null for unlimited.
     */
    public function maxListsPerProject(): ?int
    {
        return match ($this) {
            self::Free => 5,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Get activity history retention in days.
     */
    public function activityRetentionDays(): int
    {
        return match ($this) {
            self::Free => 7,
            self::Pro => 30,
        };
    }

    /**
     * Check if this plan allows chat/conversations.
     * Note: Chat is now available for all plans.
     */
    public function canUseChat(): bool
    {
        return true;
    }

    /**
     * Check if this plan allows due date reminders.
     */
    public function canUseDueDateReminders(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan has full color/icon palette.
     */
    public function hasFullPalette(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Get maximum number of labels per project.
     * Returns null for unlimited.
     */
    public function maxLabelsPerProject(): ?int
    {
        return match ($this) {
            self::Free => 3,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Check if this plan has access to extended label colors.
     */
    public function hasExtendedLabelColors(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan can create task comments.
     * Free: view only, Pro: full CRUD
     */
    public function canCreateComments(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan can use @mentions in comments.
     */
    public function canUseMentions(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan can add reactions to comments.
     */
    public function canUseCommentReactions(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan can upload task attachments.
     */
    public function canUploadAttachments(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Get maximum file size in bytes for attachments.
     */
    public function maxAttachmentSize(): int
    {
        return match ($this) {
            self::Free => 5 * 1024 * 1024,  // 5 MB
            self::Pro => 25 * 1024 * 1024,   // 25 MB
        };
    }

    /**
     * Get maximum storage in bytes for attachments.
     */
    public function maxAttachmentStorage(): int
    {
        return match ($this) {
            self::Free => 50 * 1024 * 1024,   // 50 MB
            self::Pro => 1024 * 1024 * 1024,  // 1 GB
        };
    }

    /**
     * Get allowed file extensions for attachments.
     *
     * @return array<string>
     */
    public function allowedAttachmentExtensions(): array
    {
        $basic = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'md'];

        return match ($this) {
            self::Free => $basic,
            self::Pro => array_merge($basic, [
                'svg', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'csv', 'json', 'zip', 'rar',
            ]),
        };
    }

    /**
     * Get all limits as array (useful for frontend).
     *
     * @return array<string, mixed>
     */
    public function getLimits(): array
    {
        return [
            'max_projects' => $this->maxProjects(),
            'max_lists_per_project' => $this->maxListsPerProject(),
            'max_labels_per_project' => $this->maxLabelsPerProject(),
            'activity_retention_days' => $this->activityRetentionDays(),
            'can_invite_members' => $this->canInviteMembers(),
            'can_use_chat' => $this->canUseChat(),
            'can_use_due_date_reminders' => $this->canUseDueDateReminders(),
            'has_full_palette' => $this->hasFullPalette(),
            'has_extended_label_colors' => $this->hasExtendedLabelColors(),
            'can_create_comments' => $this->canCreateComments(),
            'can_use_mentions' => $this->canUseMentions(),
            'can_use_comment_reactions' => $this->canUseCommentReactions(),
            'can_upload_attachments' => $this->canUploadAttachments(),
            'max_attachment_size' => $this->maxAttachmentSize(),
            'max_attachment_size_mb' => $this->maxAttachmentSize() / 1024 / 1024,
            'max_attachment_storage' => $this->maxAttachmentStorage(),
            'max_attachment_storage_mb' => $this->maxAttachmentStorage() / 1024 / 1024,
            'allowed_attachment_extensions' => $this->allowedAttachmentExtensions(),
        ];
    }
}
