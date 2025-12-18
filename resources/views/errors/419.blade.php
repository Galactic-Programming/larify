@extends('errors::layout')

@section('code', '419')
@section('title', __('Page Expired'))
@section('description', __('Your session has expired in space! Please refresh the page to continue.'))

@section('illustration')
{{-- Space hourglass with time running out --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Hourglass frame -->
    <g class="space-float">
        <!-- Top cap -->
        <rect x="65" y="40" width="70" height="10" rx="3" fill="var(--accent-primary)"/>
        <!-- Bottom cap -->
        <rect x="65" y="150" width="70" height="10" rx="3" fill="var(--accent-primary)"/>
        
        <!-- Glass container -->
        <path d="M75 50L75 75Q100 100 100 100Q100 100 125 75L125 50Z" fill="var(--accent-glow)" stroke="var(--accent-secondary)" stroke-width="2"/>
        <path d="M75 150L75 125Q100 100 100 100Q100 100 125 125L125 150Z" fill="var(--accent-glow)" stroke="var(--accent-secondary)" stroke-width="2"/>
        
        <!-- Sand in top (almost empty) -->
        <path d="M85 55L85 60Q100 75 100 75Q100 75 115 60L115 55Z" fill="var(--accent-secondary)" opacity="0.3"/>
        
        <!-- Sand in bottom (almost full) -->
        <path d="M78 150L78 130Q100 115 100 115Q100 115 122 130L122 150Z" fill="var(--accent-secondary)" opacity="0.6"/>
        
        <!-- Falling sand -->
        <line x1="100" y1="80" x2="100" y2="110" stroke="var(--accent-secondary)" stroke-width="2" stroke-dasharray="4 4"/>
    </g>
    
    <!-- Clock icons around -->
    <g opacity="0.4">
        <circle cx="40" cy="70" r="15" stroke="var(--text-secondary)" stroke-width="1" fill="none"/>
        <path d="M40 60V70L47 75" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round"/>
        
        <circle cx="160" cy="130" r="12" stroke="var(--text-secondary)" stroke-width="1" fill="none"/>
        <path d="M160 122V130L165 133" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    
    <!-- Expired text -->
    <text x="100" y="185" text-anchor="middle" fill="var(--text-secondary)" font-size="10" opacity="0.6">TIME OUT</text>
</svg>
@endsection
