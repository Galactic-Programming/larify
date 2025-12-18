@extends('errors::layout')

@section('code', '429')
@section('title', __('Too Many Requests'))
@section('description', __('Too many spaceships trying to fly through! Please wait a moment and try again.'))

@section('illustration')
{{-- Space traffic jam with multiple rockets --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Traffic light pole -->
    <rect x="95" y="30" width="10" height="80" fill="var(--text-secondary)" opacity="0.3"/>
    <rect x="85" y="25" width="30" height="50" rx="5" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="2"/>
    <!-- Red light (active) -->
    <circle cx="100" cy="40" r="8" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
    </circle>
    <!-- Yellow light -->
    <circle cx="100" cy="58" r="8" fill="var(--text-secondary)" opacity="0.3"/>
    
    <!-- Queued rockets -->
    <g class="space-float" style="animation-delay: 0s;">
        <!-- Rocket 1 -->
        <path d="M50 100L60 90L70 100L70 120L60 130L50 120Z" fill="var(--accent-primary)" opacity="0.8"/>
        <circle cx="60" cy="105" r="5" fill="var(--accent-glow)"/>
    </g>
    
    <g class="space-float" style="animation-delay: -1s;">
        <!-- Rocket 2 -->
        <path d="M50 140L60 130L70 140L70 160L60 170L50 160Z" fill="var(--accent-secondary)" opacity="0.6"/>
        <circle cx="60" cy="145" r="5" fill="var(--accent-glow)"/>
    </g>
    
    <g class="space-float" style="animation-delay: -2s;">
        <!-- Rocket 3 -->
        <path d="M130 110L140 100L150 110L150 130L140 140L130 130Z" fill="var(--accent-primary)" opacity="0.7"/>
        <circle cx="140" cy="115" r="5" fill="var(--accent-glow)"/>
    </g>
    
    <g class="space-float" style="animation-delay: -0.5s;">
        <!-- Rocket 4 -->
        <path d="M130 150L140 140L150 150L150 170L140 180L130 170Z" fill="var(--accent-secondary)" opacity="0.5"/>
        <circle cx="140" cy="155" r="5" fill="var(--accent-glow)"/>
    </g>
    
    <!-- Wait indicator -->
    <g opacity="0.5">
        <circle cx="100" cy="160" r="20" stroke="var(--text-secondary)" stroke-width="2" fill="none" stroke-dasharray="5 3"/>
        <path d="M100 145V160L110 167" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round"/>
    </g>
</svg>
@endsection
