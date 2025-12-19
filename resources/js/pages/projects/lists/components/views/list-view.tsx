import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskRealtime } from '@/hooks/use-task-realtime';
import { Circle, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useCallback } from 'react';
import type { Permissions, Project, Task, TaskList } from '../../lib/types';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { TaskCard } from '../../tasks/components/task-card';
import { TaskDetailSheet } from '../../tasks/components/task-detail-sheet';
import { CreateListDialog } from '../create-list-dialog';
import { ListDropdownMenu } from '../list-dropdown-menu';

interface ListViewProps {
    project: Project;
    permissions: Permissions;
    onEditList: (list: TaskList) => void;
    onDeleteList: (list: TaskList) => void;
}

export function ListView({ project, permissions, onEditList, onDeleteList }: ListViewProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Handle task deletion from real-time updates - close sheet if viewing deleted task
    const handleTaskDeleted = useCallback((taskId: number) => {
        if (selectedTask?.id === taskId) {
            setSelectedTask(null);
        }
    }, [selectedTask?.id]);

    // Real-time updates with task deletion handler
    useTaskRealtime({
        projectId: project.id,
        autoRefresh: true,
        onTaskDeleted: handleTaskDeleted,
    });

    return (
        <>
            <ScrollArea className="flex-1">
                <div className="mx-auto max-w-4xl space-y-4">
                    <Accordion
                        type="multiple"
                        defaultValue={project.lists.map((list) => `list-${list.id}`)}
                        className="space-y-4"
                    >
                        {project.lists.map((list, listIdx) => (
                            <motion.div
                                key={list.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: listIdx * 0.1 }}
                            >
                                <AccordionItem
                                    value={`list-${list.id}`}
                                    className="rounded-lg border bg-card px-0"
                                >
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>.chevron]:rotate-180">
                                        <div className="flex flex-1 items-center justify-between pr-2">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="size-3 rounded-full"
                                                    style={{ backgroundColor: project.color }}
                                                />
                                                <span className="max-w-[16ch] truncate text-base font-semibold" title={list.name}>{list.name}</span>
                                                <Badge variant="secondary">{list.tasks.length}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {list.tasks.filter((t) => t.completed_at).length}/
                                                    {list.tasks.length} done
                                                </Badge>
                                                <ListDropdownMenu
                                                    project={project}
                                                    list={list}
                                                    permissions={permissions}
                                                    onEdit={onEditList}
                                                    onDelete={onDeleteList}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-0">
                                        {list.tasks.length > 0 ? (
                                            <div className="space-y-2">
                                                {list.tasks.map((task, taskIdx) => (
                                                    <TaskCard
                                                        key={task.id}
                                                        task={task}
                                                        project={project}
                                                        index={taskIdx}
                                                        variant="list"
                                                        onClick={setSelectedTask}
                                                        permissions={permissions}
                                                    />
                                                ))}
                                                {/* Add task button - Only for editors */}
                                                {permissions.canEdit && (
                                                    <CreateTaskDialog
                                                        project={project}
                                                        list={list}
                                                        canAssignTask={permissions.canAssignTask}
                                                        trigger={
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Plus className="size-4" />
                                                                Add task
                                                            </Button>
                                                        }
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-6 text-center">
                                                <Circle className="mb-2 size-6 text-muted-foreground/50" />
                                                <p className="text-sm text-muted-foreground">No tasks in this list</p>
                                                {permissions.canEdit && (
                                                    <CreateTaskDialog
                                                        project={project}
                                                        list={list}
                                                        canAssignTask={permissions.canAssignTask}
                                                        trigger={
                                                            <Button variant="ghost" size="sm" className="mt-2 gap-1">
                                                                <Plus className="size-3" />
                                                                Add task
                                                            </Button>
                                                        }
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>

                    {/* Add new list button at bottom - Only for editors */}
                    {permissions.canEdit && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: project.lists.length * 0.1 }}
                        >
                            <CreateListDialog
                                project={project}
                                trigger={
                                    <Card className="flex cursor-pointer items-center justify-center border-dashed bg-muted/20 py-6 transition-all hover:border-primary hover:bg-muted/40">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Plus className="size-5" />
                                            <span className="font-medium">Add new list</span>
                                        </div>
                                    </Card>
                                }
                            />
                        </motion.div>
                    )}
                </div>
            </ScrollArea>

            {/* Task Detail Sheet */}
            <TaskDetailSheet
                task={selectedTask}
                project={project}
                permissions={permissions}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            />
        </>
    );
}
