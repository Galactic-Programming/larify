import { GithubIcon } from 'lucide-react';

const DashboardFooter = () => {
    return (
        <footer className="flex items-center justify-between gap-3 px-4 py-3 text-muted-foreground max-sm:flex-col sm:gap-6 sm:px-6 md:max-lg:flex-col">
            <p className="text-center text-sm text-balance">
                {`©${new Date().getFullYear()}`}{' '}
                <a href="#" className="text-primary">
                    LaraFlow
                </a>
            </p>
            <div className="flex items-center gap-5">
                <a
                    href="https://github.com/Galactic-Programming/flow-state"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <GithubIcon className="size-4" />
                </a>
            </div>
        </footer>
    );
};

export default DashboardFooter;
