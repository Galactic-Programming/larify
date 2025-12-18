@extends('errors::layout')

@section('code', '403')
@section('title', __('Forbidden'))
@section('description', __('This area is protected by an energy shield! You do not have permission to access here.'))

@section('illustration')
{{-- Protected area with force field --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Force field circles -->
    <circle cx="100" cy="100" r="70" stroke="var(--accent-primary)" stroke-width="2" opacity="0.2" stroke-dasharray="10 5"/>
    <circle cx="100" cy="100" r="55" stroke="var(--accent-secondary)" stroke-width="2" opacity="0.3" stroke-dasharray="8 4"/>
    <circle cx="100" cy="100" r="40" stroke="var(--accent-primary)" stroke-width="2" opacity="0.4" stroke-dasharray="6 3"/>
    
    <!-- Shield in center -->
    <path d="M100 55L130 70V100C130 120 115 135 100 145C85 135 70 120 70 100V70Z" 
          fill="var(--accent-glow)" stroke="var(--accent-primary)" stroke-width="2"/>
    
    <!-- X mark on shield -->
    <path d="M90 85L110 105M110 85L90 105" stroke="var(--accent-primary)" stroke-width="4" stroke-linecap="round"/>
    
    <!-- Electric sparks -->
    <g opacity="0.6">
        <path d="M40 80L50 85L45 90L55 95" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round"/>
        <path d="M160 80L150 85L155 90L145 95" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round"/>
        <path d="M100 35L105 45L95 50L100 55" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round"/>
    </g>
    
    <!-- Warning signs -->
    <g opacity="0.5">
        <circle cx="45" cy="140" r="8" fill="var(--accent-primary)"/>
        <text x="45" y="144" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="bold">!</text>
        <circle cx="155" cy="140" r="8" fill="var(--accent-primary)"/>
        <text x="155" y="144" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="bold">!</text>
    </g>
</svg>
@endsection
