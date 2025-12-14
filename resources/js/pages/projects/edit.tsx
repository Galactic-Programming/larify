import { index } from '@/routes/projects';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * This page redirects to the projects index.
 * The edit dialog is now handled inline on the index page.
 */
export default function EditProject() {
    useEffect(() => {
        router.visit(index().url);
    }, []);

    return null;
}
