@extends('errors::layout')

@section('code', '401')
@section('title', __('Unauthorized'))
@section('description', __('You need to log in to access this area. Please authenticate to continue exploring the universe!'))

@section('illustration')
{{-- Astronaut locked out of spaceship --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Spaceship door -->
    <rect x="110" y="40" width="60" height="100" rx="8" fill="var(--bg-secondary)" stroke="var(--accent-secondary)" stroke-width="2"/>
    <rect x="120" y="55" width="40" height="50" rx="4" fill="var(--accent-glow)"/>
    <circle cx="155" cy="100" r="5" fill="var(--accent-primary)"/>
    
    <!-- Lock icon on door -->
    <rect x="132" y="70" width="16" height="12" rx="2" fill="var(--accent-primary)"/>
    <path d="M135 70V65a5 5 0 0110 0v5" stroke="var(--accent-primary)" stroke-width="2" fill="none"/>
    
    <!-- Astronaut -->
    <g class="space-float">
        <!-- Helmet -->
        <circle cx="60" cy="80" r="28" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="2"/>
        <circle cx="60" cy="80" r="20" fill="var(--accent-glow)"/>
        <!-- Visor reflection -->
        <path d="M50 72a15 15 0 0120 0" stroke="var(--text-primary)" stroke-width="1" opacity="0.5" fill="none"/>
        <!-- Body -->
        <rect x="42" y="105" width="36" height="45" rx="8" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="2"/>
        <!-- Arms reaching -->
        <path d="M78 115L100 100" stroke="var(--text-secondary)" stroke-width="6" stroke-linecap="round"/>
        <path d="M42 120L30 130" stroke="var(--text-secondary)" stroke-width="6" stroke-linecap="round"/>
        <!-- Legs -->
        <path d="M50 150L45 175" stroke="var(--text-secondary)" stroke-width="6" stroke-linecap="round"/>
        <path d="M70 150L75 175" stroke="var(--text-secondary)" stroke-width="6" stroke-linecap="round"/>
        <!-- Question marks -->
        <text x="85" y="60" fill="var(--accent-secondary)" font-size="16" font-weight="bold">?</text>
        <text x="95" y="50" fill="var(--accent-primary)" font-size="12" font-weight="bold">?</text>
    </g>
</svg>
@endsection
