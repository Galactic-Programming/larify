<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Message Edit Time Limit
    |--------------------------------------------------------------------------
    |
    | The number of minutes after sending a message during which users
    | can still edit their messages. After this time limit, messages
    | become read-only.
    |
    */

    'edit_time_limit' => env('CHAT_EDIT_TIME_LIMIT', 15),

    /*
    |--------------------------------------------------------------------------
    | Maximum Attachments Per Message
    |--------------------------------------------------------------------------
    |
    | The maximum number of file attachments allowed per message.
    |
    */

    'max_attachments' => env('CHAT_MAX_ATTACHMENTS', 10),

    /*
    |--------------------------------------------------------------------------
    | Maximum Attachment Size
    |--------------------------------------------------------------------------
    |
    | The maximum file size (in kilobytes) for each attachment.
    | Default: 10240 KB (10 MB)
    |
    */

    'max_attachment_size' => env('CHAT_MAX_ATTACHMENT_SIZE', 10240),

    /*
    |--------------------------------------------------------------------------
    | Maximum Message Length
    |--------------------------------------------------------------------------
    |
    | The maximum number of characters allowed in a message.
    |
    */

    'max_message_length' => env('CHAT_MAX_MESSAGE_LENGTH', 10000),

    /*
    |--------------------------------------------------------------------------
    | Messages Per Page
    |--------------------------------------------------------------------------
    |
    | Number of messages to load per page when paginating.
    |
    */

    'messages_per_page' => env('CHAT_MESSAGES_PER_PAGE', 50),

    /*
    |--------------------------------------------------------------------------
    | Attachment Storage Disk
    |--------------------------------------------------------------------------
    |
    | The filesystem disk to use for storing message attachments.
    |
    */

    'attachment_disk' => env('CHAT_ATTACHMENT_DISK', 'public'),

];
