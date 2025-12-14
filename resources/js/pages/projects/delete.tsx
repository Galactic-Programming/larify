import { index } from '@/routes/projects';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * This page redirects to the projects index.
 * The delete dialog is now handled inline on the index page.
 */
export default function DeleteProject() {
    useEffect(() => {
        router.visit(index().url);
    }, []);

    return null;
}
