// import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/pages/projects/components/create-project-dialog';
import { FolderKanban } from 'lucide-react';
import { motion } from 'motion/react';

export function ProjectsHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-4">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25"
                >
                    <FolderKanban className="size-7" />
                </motion.div>
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight md:text-3xl"
                    >
                        Projects
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-muted-foreground"
                    >
                        Manage and organize your projects
                    </motion.p>
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
            >
                <CreateProjectDialog />
            </motion.div>
        </motion.div>
    );
}
