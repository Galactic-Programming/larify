@extends('errors::layout')

@section('code', '402')
@section('title', __('Payment Required'))
@section('description', __('The spaceship needs refueling! Please upgrade your plan to continue the journey.'))

@section('illustration')
{{-- Rocket needing fuel/coins --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Rocket -->
    <g class="space-float">
        <!-- Body -->
        <path d="M100 30L120 80L120 140L100 160L80 140L80 80Z" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="2"/>
        <!-- Nose -->
        <path d="M100 30L115 60H85Z" fill="var(--accent-primary)"/>
        <!-- Window -->
        <circle cx="100" cy="90" r="15" fill="var(--accent-glow)" stroke="var(--accent-secondary)" stroke-width="2"/>
        <!-- Fins -->
        <path d="M80 120L60 150L80 140Z" fill="var(--accent-primary)"/>
        <path d="M120 120L140 150L120 140Z" fill="var(--accent-primary)"/>
        <!-- Empty fuel indicator -->
        <rect x="90" y="110" width="20" height="30" rx="2" fill="var(--bg-primary)" stroke="var(--text-secondary)" stroke-width="1"/>
        <rect x="92" y="130" width="16" height="8" rx="1" fill="var(--accent-primary)" opacity="0.3"/>
        <!-- Flame (weak) -->
        <path d="M95 160Q100 175 105 160" stroke="var(--accent-secondary)" stroke-width="2" opacity="0.3" fill="none"/>
    </g>
    
    <!-- Floating coins -->
    <g opacity="0.8">
        <circle cx="45" cy="70" r="12" fill="var(--accent-primary)" stroke="var(--text-primary)" stroke-width="1"/>
        <text x="45" y="75" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="bold">$</text>
        
        <circle cx="155" cy="90" r="10" fill="var(--accent-secondary)" stroke="var(--text-primary)" stroke-width="1"/>
        <text x="155" y="94" text-anchor="middle" fill="var(--text-primary)" font-size="10" font-weight="bold">$</text>
        
        <circle cx="50" cy="130" r="8" fill="var(--accent-primary)" opacity="0.6"/>
        <text x="50" y="133" text-anchor="middle" fill="var(--text-primary)" font-size="8" font-weight="bold">$</text>
    </g>
</svg>
@endsection
