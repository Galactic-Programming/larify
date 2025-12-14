import { index } from '@/routes/projects';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function ProjectShow() {
    useEffect(() => {
        router.visit(index().url);
    }, []);

    return null;
}
