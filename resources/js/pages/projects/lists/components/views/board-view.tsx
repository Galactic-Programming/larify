import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Circle, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Project, Task, TaskList } from '../../lib/types';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { TaskCard } from '../../tasks/components/task-card';
import { TaskDetailSheet } from '../../tasks/components/task-detail-sheet';
import { CreateListDialog } from '../create-list-dialog';
import { ListDropdownMenu } from '../list-dropdown-menu';

interface BoardViewProps {
    project: Project;
    onEditList: (list: TaskList) => void;
    onDeleteList: (list: TaskList) => void;
}

export function BoardView({ project, onEditList, onDeleteList }: BoardViewProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    return (
        <>
            <ScrollArea className="flex-1 pb-4">
            <div className="flex gap-4 pb-4">
                {project.lists.map((list, listIdx) => (
                    <motion.div
                        key={list.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: listIdx * 0.1 }}
                        className="w-80 shrink-0"
                    >
                        <Card className="flex h-fit max-h-[calc(100vh-280px)] flex-col bg-muted/30">
                            {/* List Header */}
                            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="size-3 rounded-full"
                                        style={{ backgroundColor: project.color }}
                                    />
                                    <CardTitle className="text-base font-semibold">{list.name}</CardTitle>
                                    <Badge variant="secondary" className="ml-1">
                                        {list.tasks.length}
                                    </Badge>
                                </div>
                                <ListDropdownMenu
                                    project={project}
                                    list={list}
                                    onEdit={onEditList}
                                    onDelete={onDeleteList}
                                />
                            </CardHeader>

                            {/* Tasks */}
                            <CardContent className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
                                {list.tasks.length > 0 ? (
                                    list.tasks.map((task, taskIdx) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            project={project}
                                            index={taskIdx}
                                            variant="board"
                                            onClick={setSelectedTask}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                        <Circle className="mb-2 size-8 text-muted-foreground/50" />
                                        <p className="text-sm text-muted-foreground">No tasks yet</p>
                                        <CreateTaskDialog
                                            project={project}
                                            list={list}
                                            trigger={
                                                <Button variant="ghost" size="sm" className="mt-2 gap-1">
                                                    <Plus className="size-3" />
                                                    Add task
                                                </Button>
                                            }
                                        />
                                    </div>
                                )}

                                {/* Add Task Button */}
                                {list.tasks.length > 0 && (
                                    <CreateTaskDialog
                                        project={project}
                                        list={list}
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
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}

                {/* Add List Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: project.lists.length * 0.1 }}
                    className="w-80 shrink-0"
                >
                    <CreateListDialog
                        project={project}
                        trigger={
                            <Card className="flex h-32 cursor-pointer items-center justify-center border-dashed bg-muted/20 transition-all hover:border-primary hover:bg-muted/40">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Plus className="size-8" />
                                    <span className="font-medium">Add new list</span>
                                </div>
                            </Card>
                        }
                    />
                </motion.div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>

            {/* Task Detail Sheet */}
            <TaskDetailSheet
                task={selectedTask}
                project={project}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            />
        </>
    );
}
