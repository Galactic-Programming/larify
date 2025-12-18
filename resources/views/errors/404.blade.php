@extends('errors::layout')

@section('code', '404')
@section('title', __('Page Not Found'))
@section('description', __('Looks like this page was abducted by a UFO! Or maybe it never existed in this universe.'))

@section('illustration')
{{-- UFO abducting a webpage --}}
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- UFO -->
    <g class="space-float">
        <!-- Dome -->
        <ellipse cx="100" cy="60" rx="25" ry="15" fill="var(--accent-glow)" stroke="var(--accent-secondary)" stroke-width="2"/>
        <!-- Body -->
        <ellipse cx="100" cy="70" rx="45" ry="12" fill="var(--bg-secondary)" stroke="var(--accent-primary)" stroke-width="2"/>
        <!-- Lights -->
        <circle cx="70" cy="70" r="4" fill="var(--accent-secondary)"/>
        <circle cx="100" cy="73" r="4" fill="var(--accent-primary)"/>
        <circle cx="130" cy="70" r="4" fill="var(--accent-secondary)"/>
        <!-- Beam -->
        <path class="ufo-beam" d="M80 82L60 160L140 160L120 82Z" fill="var(--accent-glow)" opacity="0.4"/>
    </g>
    
    <!-- Floating page being abducted -->
    <g opacity="0.8">
        <rect x="80" y="120" width="40" height="50" rx="3" fill="var(--bg-secondary)" stroke="var(--text-secondary)" stroke-width="1" transform="rotate(-5 100 145)"/>
        <!-- Page lines -->
        <line x1="88" y1="130" x2="112" y2="128" stroke="var(--text-secondary)" stroke-width="2" opacity="0.5"/>
        <line x1="88" y1="138" x2="108" y2="136" stroke="var(--text-secondary)" stroke-width="2" opacity="0.3"/>
        <line x1="88" y1="146" x2="105" y2="144" stroke="var(--text-secondary)" stroke-width="2" opacity="0.3"/>
        <!-- Question mark -->
        <text x="100" y="165" text-anchor="middle" fill="var(--accent-primary)" font-size="14" font-weight="bold">?</text>
    </g>
    
    <!-- Small aliens peeking -->
    <g opacity="0.6">
        <circle cx="90" cy="55" r="5" fill="var(--accent-secondary)"/>
        <circle cx="88" cy="53" r="1.5" fill="var(--text-primary)"/>
        <circle cx="92" cy="53" r="1.5" fill="var(--text-primary)"/>
        
        <circle cx="110" cy="55" r="5" fill="var(--accent-secondary)"/>
        <circle cx="108" cy="53" r="1.5" fill="var(--text-primary)"/>
        <circle cx="112" cy="53" r="1.5" fill="var(--text-primary)"/>
    </g>
</svg>
@endsection
