// Task attachment types

export interface TaskAttachment {
    id: number;
    original_name: string;
    mime_type: string;
    size: number;
    human_size: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'file';
    extension: string;
    url: string;
    download_url: string;
    uploaded_by: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    created_at: string;
}

export interface AttachmentsResponse {
    attachments: TaskAttachment[];
}

export interface UploadResponse {
    attachments: TaskAttachment[];
    storage_used: number;
}
