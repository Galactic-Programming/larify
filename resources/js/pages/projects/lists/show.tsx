import { index } from '@/routes/projects/lists';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

interface Props {
    project: { id: number };
}

/**
 * This page redirects to the lists index.
 * Lists are displayed in the Kanban board view.
 */
export default function ShowList({ project }: Props) {
    useEffect(() => {
        router.visit(index(project).url);
    }, [project]);

    return null;
}
