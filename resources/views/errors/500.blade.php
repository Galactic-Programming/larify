@extends('errors::layout')

@section('code', '500')
@section('title', __('Server Error'))
@section('description', __('The spaceship engine has malfunctioned! We are fixing it, please try again later.'))

@section('illustration')
{{-- Crashed/exploding rocket --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Explosion effects -->
    <g opacity="0.6">
        <circle cx="100" cy="100" r="50" fill="var(--accent-glow)">
            <animate attributeName="r" values="45;55;45" dur="1s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite"/>
        </circle>
        <!-- Explosion rays -->
        <path d="M100 40L105 60L100 55L95 60Z" fill="var(--accent-secondary)"/>
        <path d="M100 160L105 140L100 145L95 140Z" fill="var(--accent-secondary)"/>
        <path d="M40 100L60 105L55 100L60 95Z" fill="var(--accent-secondary)"/>
        <path d="M160 100L140 105L145 100L140 95Z" fill="var(--accent-secondary)"/>
        <path d="M55 55L70 70L65 68L68 65Z" fill="var(--accent-secondary)" opacity="0.7"/>
        <path d="M145 55L130 70L135 68L132 65Z" fill="var(--accent-secondary)" opacity="0.7"/>
        <path d="M55 145L70 130L65 132L68 135Z" fill="var(--accent-secondary)" opacity="0.7"/>
        <path d="M145 145L130 130L135 132L132 135Z" fill="var(--accent-secondary)" opacity="0.7"/>
    </g>
    
    <!-- Broken rocket parts -->
    <g class="space-float">
        <!-- Main body fragment -->
        <path d="M85 80L95 60L105 65L110 90L100 110L85 100Z" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="2" transform="rotate(15 95 85)"/>
        <!-- Nose fragment -->
        <path d="M115 70L130 55L125 80Z" fill="var(--accent-primary)" transform="rotate(-20 122 67)"/>
        <!-- Fin fragment -->
        <path d="M70 120L55 140L75 135Z" fill="var(--accent-primary)" opacity="0.7"/>
        <!-- Window fragment -->
        <circle cx="95" cy="88" r="8" fill="var(--accent-glow)" stroke="var(--accent-secondary)" stroke-width="1"/>
    </g>
    
    <!-- Smoke clouds -->
    <g opacity="0.3">
        <circle cx="70" cy="140" r="15" fill="var(--text-secondary)"/>
        <circle cx="90" cy="150" r="20" fill="var(--text-secondary)"/>
        <circle cx="115" cy="145" r="18" fill="var(--text-secondary)"/>
        <circle cx="130" cy="135" r="12" fill="var(--text-secondary)"/>
    </g>
    
    <!-- Error symbol -->
    <g>
        <circle cx="100" cy="100" r="15" fill="var(--accent-primary)" opacity="0.8"/>
        <path d="M100 92V102M100 106V108" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round"/>
    </g>
</svg>
@endsection
