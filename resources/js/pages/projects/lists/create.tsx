import { index } from '@/routes/projects/lists';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

interface Props {
    project: { id: number };
}

/**
 * This page redirects to the lists index.
 * The create list dialog is handled inline on the lists index page.
 */
export default function CreateList({ project }: Props) {
    useEffect(() => {
        router.visit(index(project).url);
    }, [project]);

    return null;
}
