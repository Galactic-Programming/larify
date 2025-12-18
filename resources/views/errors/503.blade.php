@extends('errors::layout')

@section('code', '503')
@section('title', __('Service Unavailable'))
@section('description', __('The spaceship is under maintenance and upgrade! Please come back in a few minutes.'))

@section('illustration')
{{-- Rocket under maintenance --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Maintenance platform -->
    <rect x="30" y="160" width="140" height="8" rx="2" fill="var(--text-secondary)" opacity="0.3"/>
    <rect x="50" y="150" width="6" height="10" fill="var(--text-secondary)" opacity="0.3"/>
    <rect x="144" y="150" width="6" height="10" fill="var(--text-secondary)" opacity="0.3"/>
    
    <!-- Rocket on platform -->
    <g>
        <!-- Body -->
        <path d="M100 40L125 70L125 140L100 155L75 140L75 70Z" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="2"/>
        <!-- Nose -->
        <path d="M100 40L118 60H82Z" fill="var(--accent-primary)"/>
        <!-- Window -->
        <circle cx="100" cy="90" r="15" fill="var(--accent-glow)" stroke="var(--accent-secondary)" stroke-width="2"/>
        <!-- Fins -->
        <path d="M75 125L55 155L75 145Z" fill="var(--accent-primary)"/>
        <path d="M125 125L145 155L125 145Z" fill="var(--accent-primary)"/>
        <!-- Panel open -->
        <rect x="85" y="110" width="30" height="25" rx="2" fill="var(--bg-primary)" stroke="var(--accent-secondary)" stroke-width="1" stroke-dasharray="3 2"/>
        <!-- Wires -->
        <path d="M90 115Q85 120 92 125" stroke="var(--accent-secondary)" stroke-width="1.5" fill="none"/>
        <path d="M100 115Q105 122 98 128" stroke="var(--accent-primary)" stroke-width="1.5" fill="none"/>
        <path d="M110 115Q112 118 108 125" stroke="var(--accent-secondary)" stroke-width="1.5" fill="none"/>
    </g>
    
    <!-- Tools floating -->
    <g opacity="0.6">
        <!-- Wrench -->
        <g transform="translate(45, 80) rotate(-30)">
            <rect x="0" y="0" width="25" height="6" rx="1" fill="var(--text-secondary)"/>
            <circle cx="25" cy="3" r="8" stroke="var(--text-secondary)" stroke-width="2" fill="none"/>
        </g>
        
        <!-- Screwdriver -->
        <g transform="translate(145, 90) rotate(20)">
            <rect x="0" y="0" width="20" height="4" fill="var(--accent-primary)"/>
            <rect x="20" y="-1" width="8" height="6" fill="var(--text-secondary)"/>
        </g>
    </g>
    
    <!-- Construction sign -->
    <g transform="translate(155, 50)">
        <rect x="0" y="0" width="30" height="25" rx="3" fill="var(--accent-primary)"/>
        <text x="15" y="17" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="bold">!</text>
    </g>
    
    <!-- Progress bar -->
    <g>
        <rect x="60" y="175" width="80" height="6" rx="3" fill="var(--bg-secondary)"/>
        <rect x="60" y="175" width="50" height="6" rx="3" fill="var(--accent-primary)">
            <animate attributeName="width" values="20;60;20" dur="2s" repeatCount="indefinite"/>
        </rect>
    </g>
</svg>
@endsection
