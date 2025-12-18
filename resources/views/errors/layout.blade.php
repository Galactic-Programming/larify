<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>@yield('title') - {{ config('app.name', 'Laravel') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />

        <script>
            (function() {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                }
            })();
        </script>

        <style>
            :root {
                --bg-primary: #0f0f23;
                --bg-secondary: #1a1a2e;
                --text-primary: #ffffff;
                --text-secondary: #a0a0c0;
                --accent-primary: #6366f1;
                --accent-secondary: #818cf8;
                --accent-glow: rgba(99, 102, 241, 0.3);
            }

            .light {
                --bg-primary: #e8e8f0;
                --bg-secondary: #f5f5fa;
                --text-primary: #1a1a2e;
                --text-secondary: #4a4a6a;
                --accent-primary: #4f46e5;
                --accent-secondary: #6366f1;
                --accent-glow: rgba(79, 70, 229, 0.2);
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            html, body {
                font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
                background: var(--bg-primary);
                color: var(--text-primary);
                min-height: 100vh;
                overflow-x: hidden;
            }

            /* Stars Background */
            .stars-container {
                position: fixed;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
                z-index: 0;
            }

            .star {
                position: absolute;
                background: var(--text-primary);
                border-radius: 50%;
                animation: twinkle var(--duration, 3s) ease-in-out infinite;
                animation-delay: var(--delay, 0s);
            }

            @keyframes twinkle {
                0%, 100% { opacity: 0.2; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }

            /* Meteor Animation */
            .meteor {
                position: absolute;
                width: 2px;
                height: 80px;
                background: linear-gradient(to bottom, var(--accent-secondary), transparent);
                border-radius: 50%;
                animation: meteor 3s linear infinite;
                opacity: 0;
            }

            .meteor::before {
                content: '';
                position: absolute;
                width: 6px;
                height: 6px;
                background: var(--text-primary);
                border-radius: 50%;
                top: 0;
                left: -2px;
                box-shadow: 0 0 10px var(--accent-secondary);
            }

            .meteor-1 { top: 10%; left: 20%; animation-delay: 0s; }
            .meteor-2 { top: 5%; left: 60%; animation-delay: 1.5s; }
            .meteor-3 { top: 15%; left: 80%; animation-delay: 3s; }

            @keyframes meteor {
                0% { transform: translate(0, 0) rotate(45deg); opacity: 0; }
                10% { opacity: 1; }
                100% { transform: translate(-300px, 300px) rotate(45deg); opacity: 0; }
            }

            /* Nebula Background */
            .nebula {
                position: absolute;
                border-radius: 50%;
                filter: blur(100px);
                opacity: 0.15;
                animation: nebula-pulse 10s ease-in-out infinite;
            }

            .nebula-1 {
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, #6366f1 0%, transparent 70%);
                top: -150px;
                right: -150px;
            }

            .nebula-2 {
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
                bottom: -100px;
                left: -100px;
                animation-delay: -5s;
            }

            @keyframes nebula-pulse {
                0%, 100% { transform: scale(1); opacity: 0.15; }
                50% { transform: scale(1.1); opacity: 0.25; }
            }

            /* Main Container */
            .error-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                position: relative;
                z-index: 10;
            }

            .error-content {
                text-align: center;
                max-width: 380px;
            }

            /* Floating Animation */
            .space-float {
                animation: space-float 6s ease-in-out infinite;
            }

            @keyframes space-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-12px); }
            }

            /* Illustration Container */
            .illustration-container {
                position: relative;
                margin-bottom: 1rem;
            }

            .illustration-container svg {
                width: 120px;
                height: 120px;
                margin: 0 auto;
                display: block;
            }

            /* UFO Beam Animation */
            .ufo-beam {
                animation: beam 2s ease-in-out infinite;
                transform-origin: top;
            }

            @keyframes beam {
                0%, 100% { transform: scaleY(0.9); opacity: 0.3; }
                50% { transform: scaleY(1.1); opacity: 0.6; }
            }

            /* Error Code */
            .error-code {
                font-size: 4.5rem;
                font-weight: 700;
                line-height: 1;
                margin-bottom: 0.5rem;
                background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-secondary) 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: -0.02em;
                text-shadow: 0 0 40px var(--accent-glow);
            }

            .error-code .portal {
                display: inline-block;
                animation: portal-spin 8s linear infinite;
            }

            @keyframes portal-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Error Title */
            .error-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }

            /* Error Description */
            .error-description {
                font-size: 0.875rem;
                color: var(--text-secondary);
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }

            /* Action Buttons */
            .error-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
                padding: 0.625rem 1.25rem;
                font-size: 0.8rem;
                font-weight: 500;
                border-radius: 9999px;
                text-decoration: none;
                transition: all 0.3s ease;
                cursor: pointer;
                border: none;
                outline: none;
            }

            .btn-primary {
                background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
                color: white;
                box-shadow: 0 4px 15px var(--accent-glow);
            }

            .btn-primary:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 8px 25px var(--accent-glow);
            }

            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }

            .btn svg {
                width: 16px;
                height: 16px;
            }

            /* Easter Egg Hint */
            .easter-egg-hint {
                font-size: 0.7rem;
                color: var(--text-secondary);
                opacity: 0.5;
                transition: opacity 0.3s ease;
                cursor: default;
            }

            .easter-egg-hint:hover {
                opacity: 0.8;
            }

            .easter-egg-hint kbd {
                display: inline-block;
                padding: 0.1rem 0.4rem;
                background: var(--bg-secondary);
                border-radius: 4px;
                font-family: inherit;
                font-size: 0.65rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            /* Responsive */
            @media (max-width: 480px) {
                .error-code {
                    font-size: 3.5rem;
                }

                .error-title {
                    font-size: 1.1rem;
                }

                .illustration-container svg {
                    width: 100px;
                    height: 100px;
                }

                .error-actions {
                    flex-direction: column;
                }

                .btn {
                    width: 100%;
                }
            }

            /* Glow effect on color change */
            .color-flash {
                animation: color-flash 0.5s ease;
            }

            @keyframes color-flash {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.5); }
            }
        </style>
    </head>
    <body>
        <!-- Stars Background -->
        <div class="stars-container">
            <!-- Nebulas -->
            <div class="nebula nebula-1"></div>
            <div class="nebula nebula-2"></div>

            <!-- Stars (CSS-based for performance) -->
            @for ($i = 0; $i < 50; $i++)
                <div class="star" style="
                    left: {{ rand(0, 100) }}%;
                    top: {{ rand(0, 100) }}%;
                    width: {{ rand(1, 3) }}px;
                    height: {{ rand(1, 3) }}px;
                    --duration: {{ rand(20, 50) / 10 }}s;
                    --delay: {{ rand(0, 30) / 10 }}s;
                "></div>
            @endfor

            <!-- Meteors -->
            <div class="meteor meteor-1"></div>
            <div class="meteor meteor-2"></div>
            <div class="meteor meteor-3"></div>
        </div>

        <!-- Main Content -->
        <div class="error-container">
            <div class="error-content">
                <!-- Illustration -->
                <div class="illustration-container space-float">
                    @yield('illustration')
                </div>

                <!-- Error Code with Portal Effect -->
                <div class="error-code">
                    @php
                        $code = View::yieldContent('code');
                        $codeStr = str_split($code);
                    @endphp
                    @foreach($codeStr as $index => $digit)
                        @if($digit === '0')
                            <span class="portal">{{ $digit }}</span>
                        @else
                            {{ $digit }}
                        @endif
                    @endforeach
                </div>

                <h1 class="error-title">@yield('title')</h1>
                <p class="error-description">@yield('description')</p>

                <!-- Action Buttons -->
                <div class="error-actions">
                    <a href="{{ url('/') }}" class="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        Go Home
                    </a>
                    <button onclick="history.back()" class="btn btn-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        Go Back
                    </button>
                </div>

                <!-- Easter Egg Hint -->
                <p class="easter-egg-hint">
                    Press <kbd>Space</kbd> for a surprise! 🚀
                </p>
            </div>
        </div>

        <!-- Easter Egg Script -->
        <script>
            document.addEventListener('keydown', function(e) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    const hue = Math.floor(Math.random() * 360);
                    document.documentElement.style.setProperty('--accent-primary', `hsl(${hue}, 70%, 55%)`);
                    document.documentElement.style.setProperty('--accent-secondary', `hsl(${hue + 30}, 70%, 65%)`);
                    document.documentElement.style.setProperty('--accent-glow', `hsla(${hue}, 70%, 55%, 0.3)`);
                    document.body.classList.add('color-flash');
                    setTimeout(() => document.body.classList.remove('color-flash'), 500);
                }
            });
        </script>
    </body>
</html>
